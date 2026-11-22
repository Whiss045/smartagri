/**
 * SENSOR SERVICE
 * Lifecycle: register (unassigned) -> assign to device channel -> unassign (history kept).
 * Sensors are NEVER deleted, and there is no function that edits or deletes a reading.
 */
import { Op, type CreationAttributes, type WhereOptions } from "sequelize";
import sequelize from "../../config/database";
import { Sensor, SensorReading } from "../models";
import { SENSOR_TYPES } from "../models/sensor.model";
import { assertPlotInParcel, resolvePlacement } from "./placement.service";
import {
  HttpError,
  asEnum,
  asInt,
  asOptionalInt,
  asText,
  isRecord,
} from "../utils/http";

// Lists sensors with their latest reading (for dashboard tiles)
export async function listSensors(
  filter: { parcelId?: number; plotId?: number; unassigned?: boolean } = {},
) {
  const where: Record<string, unknown> = {};
  if (filter.parcelId) where.parcelId = filter.parcelId;
  if (filter.plotId) where.plotId = filter.plotId;
  if (filter.unassigned) where.deviceId = null; // the "unassigned sensors" list

  const sensors = await Sensor.findAll({ where, order: [["name", "ASC"]] });

  return Promise.all(
    sensors.map(async (sensor) => {
      const latest = await SensorReading.findOne({
        where: { sensorId: sensor.id },
        order: [["recordedAt", "DESC"]],
        attributes: ["value", "recordedAt"],
      });
      return { ...sensor.toJSON(), latestReading: latest };
    }),
  );
}

export async function getSensor(id: number) {
  const sensor = await Sensor.findByPk(id);
  if (!sensor) throw new HttpError(404, "Sensor not found", "SENSOR_NOT_FOUND");
  return sensor;
}

async function assertChannelFree(
  deviceId: number,
  channel: number,
): Promise<void> {
  const taken = await Sensor.findOne({ where: { deviceId, channel } });
  if (taken) {
    throw new HttpError(
      409,
      `Channel ${channel} is already used by "${taken.name}"`,
      "CHANNEL_IN_USE",
    );
  }
}

function parseSensorFields(s: Record<string, unknown>) {
  return {
    name: asText(s.name, "name") as string,
    type: asEnum(s.type, "type", SENSOR_TYPES),
    unit: asText(s.unit, "unit", { max: 16 }) as string,
  };
}

// REGISTER one or several sensors in a single all-or-nothing transaction
// (several = one physical sensor with multiple measurements, such as a DHT22).
// Body: { sensors: [{ name, type, unit, channel? }], deviceId?, plotId? }
// Without deviceId they stay unassigned; with deviceId every entry needs its own channel.
export async function createSensors(input: Record<string, unknown>) {
  const list = input.sensors;
  if (!Array.isArray(list) || list.length === 0 || list.length > 8) {
    throw new HttpError(
      400,
      "sensors must be an array of 1 to 8 items",
      "VALIDATION",
    );
  }
  const assigning = input.deviceId !== undefined && input.deviceId !== null;

  // Validate EVERYTHING first, so a bad entry cannot leave a half-created sensor
  const rows: CreationAttributes<Sensor>[] = [];
  const usedChannels = new Set<number>();
  for (const item of list) {
    if (!isRecord(item))
      throw new HttpError(400, "Invalid sensor entry", "VALIDATION");
    const fields = parseSensorFields(item);

    if (!assigning) {
      rows.push(fields);
      continue;
    }

    const placement = await resolvePlacement({
      deviceId: input.deviceId,
      plotId: input.plotId,
      channel: item.channel,
    });
    if (usedChannels.has(placement.channel)) {
      throw new HttpError(
        409,
        "Two sensors in the request use the same channel",
        "DUPLICATE_CHANNEL",
      );
    }
    usedChannels.add(placement.channel);
    await assertChannelFree(placement.device.id, placement.channel);

    rows.push({
      ...fields,
      deviceId: placement.device.id,
      parcelId: placement.parcel.id, // taken from the device, never from the client
      channel: placement.channel,
      plotId: placement.plotId,
    });
  }

  return sequelize.transaction(async (transaction) => {
    const created: Sensor[] = [];
    for (const row of rows)
      created.push(await Sensor.create(row, { transaction }));
    return created;
  });
}

// Single sensor: same rules, one entry
export async function createSensor(input: Record<string, unknown>) {
  const [sensor] = await createSensors({
    sensors: [input],
    deviceId: input.deviceId,
    plotId: input.plotId,
  });
  return sensor;
}

// ASSIGN an unassigned sensor to a device channel. It starts recording again.
export async function assignSensor(id: number, input: Record<string, unknown>) {
  const sensor = await getSensor(id);
  if (sensor.deviceId !== null) {
    throw new HttpError(
      409,
      "Sensor is already assigned. Unassign it first",
      "SENSOR_ALREADY_ASSIGNED",
    );
  }

  const placement = await resolvePlacement(input);
  await assertChannelFree(placement.device.id, placement.channel);

  await sensor.update({
    deviceId: placement.device.id,
    parcelId: placement.parcel.id,
    channel: placement.channel,
    plotId: placement.plotId,
    active: true,
  });
  return sensor;
}

// UNASSIGN: detach from the device. The sensor and ALL its readings are kept.
export async function unassignSensor(id: number) {
  const sensor = await getSensor(id);
  if (sensor.deviceId === null) {
    throw new HttpError(409, "Sensor is not assigned", "SENSOR_NOT_ASSIGNED");
  }

  await sensor.update({
    deviceId: null,
    parcelId: null,
    plotId: null,
    channel: null,
    active: false,
  });
  return sensor;
}

// Editable: name, unit, active and plot. Type, device and channel are fixed.
export async function updateSensor(id: number, input: Record<string, unknown>) {
  const sensor = await getSensor(id);

  if (input.name !== undefined)
    sensor.name = asText(input.name, "name") as string;
  if (input.unit !== undefined)
    sensor.unit = asText(input.unit, "unit", { max: 16 }) as string;
  if (input.active !== undefined) {
    if (typeof input.active !== "boolean")
      throw new HttpError(400, "active must be a boolean", "VALIDATION");
    sensor.active = input.active;
  }
  if (input.plotId !== undefined) {
    const plotId = asOptionalInt(input.plotId, "plotId", 1, 4294967295);
    if (plotId !== null) {
      if (sensor.parcelId === null) {
        throw new HttpError(
          409,
          "Assign the sensor to a device first",
          "SENSOR_NOT_ASSIGNED",
        );
      }
      await assertPlotInParcel(plotId, sensor.parcelId);
    }
    sensor.plotId = plotId;
  }

  await sensor.save();
  return sensor;
}

function parseDate(v: unknown, field: string): Date | null {
  if (v === undefined || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime()))
    throw new HttpError(400, `${field} must be a valid ISO date`, "VALIDATION");
  return d;
}

// Read-only history, newest first, optional date range and row limit
export async function getReadings(
  sensorId: number,
  query: { from?: unknown; to?: unknown; limit?: unknown },
) {
  await getSensor(sensorId);

  const from = parseDate(query.from, "from");
  const to = parseDate(query.to, "to");
  const limit =
    query.limit === undefined ? 500 : asInt(query.limit, "limit", 1, 5000);

  const conditions: WhereOptions[] = [{ sensorId }];
  if (from) conditions.push({ recordedAt: { [Op.gte]: from } });
  if (to) conditions.push({ recordedAt: { [Op.lte]: to } });

  return SensorReading.findAll({
    where: { [Op.and]: conditions },
    order: [["recordedAt", "DESC"]],
    limit,
    attributes: ["value", "recordedAt"],
  });
}
