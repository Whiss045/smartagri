/**
 * DEVICE SERVICE
 * Two responsibilities:
 *   1) HTTP-facing: list devices, assign them to parcels, unassign them.
 *   2) MQTT-facing: validate and process every incoming device message
 *      (registration, sensor readings, valve states).
 * The backend never trusts a device: identity, assignment and channel mapping
 * are re-checked in the database for every message.
 */
import { Op, type Transaction } from "sequelize";
import sequelize from "../../config/database";
import {
  Device,
  Parcel,
  Valve,
  Sensor,
  SensorReading,
  Schedule,
} from "../models";
import { publishCommand } from "./mqtt.service";
import { HttpError, asInt, asText, isRecord } from "../utils/http";

// --- Limits and patterns used to reject bad input early ---------------------
const ONLINE_WINDOW_MS = 120_000; // Device is "online" if seen in the last 2 minutes
const MAX_PAYLOAD_BYTES = 16 * 1024; // Ignore oversized messages
const MAX_ITEMS = 64; // Max readings / valve entries per message
const DEVICE_UID_RE = /^[A-Za-z0-9_-]{3,64}$/; // Allowed characters for a device id
const TOPIC_RE = /^smartagri\/devices\/([^/]+)\/(hello|telemetry|status)$/; // Extracts uid and message kind

// Online status is computed from lastSeenAt (not stored)
export function isOnline(device: Device): boolean {
  return (
    !!device.lastSeenAt &&
    Date.now() - device.lastSeenAt.getTime() < ONLINE_WINDOW_MS
  );
}

// Converts a device row into the JSON the frontend receives, with helper flags added
const toDto = (d: Device) => ({
  ...d.toJSON(),
  assigned: d.parcelId !== null,
  online: isOnline(d),
});

/* ========================= HTTP-facing operations ========================= */

// Lists devices. { unassigned: true } powers the unassigned list; { parcelId } a parcel's grid.
export async function listDevices(
  filter: { unassigned?: boolean; parcelId?: number } = {},
) {
  const where: Record<string, unknown> = {};
  if (filter.unassigned) where.parcelId = null;
  else if (filter.parcelId) where.parcelId = filter.parcelId;

  const devices = await Device.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
  return devices.map(toDto); // each one carries `online`
}

// One device with its mapped valves and sensors
export async function getDevice(id: number) {
  const device = await Device.findByPk(id, {
    include: [
      { model: Valve, as: "valves" },
      { model: Sensor, as: "sensors" },
    ],
  });
  if (!device) throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
  return {
    ...device.toJSON(),
    assigned: device.parcelId !== null,
    online: isOnline(device),
  };
}

// Only the friendly name is editable; identity (deviceUid) never changes
export async function updateDevice(id: number, input: Record<string, unknown>) {
  const device = await Device.findByPk(id);
  if (!device) throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
  if (input.name !== undefined)
    device.name = asText(input.name, "name", { required: false });
  await device.save();
  return toDto(device);
}

// The farmer assigns an unassigned device to a parcel
export async function assignDevice(id: number, input: Record<string, unknown>) {
  const parcelId = asInt(input.parcelId, "parcelId", 1, 4294967295);
  const device = await Device.findByPk(id);
  if (!device) throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");

  const parcel = await Parcel.findByPk(parcelId);
  if (!parcel) throw new HttpError(404, "Parcel not found", "PARCEL_NOT_FOUND");

  // Moving a device between parcels directly is blocked: it would leave valves/sensors
  // pointing at the wrong parcel. It must be unassigned first.
  if (device.parcelId !== null && device.parcelId !== parcelId) {
    throw new HttpError(
      409,
      "Device is already assigned to another parcel. Unassign it first",
    );
  }

  device.parcelId = parcelId;
  if (input.name !== undefined)
    device.name = asText(input.name, "name", { required: false });
  await device.save();
  return toDto(device);
}

// Core release logic, run inside a transaction supplied by the caller (so it can be part of
// a bigger operation such as deleting a parcel). Valves and sensors are DETACHED (they become
// unassigned), never deleted. Schedules of the detached valves are deleted, because a schedule
// needs an assigned valve.
export async function releaseDevice(
  device: Device,
  transaction: Transaction,
): Promise<void> {
  const valves = await Valve.findAll({
    where: { deviceId: device.id },
    transaction,
  });

  // Best effort: close anything reported open before detaching it
  for (const valve of valves) {
    if (valve.state === "on" && valve.channel !== null) {
      try {
        await publishCommand(device.deviceUid, {
          channel: valve.channel,
          action: "off",
          source: "manual",
          ts: Date.now(),
        });
      } catch (err) {
        console.error(
          "[device] could not close valve before release",
          valve.id,
          (err as Error).message,
        );
      }
    }
  }

  if (valves.length > 0) {
    await Schedule.destroy({
      where: { valveId: { [Op.in]: valves.map((v) => v.id) } },
      transaction,
    });
    await Valve.update(
      {
        deviceId: null,
        parcelId: null,
        plotId: null,
        channel: null,
        state: "unknown",
        stateUpdatedAt: null,
      },
      { where: { deviceId: device.id }, transaction },
    );
  }

  await Sensor.update(
    {
      deviceId: null,
      parcelId: null,
      plotId: null,
      channel: null,
      active: false,
    },
    { where: { deviceId: device.id }, transaction }, // readings are untouched
  );
  await device.update({ parcelId: null }, { transaction });
}

// Unassigns a device from its parcel (everything in one transaction)
export async function unassignDevice(id: number) {
  const device = await Device.findByPk(id);
  if (!device) throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");

  await sequelize.transaction((transaction) =>
    releaseDevice(device, transaction),
  );
  return toDto(device);
}

/* =========================== MQTT ingestion ================================ */

// Entry point for EVERY message from the broker. Validates first, then dispatches by kind.
export async function handleIncomingMessage(
  topic: string,
  payload: Buffer,
): Promise<void> {
  // 1) Topic must match our pattern, and the device id must look valid
  const match = TOPIC_RE.exec(topic);
  if (!match) return;

  const [, deviceUid, kind] = match;
  if (!DEVICE_UID_RE.test(deviceUid)) return;

  // 2) Payload size and JSON shape checks
  if (payload.length === 0 || payload.length > MAX_PAYLOAD_BYTES) return;

  let data: unknown;
  try {
    data = JSON.parse(payload.toString("utf8"));
  } catch {
    return; // Not JSON: ignore silently
  }
  if (!isRecord(data)) return;

  // 3) Auto-register: unknown devices are created as UNASSIGNED
  const [device] = await Device.findOrCreate({
    where: { deviceUid },
    defaults: { deviceUid },
  });
  device.lastSeenAt = new Date(); // Any valid message counts as a heartbeat

  // "hello" = device announcing itself (and its firmware version)
  if (kind === "hello") {
    if (typeof data.firmware === "string")
      device.firmwareVersion = data.firmware.slice(0, 32);
    await device.save();
    return;
  }

  await device.save();

  // 4) Unassigned devices are only tracked for presence; their data is ignored
  if (device.parcelId === null) return;

  if (kind === "telemetry") await storeTelemetry(device, data.readings);
  else if (kind === "status") await storeStatus(device, data.valves);
}

// Saves sensor readings, but only for sensors mapped to THIS device in ITS parcel
async function storeTelemetry(device: Device, raw: unknown): Promise<void> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return;

  // Keep only well-formed entries: integer channel, finite numeric value
  const readings: { channel: number; value: number }[] = [];
  for (const r of raw) {
    if (
      isRecord(r) &&
      Number.isInteger(r.channel) &&
      (r.channel as number) >= 0 &&
      typeof r.value === "number" &&
      Number.isFinite(r.value)
    ) {
      readings.push({ channel: r.channel as number, value: r.value });
    }
  }
  if (readings.length === 0) return;

  // Look up sensors registered for this device, parcel and these channels.
  // Anything not found here is simply ignored (unknown or inactive sensor).
  const sensors = await Sensor.findAll({
    where: {
      deviceId: device.id,
      parcelId: device.parcelId,
      active: true,
      channel: { [Op.in]: readings.map((r) => r.channel) },
    },
  });
  const byChannel = new Map(sensors.map((s) => [s.channel, s]));

  // Server time is used: ESP32 clocks are not trusted
  const now = new Date();
  const rows = readings.flatMap((r) => {
    const sensor = byChannel.get(r.channel);
    return sensor
      ? [{ sensorId: sensor.id, value: r.value, recordedAt: now }]
      : [];
  });

  if (rows.length) await SensorReading.bulkCreate(rows); // One INSERT for all rows
}

// Updates valve/pump states reported by the device (on / off / fault)
async function storeStatus(device: Device, raw: unknown): Promise<void> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return;

  const now = new Date();
  for (const v of raw) {
    // Skip anything malformed or with a state we don't recognize
    if (
      !isRecord(v) ||
      !Number.isInteger(v.channel) ||
      (v.state !== "on" && v.state !== "off" && v.state !== "fault")
    ) {
      continue;
    }
    // The WHERE clause enforces device + parcel + channel, so a device can only
    // update equipment actually mapped to it
    await Valve.update(
      { state: v.state, stateUpdatedAt: now },
      {
        where: {
          deviceId: device.id,
          parcelId: device.parcelId as number,
          channel: v.channel as number,
        },
      },
    );
  }
}
