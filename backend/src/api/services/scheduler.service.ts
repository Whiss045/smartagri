/**
 * SCHEDULER SERVICE
 * Every 30 s: (1) stop expired runs, (2) start due runs, (3) verify that the hardware
 * actually confirmed what we asked. A published command is not proof of execution,
 * so each start/stop is tracked until the valve reports the expected state.
 */
import { Op } from "sequelize";
import { Schedule, Valve } from "../models";
import { commandValve } from "./valve.service";

const TICK_MS = 30_000;
const TIMEZONE = process.env.APP_TIMEZONE ?? "Africa/Tunis";
const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const ACK_TIMEOUT_MS = 60_000; // how long to wait for the valve to report back
const MAX_ATTEMPTS = 3; // command sent at most this many times

type Pending = {
  valveId: number;
  action: "on" | "off";
  sentAt: number;
  attempts: number;
};
// Commands waiting for confirmation, keyed by schedule id.
// Kept in memory: after a backend restart, in-flight commands are simply not verified.
const pending = new Map<number, Pending>();

let timer: NodeJS.Timeout | null = null;
let ticking = false;

export function startScheduler(): void {
  if (timer) return;
  timer = setInterval(() => void tick(), TICK_MS);
  void tick();
  console.log("[scheduler] started");
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: WEEKDAYS[get("weekday")],
  };
}

function track(
  scheduleId: number,
  valveId: number,
  action: "on" | "off",
): void {
  pending.set(scheduleId, { valveId, action, sentAt: Date.now(), attempts: 1 });
}

async function tick(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    const now = new Date();
    await stopExpired(now);
    await startDue(now);
    await verifyCommands(now);
  } catch (err) {
    console.error("[scheduler] tick failed", err);
  } finally {
    ticking = false;
  }
}

async function stopExpired(now: Date): Promise<void> {
  const expired = await Schedule.findAll({
    where: { activeUntil: { [Op.lte]: now } },
  });
  for (const schedule of expired) {
    try {
      await commandValve(schedule.valveId, "off", "schedule");
      await schedule.update({ activeUntil: null });
      track(schedule.id, schedule.valveId, "off"); // wait for the valve to report "off"
    } catch (err) {
      console.error(
        `[scheduler] stop failed for schedule ${schedule.id}:`,
        (err as Error).message,
      );
    }
  }
}

async function startDue(now: Date): Promise<void> {
  const local = localParts(now);
  const candidates = await Schedule.findAll({
    where: { enabled: true, activeUntil: null },
  });

  for (const schedule of candidates) {
    if (schedule.lastRunDate === local.date) continue;
    if (!schedule.daysOfWeek.includes(local.weekday)) continue;

    const [h, m] = schedule.startTime.split(":").map(Number);
    const elapsed = local.minutes - (h * 60 + m);
    if (elapsed < 0 || elapsed >= schedule.durationMinutes) continue;

    const remainingMin = schedule.durationMinutes - elapsed;
    try {
      // durationSeconds lets the ESP32 enforce the stop itself, even if it loses the network
      await commandValve(schedule.valveId, "on", "schedule", {
        durationSeconds: remainingMin * 60,
      });
      await schedule.update({
        lastRunDate: local.date,
        activeUntil: new Date(now.getTime() + remainingMin * 60_000),
      });
      track(schedule.id, schedule.valveId, "on"); // wait for the valve to report "on"
    } catch (err) {
      console.error(
        `[scheduler] start failed for schedule ${schedule.id}:`,
        (err as Error).message,
      );
    }
  }
}

// Confirms that each tracked command was executed, retrying a few times if it was not
async function verifyCommands(now: Date): Promise<void> {
  for (const [scheduleId, p] of pending) {
    if (now.getTime() - p.sentAt < ACK_TIMEOUT_MS) continue; // still within the grace period

    const valve = await Valve.findByPk(p.valveId);
    // Confirmed = the valve reported the expected state AFTER we sent the command
    const confirmed =
      !!valve &&
      valve.state === p.action &&
      !!valve.stateUpdatedAt &&
      valve.stateUpdatedAt.getTime() >= p.sentAt;
    if (!valve || confirmed) {
      pending.delete(scheduleId);
      continue;
    }

    let options: { durationSeconds?: number } = {};

    if (p.action === "on") {
      const schedule = await Schedule.findByPk(scheduleId);
      // Stopped, deleted or overridden manually in the meantime: nothing left to verify
      if (!schedule?.activeUntil) {
        pending.delete(scheduleId);
        continue;
      }
      const remaining = Math.round(
        (schedule.activeUntil.getTime() - now.getTime()) / 1000,
      );
      if (remaining < 1) {
        pending.delete(scheduleId); // window is over; stopExpired takes it from here
        continue;
      }
      if (p.attempts >= MAX_ATTEMPTS) {
        console.error(
          `[scheduler] valve ${p.valveId} never confirmed ON (schedule ${scheduleId}); giving up`,
        );
        await schedule.update({ activeUntil: null }); // lastRunDate stays, so it is not retried today
        pending.delete(scheduleId);
        continue;
      }
      options = { durationSeconds: remaining };
    } else if (p.attempts >= MAX_ATTEMPTS) {
      // A valve that may still be open is the dangerous case, so make it loud
      console.error(
        `[scheduler] CRITICAL: valve ${p.valveId} never confirmed OFF after ${p.attempts} attempts`,
      );
      pending.delete(scheduleId);
      continue;
    }

    try {
      await commandValve(p.valveId, p.action, "schedule", options);
    } catch (err) {
      console.error(
        `[scheduler] resend failed for valve ${p.valveId}:`,
        (err as Error).message,
      );
    }
    p.attempts += 1;
    p.sentAt = now.getTime();
  }
}

// The ESP32 must publish a status message after every command, even when the state didn’t change. Otherwise the check can’t confirm and will resend.
// It must honor durationSeconds on on commands.
// It needs a default maximum run time for manual on commands, which carry no duration.
// The safety check goes at the top of loop(), before any Wi-Fi or MQTT code.
