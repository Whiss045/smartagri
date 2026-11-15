/**
 * SCHEDULER SERVICE
 * The engine that EXECUTES schedules. Every 30 seconds it:
 *   1) stops equipment whose schedule duration has ended
 *   2) starts equipment whose schedule is due now
 * Commands go through valve.service, so they use the same checks as manual control.
 */
import { Op } from "sequelize";
import { Schedule } from "../models";
import { commandValve } from "./valve.service";

const TICK_MS = 30_000; // How often the scheduler checks
const TIMEZONE = process.env.APP_TIMEZONE ?? "Africa/Tunis"; // Schedules are written in local farm time
const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

let timer: NodeJS.Timeout | null = null;
let ticking = false; // Guards against two ticks overlapping if one runs slowly

export function startScheduler(): void {
  if (timer) return; // Already running
  timer = setInterval(() => void tick(), TICK_MS);
  void tick(); // Run once immediately at startup
  console.log("[scheduler] started");
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

// Converts a UTC Date into the farm's local date, minutes-since-midnight and weekday
function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23", // 00-23, avoids the "24:00" quirk
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`, // 'YYYY-MM-DD'
    minutes: hour * 60 + minute,
    weekday: WEEKDAYS[get("weekday")],
  };
}

// One scheduler cycle: stop expired runs first, then start due ones
async function tick(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    const now = new Date();
    await stopExpired(now);
    await startDue(now);
  } catch (err) {
    console.error("[scheduler] tick failed", err);
  } finally {
    ticking = false;
  }
}

// Finds running schedules whose time is up and switches their equipment off
async function stopExpired(now: Date): Promise<void> {
  const expired = await Schedule.findAll({
    where: { activeUntil: { [Op.lte]: now } },
  });
  for (const schedule of expired) {
    try {
      await commandValve(schedule.valveId, "off", "schedule");
      await schedule.update({ activeUntil: null });
    } catch (err) {
      // activeUntil is kept, so the next tick retries (e.g. if the device was offline)
      console.error(
        `[scheduler] stop failed for schedule ${schedule.id}:`,
        (err as Error).message,
      );
    }
  }
}

// Finds schedules that should be running right now and switches their equipment on
async function startDue(now: Date): Promise<void> {
  const local = localParts(now);
  // Candidates: enabled and not currently running
  const candidates = await Schedule.findAll({
    where: { enabled: true, activeUntil: null },
  });

  for (const schedule of candidates) {
    if (schedule.lastRunDate === local.date) continue; // Already ran today
    if (!schedule.daysOfWeek.includes(local.weekday)) continue; // Not scheduled for today

    const [h, m] = schedule.startTime.split(":").map(Number);
    const elapsed = local.minutes - (h * 60 + m); // Minutes since the scheduled start

    // Only start inside the schedule's own window (a missed window is skipped, not run late)
    if (elapsed < 0 || elapsed >= schedule.durationMinutes) continue;

    try {
      await commandValve(schedule.valveId, "on", "schedule");
      await schedule.update({
        lastRunDate: local.date,
        // Remaining time = full duration minus what already elapsed (handles late starts after a retry)
        activeUntil: new Date(
          now.getTime() + (schedule.durationMinutes - elapsed) * 60_000,
        ),
      });
    } catch (err) {
      // Not marked as run: retried on the next tick while the window is still open
      console.error(
        `[scheduler] start failed for schedule ${schedule.id}:`,
        (err as Error).message,
      );
    }
  }
}
