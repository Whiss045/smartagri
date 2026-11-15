/**
 * SENSOR SERVICE
 * Sensor metadata management plus READ-ONLY access to measurement history.
 * There is intentionally no function here that edits or deletes a reading.
 */
import { Op, WhereOptions } from "sequelize";
import { Device, Sensor, SensorReading } from "../models";
import { SENSOR_TYPES } from "../models/sensor.model";
import { HttpError, asEnum, asInt, asText } from "../utils/http";

// Lists sensors, each with its most recent reading (for dashboard tiles)
export async function listSensors(parcelId?: number) {
  const sensors = await Sensor.findAll({
    where: parcelId ? { parcelId } : {},
    order: [["name", "ASC"]],
  });

  // One small query per sensor to fetch the latest value
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
  if (!sensor) throw new HttpError(404, "Sensor not found");
  return sensor;
}

// Maps a device channel to a sensor of the device's parcel
export async function createSensor(input: Record<string, unknown>) {
  const device = await Device.findByPk(
    asInt(input.deviceId, "deviceId", 1, 4294967295),
  );
  if (!device) throw new HttpError(404, "Device not found");
  if (device.parcelId === null)
    throw new HttpError(409, "Assign the device to a parcel first");

  return Sensor.create({
    name: asText(input.name, "name") as string,
    type: asEnum(input.type, "type", SENSOR_TYPES),
    unit: asText(input.unit, "unit", { max: 16 }) as string,
    deviceId: device.id,
    parcelId: device.parcelId, // Taken from the device, never from the client
    channel: asInt(input.channel, "channel", 0, 255),
    zone: asText(input.zone, "zone", { required: false }),
  });
}

// Metadata only. Sensors cannot be deleted, so their history is never lost.
export async function updateSensor(id: number, input: Record<string, unknown>) {
  const sensor = await getSensor(id);

  if (input.name !== undefined)
    sensor.name = asText(input.name, "name") as string;
  if (input.unit !== undefined)
    sensor.unit = asText(input.unit, "unit", { max: 16 }) as string;
  if (input.zone !== undefined)
    sensor.zone = asText(input.zone, "zone", { required: false });
  if (input.active !== undefined) {
    if (typeof input.active !== "boolean")
      throw new HttpError(400, "active must be a boolean");
    sensor.active = input.active; // false = stop recording new data, keep the old
  }

  await sensor.save();
  return sensor;
}

// Parses an optional ISO date from the query string
function parseDate(v: unknown, field: string): Date | null {
  if (v === undefined || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime()))
    throw new HttpError(400, `${field} must be a valid ISO date`);
  return d;
}

// Read-only history, newest first, with optional date range and a row limit
export async function getReadings(
  sensorId: number,
  query: { from?: unknown; to?: unknown; limit?: unknown },
) {
  await getSensor(sensorId); // 404 if the sensor doesn't exist

  const from = parseDate(query.from, "from");
  const to = parseDate(query.to, "to");
  const limit =
    query.limit === undefined ? 500 : asInt(query.limit, "limit", 1, 5000);

  // Build the WHERE clause piece by piece depending on which filters were sent
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
