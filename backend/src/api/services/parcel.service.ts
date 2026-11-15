/**
 * PARCEL SERVICE
 * Business logic for parcels: list, read, create, edit, delete.
 */
import { Parcel, Device, Valve, Sensor, Schedule } from "../models";
import { PARCEL_TYPES } from "../models/parcel.model";
import sequelize from "../../config/database";
import { releaseDevice } from "./device.service";
import { HttpError, asEnum, asText } from "../utils/http";

// Dashboard overview: every parcel with its devices, equipment and sensors
export async function listParcels() {
  return Parcel.findAll({
    order: [["name", "ASC"]],
    include: [
      {
        model: Device,
        as: "devices",
        attributes: ["id", "deviceUid", "name", "lastSeenAt"],
      },
      { model: Valve, as: "valves" },
      { model: Sensor, as: "sensors" },
    ],
  });
}

// Detail view of one parcel, including its schedules
export async function getParcel(id: number) {
  const parcel = await Parcel.findByPk(id, {
    include: [
      { model: Device, as: "devices" },
      { model: Valve, as: "valves" },
      { model: Sensor, as: "sensors" },
      { model: Schedule, as: "schedules" },
    ],
  });
  if (!parcel) throw new HttpError(404, "Parcel not found");
  return parcel;
}

// Validates input and creates a parcel
export async function createParcel(input: Record<string, unknown>) {
  return Parcel.create({
    name: asText(input.name, "name") as string,
    type: asEnum(input.type, "type", PARCEL_TYPES),
    location: asText(input.location, "location", { required: false, max: 150 }),
    notes: asText(input.notes, "notes", { required: false, max: 2000 }),
  });
}

// Partial update: only the fields present in the request are changed.
// The parcel type is immutable: it decides whether heating is allowed.
export async function updateParcel(id: number, input: Record<string, unknown>) {
  const parcel = await Parcel.findByPk(id);
  if (!parcel) throw new HttpError(404, "Parcel not found");

  if (input.name !== undefined)
    parcel.name = asText(input.name, "name") as string;
  if (input.location !== undefined) {
    parcel.location = asText(input.location, "location", {
      required: false,
      max: 150,
    });
  }
  if (input.notes !== undefined) {
    parcel.notes = asText(input.notes, "notes", { required: false, max: 2000 });
  }
  await parcel.save();
  return parcel;
}

// Deletes a parcel safely: devices are released first so nothing is left half-linked
// One transaction around the whole deletion: if any step fails, nothing is changed
export async function deleteParcel(id: number): Promise<void> {
  const parcel = await Parcel.findByPk(id);
  if (!parcel) throw new HttpError(404, "Parcel not found");

  await sequelize.transaction(async (transaction) => {
    const devices = await Device.findAll({
      where: { parcelId: id },
      transaction,
    });
    for (const device of devices) await releaseDevice(device, transaction);
    await parcel.destroy({ transaction });
  });
}
