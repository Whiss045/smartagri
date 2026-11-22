/**
 * VALVE SERVICE
 * Lifecycle: register (unassigned) -> assign to device channel -> control -> unassign -> delete.
 * Manual commands and the scheduler both go through commandValve, so they share every safety check.
 */
import { Op } from "sequelize";
import { Device, Schedule, Valve, type Parcel } from "../models";
import { SYSTEMS, VALVE_KINDS, type SystemType } from "../models/valve.model";
import { isOnline } from "./device.service";
import { publishCommand } from "./mqtt.service";
import { assertPlotInParcel, resolvePlacement } from "./placement.service";
import { HttpError, asEnum, asInt, asText } from "../utils/http";

type ValveWithDevice = Valve & { device?: Device | null };

// Adds `deviceOnline` so the card can disable the control button when the device is offline.
// Only the flag is sent, not the device row.
function toDto(valve: ValveWithDevice) {
  const json = valve.toJSON() as Record<string, unknown>;
  delete json.device;
  return { ...json, deviceOnline: !!valve.device && isOnline(valve.device) };
}

export async function listValves(
  filter: { parcelId?: number; plotId?: number; unassigned?: boolean } = {},
) {
  const where: Record<string, unknown> = {};
  if (filter.parcelId) where.parcelId = filter.parcelId;
  if (filter.plotId) where.plotId = filter.plotId;
  if (filter.unassigned) where.deviceId = null; // the "unassigned valves" list

  const valves = await Valve.findAll({
    where,
    include: [
      { model: Device, as: "device", attributes: ["id", "lastSeenAt"] },
    ],
    order: [["name", "ASC"]],
  });
  return valves.map((v) => toDto(v as ValveWithDevice));
}

// Internal lookup (returns the model so callers can update it)
export async function getValve(id: number) {
  const valve = await Valve.findByPk(id);
  if (!valve) throw new HttpError(404, "Valve not found", "VALVE_NOT_FOUND");
  return valve;
}

// Detail view for GET /valves/:id (DTO with deviceOnline)
export async function getValveDetail(id: number) {
  const valve = await Valve.findByPk(id, {
    include: [
      { model: Device, as: "device", attributes: ["id", "lastSeenAt"] },
    ],
  });
  if (!valve) throw new HttpError(404, "Valve not found", "VALVE_NOT_FOUND");
  return toDto(valve as ValveWithDevice);
}

// Business rule: heating equipment exists only in greenhouses
function assertSystemAllowed(system: SystemType, parcel: Parcel): void {
  if (system === "heating" && parcel.type !== "greenhouse") {
    throw new HttpError(
      400,
      "Heating equipment is only allowed in greenhouses",
      "HEATING_NOT_ALLOWED",
    );
  }
}

async function assertChannelFree(
  deviceId: number,
  channel: number,
): Promise<void> {
  const taken = await Valve.findOne({ where: { deviceId, channel } });
  if (taken) {
    throw new HttpError(
      409,
      `Channel ${channel} is already used by "${taken.name}"`,
      "CHANNEL_IN_USE",
    );
  }
}

// REGISTER a valve. Without deviceId it stays unassigned; with deviceId + channel + plotId
// it is registered and assigned in one step.
export async function createValve(input: Record<string, unknown>) {
  const name = asText(input.name, "name") as string;
  const kind = asEnum(input.kind ?? "valve", "kind", VALVE_KINDS);
  const system = asEnum(input.system ?? "irrigation", "system", SYSTEMS);

  if (input.deviceId === undefined || input.deviceId === null) {
    return Valve.create({ name, kind, system });
  }

  const placement = await resolvePlacement(input);
  assertSystemAllowed(system, placement.parcel);
  await assertChannelFree(placement.device.id, placement.channel);

  return Valve.create({
    name,
    kind,
    system,
    deviceId: placement.device.id,
    parcelId: placement.parcel.id, // taken from the device, never from the client
    channel: placement.channel,
    plotId: placement.plotId,
  });
}

// ASSIGN an unassigned valve to a device channel and a plot
export async function assignValve(id: number, input: Record<string, unknown>) {
  const valve = await getValve(id);
  if (valve.deviceId !== null) {
    throw new HttpError(
      409,
      "Valve is already assigned. Unassign it first",
      "VALVE_ALREADY_ASSIGNED",
    );
  }

  const placement = await resolvePlacement(input);
  assertSystemAllowed(valve.system, placement.parcel);
  await assertChannelFree(placement.device.id, placement.channel);

  await valve.update({
    deviceId: placement.device.id,
    parcelId: placement.parcel.id,
    channel: placement.channel,
    plotId: placement.plotId,
    state: "unknown", // the new device will report the real state
    stateUpdatedAt: null,
  });
  return valve;
}

// UNASSIGN: detach from its device. Refused while schedules exist; closed first if it may be open.
export async function unassignValve(id: number) {
  const valve = await getValve(id);
  if (valve.deviceId === null) {
    throw new HttpError(409, "Valve is not assigned", "VALVE_NOT_ASSIGNED");
  }

  const schedules = await Schedule.count({ where: { valveId: valve.id } });
  if (schedules > 0) {
    throw new HttpError(
      409,
      "Delete this valve's schedules first",
      "VALVE_HAS_SCHEDULES",
    );
  }

  // If the close command cannot be sent, the valve stays assigned (safer than leaving it open)
  if (valve.state === "on") await commandValve(valve.id, "off", "manual");

  await valve.update({
    deviceId: null,
    parcelId: null,
    plotId: null,
    channel: null,
    state: "unknown",
    stateUpdatedAt: null,
  });
  return valve;
}

// Editable: name and plot. Device, channel, kind and system are fixed.
// The plot can be changed but never cleared: an assigned valve always lives in a plot.
export async function updateValve(id: number, input: Record<string, unknown>) {
  const valve = await getValve(id);

  if (input.name !== undefined)
    valve.name = asText(input.name, "name") as string;
  if (input.plotId !== undefined) {
    if (valve.parcelId === null) {
      throw new HttpError(
        409,
        "Assign the valve to a device first",
        "VALVE_NOT_ASSIGNED",
      );
    }
    const plotId = asInt(input.plotId, "plotId", 1, 4294967295);
    await assertPlotInParcel(plotId, valve.parcelId);
    valve.plotId = plotId;
  }
  await valve.save();
  return valve;
}

// Only unassigned valves can be deleted
export async function deleteValve(id: number): Promise<void> {
  const valve = await getValve(id);
  if (valve.deviceId !== null) {
    throw new HttpError(
      409,
      "Unassign the valve before deleting it",
      "VALVE_STILL_ASSIGNED",
    );
  }
  await valve.destroy();
}

// Sends an on/off command to the ESP32. The stored state only changes when the device reports back.
export async function commandValve(
  id: number,
  action: unknown,
  source: "manual" | "schedule" = "manual",
  options: { durationSeconds?: number } = {},
) {
  const act = asEnum(action, "action", ["on", "off"] as const);

  const valve = await getValve(id);
  if (valve.deviceId === null || valve.parcelId === null) {
    throw new HttpError(
      409,
      "Valve is not assigned to a device",
      "VALVE_NOT_ASSIGNED",
    );
  }
  if (act === "on" && valve.state === "fault") {
    throw new HttpError(409, "Equipment is in a fault state", "VALVE_FAULT");
  }

  const device = await Device.findByPk(valve.deviceId);
  if (!device || device.parcelId !== valve.parcelId) {
    throw new HttpError(
      409,
      "Device is not assigned to this equipment's parcel",
      "DEVICE_PARCEL_MISMATCH",
    );
  }
  if (!isOnline(device))
    throw new HttpError(409, "Device is offline", "DEVICE_OFFLINE");

  try {
    await publishCommand(device.deviceUid, {
      channel: valve.channel,
      action: act,
      source,
      // The ESP32 enforces this itself, so it shuts the valve even if the network is lost
      ...(act === "on" && options.durationSeconds
        ? { durationSeconds: options.durationSeconds }
        : {}),
      ts: Date.now(),
    });
  } catch {
    throw new HttpError(503, "MQTT broker unavailable", "BROKER_UNAVAILABLE");
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
