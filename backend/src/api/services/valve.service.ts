/**
 * VALVE SERVICE
 * Manages controllable equipment (valves and pumps) and sends manual commands.
 * Also reused by the scheduler to execute schedules, so manual and automatic
 * control go through the exact same safety checks.
 */
import { Device, Parcel, Schedule, Valve } from "../models";
import { SYSTEMS, VALVE_KINDS } from "../models/valve.model";
import { isOnline } from "./device.service";
import { publishCommand } from "./mqtt.service";
import { HttpError, asEnum, asInt, asText } from "../utils/http";
import { Op } from "sequelize";

export async function listValves(parcelId?: number) {
  return Valve.findAll({
    where: parcelId ? { parcelId } : {}, // Optional filter by parcel
    order: [["name", "ASC"]],
  });
}

export async function getValve(id: number) {
  const valve = await Valve.findByPk(id);
  if (!valve) throw new HttpError(404, "Valve not found");
  return valve;
}

// Maps a device channel to a controllable component of the device's parcel
export async function createValve(input: Record<string, unknown>) {
  const deviceId = asInt(input.deviceId, "deviceId", 1, 4294967295);
  const device = await Device.findByPk(deviceId);
  if (!device) throw new HttpError(404, "Device not found");
  // Components can only be mapped once the device belongs to a parcel
  if (device.parcelId === null)
    throw new HttpError(409, "Assign the device to a parcel first");

  const parcel = await Parcel.findByPk(device.parcelId);
  if (!parcel) throw new HttpError(404, "Parcel not found");

  // Business rule: heating exists only in greenhouses
  const system = asEnum(input.system ?? "irrigation", "system", SYSTEMS);
  if (system === "heating" && parcel.type !== "greenhouse") {
    throw new HttpError(
      400,
      "Heating equipment is only allowed in greenhouses",
    );
  }

  return Valve.create({
    name: asText(input.name, "name") as string,
    deviceId: device.id,
    parcelId: device.parcelId, // Taken from the device, never from the client (keeps data consistent)
    channel: asInt(input.channel, "channel", 0, 255),
    kind: asEnum(input.kind ?? "valve", "kind", VALVE_KINDS),
    system,
    zone: asText(input.zone, "zone", { required: false }),
  });
}

// Only name and zone are editable. Device, channel and system are fixed after creation.
export async function updateValve(id: number, input: Record<string, unknown>) {
  const valve = await getValve(id);
  if (input.name !== undefined)
    valve.name = asText(input.name, "name") as string;
  if (input.zone !== undefined)
    valve.zone = asText(input.zone, "zone", { required: false });
  await valve.save();
  return valve;
}

export async function deleteValve(id: number): Promise<void> {
  const valve = await getValve(id);
  await valve.destroy(); // Its schedules are removed by the CASCADE in models/index.ts
}

// Sends an on/off command to the ESP32. The valve's stored state is NOT changed here:
// it only updates when the device reports back on its status topic, so the dashboard
// always shows the real state of the hardware.
export async function commandValve(
  id: number,
  action: unknown,
  source: "manual" | "schedule" = "manual",
  options: { durationSeconds?: number } = {},
) {
  const act = asEnum(action, "action", ["on", "off"] as const);

  const valve = await getValve(id);
  if (act === "on" && valve.state === "fault") {
    throw new HttpError(409, "Equipment is in a fault state");
  }

  const device = await Device.findByPk(valve.deviceId);
  if (!device || device.parcelId !== valve.parcelId) {
    throw new HttpError(
      409,
      "Device is not assigned to this equipment's parcel",
    );
  }
  if (!isOnline(device)) throw new HttpError(409, "Device is offline");

  try {
    await publishCommand(device.deviceUid, {
      channel: valve.channel,
      action: act,
      source,
      // The ESP32 enforces this itself, so it shuts the valve even if the backend/network is lost
      ...(act === "on" && options.durationSeconds
        ? { durationSeconds: options.durationSeconds }
        : {}),
      ts: Date.now(),
    });
  } catch {
    throw new HttpError(503, "MQTT broker unavailable");
  }

  // Manual control wins: cancel the stop timer of any schedule running on this valve.
  // lastRunDate is untouched, so that schedule will not restart again today.
  if (source === "manual") {
    await Schedule.update(
      { activeUntil: null },
      { where: { valveId: valve.id, activeUntil: { [Op.ne]: null } } },
    );
  }

  return { valveId: valve.id, action: act, status: "sent" };
}
