/**
 * SCHEDULE SERVICE
 * CRUD for irrigation and heating schedules (what the farmer edits in the dashboard).
 * Actual EXECUTION of schedules happens in scheduler.service.ts.
 */
import { Schedule, Valve } from "../models";
import { SYSTEMS } from "../models/valve.model";
import { commandValve } from "./valve.service";
import { HttpError, asEnum, asInt, asText } from "../utils/http";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // Strict 24h "HH:mm"

// Validates a start time string
function parseTime(v: unknown): string {
  if (typeof v !== "string" || !TIME_RE.test(v)) {
    throw new HttpError(400, "startTime must be in HH:mm format");
  }
  return v;
}

// Validates the weekday list, removes duplicates and sorts it
function parseDays(v: unknown): number[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 7) {
    throw new HttpError(
      400,
      "daysOfWeek must be a non-empty array of days (0 = Sunday ... 6 = Saturday)",
    );
  }
  const days = v.map((d) => asInt(d, "daysOfWeek item", 0, 6));
  return [...new Set(days)].sort((a, b) => a - b);
}

// Optional filters let the dashboard show irrigation and heating schedules separately
export async function listSchedules(filter: {
  parcelId?: number;
  system?: unknown;
}) {
  const where: Record<string, unknown> = {};
  if (filter.parcelId) where.parcelId = filter.parcelId;
  if (filter.system !== undefined)
    where.system = asEnum(filter.system, "system", SYSTEMS);
  return Schedule.findAll({ where, order: [["startTime", "ASC"]] });
}

export async function getSchedule(id: number) {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) throw new HttpError(404, "Schedule not found");
  return schedule;
}

// Parcel and system are derived from the valve, so the client can't create a heating
// schedule on an irrigation valve (or the reverse). This keeps the two systems separate.
export async function createSchedule(input: Record<string, unknown>) {
  const valve = await Valve.findByPk(
    asInt(input.valveId, "valveId", 1, 4294967295),
  );
  if (!valve) throw new HttpError(404, "Valve not found");

  return Schedule.create({
    parcelId: valve.parcelId,
    valveId: valve.id,
    system: valve.system,
    name: asText(input.name, "name") as string,
    startTime: parseTime(input.startTime),
    durationMinutes: asInt(input.durationMinutes, "durationMinutes", 1, 1440),
    daysOfWeek: parseDays(input.daysOfWeek),
    enabled: input.enabled === undefined ? true : input.enabled === true,
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
      throw new HttpError(400, "enabled must be a boolean");
    schedule.enabled = input.enabled;
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
