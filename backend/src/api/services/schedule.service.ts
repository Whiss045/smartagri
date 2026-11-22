/**
 * SCHEDULE SERVICE
 * CRUD for irrigation and heating schedules (what the farmer edits in the dashboard).
 * Actual EXECUTION of schedules happens in scheduler.service.ts.
 */
import { Op } from "sequelize";
import { Schedule, Valve } from "../models";
import { SYSTEMS } from "../models/valve.model";
import { commandValve } from "./valve.service";
import { HttpError, asEnum, asInt, asText } from "../utils/http";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // Strict 24h "HH:mm"
const DAY = 1440; // minutes
const WEEK = 7 * DAY;

// Validates a start time string
function parseTime(v: unknown): string {
  if (typeof v !== "string" || !TIME_RE.test(v)) {
    throw new HttpError(400, "startTime must be in HH:mm format", "VALIDATION");
  }
  return v;
}

// Validates the weekday list, removes duplicates and sorts it
function parseDays(v: unknown): number[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 7) {
    throw new HttpError(
      400,
      "daysOfWeek must be a non-empty array of days (0 = Sunday ... 6 = Saturday)",
      "VALIDATION",
    );
  }
  const days = v.map((d) => asInt(d, "daysOfWeek item", 0, 6));
  return [...new Set(days)].sort((a, b) => a - b);
}

/* ------------------------- Overlap detection ------------------------- */

// Each run becomes an interval [start, end) on a weekly timeline measured in minutes
function runsOf(
  days: number[],
  startTime: string,
  durationMinutes: number,
): [number, number][] {
  const [h, m] = startTime.split(":").map(Number);
  return days.map((d) => {
    const start = d * DAY + h * 60 + m;
    return [start, start + durationMinutes];
  });
}

// The week is circular: a Saturday-night run can spill into Sunday morning
function overlaps(a: [number, number], b: [number, number]): boolean {
  return [-WEEK, 0, WEEK].some(
    (shift) => a[0] < b[1] + shift && b[0] + shift < a[1],
  );
}

// Rejects the change if it collides with another enabled schedule on the same valve
async function assertNoOverlap(
  valveId: number,
  days: number[],
  startTime: string,
  durationMinutes: number,
  ignoreId?: number,
): Promise<void> {
  const others = await Schedule.findAll({
    where: {
      valveId,
      enabled: true,
      ...(ignoreId ? { id: { [Op.ne]: ignoreId } } : {}),
    },
  });
  const mine = runsOf(days, startTime, durationMinutes);

  for (const other of others) {
    const theirs = runsOf(
      other.daysOfWeek,
      other.startTime,
      other.durationMinutes,
    );
    if (mine.some((a) => theirs.some((b) => overlaps(a, b)))) {
      throw new HttpError(
        409,
        `Overlaps with the schedule "${other.name}" on the same valve`,
        "SCHEDULE_OVERLAP",
      );
    }
  }
}

/* ----------------------- Schedule operations ------------------------ */

// Optional filters let the dashboard show irrigation and heating schedules separately.
// Each schedule carries its valve's name so the card can display it without another request.
export async function listSchedules(filter: {
  parcelId?: number;
  system?: unknown;
}) {
  const where: Record<string, unknown> = {};
  if (filter.parcelId) where.parcelId = filter.parcelId;
  if (filter.system !== undefined)
    where.system = asEnum(filter.system, "system", SYSTEMS);

  return Schedule.findAll({
    where,
    include: [
      { model: Valve, as: "valve", attributes: ["id", "name", "plotId"] },
    ],
    order: [["startTime", "ASC"]],
  });
}

export async function getSchedule(id: number) {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) throw new HttpError(404, "Schedule not found");
  return schedule;
}

// Parcel and system are derived from the valve, so the client can't create a heating
// schedule on an irrigation valve (or the reverse). The valve must be assigned to a device.
export async function createSchedule(input: Record<string, unknown>) {
  const valve = await Valve.findByPk(
    asInt(input.valveId, "valveId", 1, 4294967295),
  );
  if (!valve) throw new HttpError(404, "Valve not found", "VALVE_NOT_FOUND");
  if (valve.parcelId === null) {
    throw new HttpError(
      409,
      "Assign the valve to a device before scheduling it",
      "VALVE_NOT_ASSIGNED",
    );
  }

  const name = asText(input.name, "name") as string;
  const startTime = parseTime(input.startTime);
  const durationMinutes = asInt(
    input.durationMinutes,
    "durationMinutes",
    1,
    1440,
  );
  const daysOfWeek = parseDays(input.daysOfWeek);
  const enabled = input.enabled === undefined ? true : input.enabled === true;

  // A disabled schedule never runs, so it can't conflict
  if (enabled)
    await assertNoOverlap(valve.id, daysOfWeek, startTime, durationMinutes);

  return Schedule.create({
    parcelId: valve.parcelId,
    valveId: valve.id,
    system: valve.system,
    name,
    startTime,
    durationMinutes,
    daysOfWeek,
    enabled,
  });
}

// Partial update. The valve cannot be changed (delete and recreate instead).
export async function updateSchedule(
  id: number,
  input: Record<string, unknown>,
) {
  const schedule = await getSchedule(id);

  if (input.name !== undefined)
    schedule.name = asText(input.name, "name") as string;
  if (input.startTime !== undefined)
    schedule.startTime = parseTime(input.startTime);
  if (input.durationMinutes !== undefined) {
    schedule.durationMinutes = asInt(
      input.durationMinutes,
      "durationMinutes",
      1,
      1440,
    );
  }
  if (input.daysOfWeek !== undefined)
    schedule.daysOfWeek = parseDays(input.daysOfWeek);
  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean")
      throw new HttpError(400, "enabled must be a boolean", "VALIDATION");
    schedule.enabled = input.enabled;
  }

  // An enabled schedule may not overlap another enabled one on the same valve
  if (schedule.enabled) {
    await assertNoOverlap(
      schedule.valveId,
      schedule.daysOfWeek,
      schedule.startTime,
      schedule.durationMinutes,
      schedule.id, // ignore itself
    );
  }

  // If the schedule is running right now and the farmer disables or retimes it,
  // stop the equipment so it doesn't keep running with stale timing
  if (
    schedule.activeUntil &&
    (!schedule.enabled || input.startTime || input.durationMinutes)
  ) {
    await stopRunning(schedule);
  }

  await schedule.save();
  return schedule;
}

export async function deleteSchedule(id: number): Promise<void> {
  const schedule = await getSchedule(id);
  if (schedule.activeUntil) await stopRunning(schedule); // Don't leave a valve open with no schedule
  await schedule.destroy();
}

// Sends an "off" command for a running schedule.
// Best effort: if the command fails, activeUntil is kept so the scheduler retries.
async function stopRunning(schedule: Schedule): Promise<void> {
  try {
    await commandValve(schedule.valveId, "off", "schedule");
    schedule.activeUntil = null;
  } catch (err) {
    console.error(
      "[schedule] could not stop running schedule",
      schedule.id,
      (err as Error).message,
    );
  }
}
