/**
 * PLACEMENT SERVICE
 * One place for the rules about "plugging equipment into a device": used by BOTH valves
 * and sensors, so the rules are written once.
 *   - the device must exist and already belong to a parcel
 *   - the channel must be a valid number
 *   - a plot is REQUIRED and must belong to that same parcel
 */
import { Device, Parcel, Plot } from "../models";
import { HttpError, asInt } from "../utils/http";

export type Placement = {
  device: Device;
  parcel: Parcel;
  channel: number;
  plotId: number; // required: equipment always lives in a plot
};

// A plot can only be used by equipment whose device sits in the plot's own parcel
export async function assertPlotInParcel(
  plotId: number,
  parcelId: number,
): Promise<void> {
  const plot = await Plot.findByPk(plotId);
  if (!plot) throw new HttpError(404, "Plot not found", "PLOT_NOT_FOUND");
  if (plot.parcelId !== parcelId) {
    throw new HttpError(
      409,
      "The plot belongs to a different parcel",
      "PLOT_PARCEL_MISMATCH",
    );
  }
}

// Validates { deviceId, channel, plotId } and returns everything the caller needs
export async function resolvePlacement(
  input: Record<string, unknown>,
): Promise<Placement> {
  const device = await Device.findByPk(
    asInt(input.deviceId, "deviceId", 1, 4294967295),
  );
  if (!device) throw new HttpError(404, "Device not found", "DEVICE_NOT_FOUND");
  if (device.parcelId === null) {
    throw new HttpError(
      409,
      "Assign the device to a parcel first",
      "DEVICE_UNASSIGNED",
    );
  }

  const parcel = await Parcel.findByPk(device.parcelId);
  if (!parcel) throw new HttpError(404, "Parcel not found", "PARCEL_NOT_FOUND");

  const channel = asInt(input.channel, "channel", 0, 255);

  // Equipment is always assigned to a plot, and that plot must be in the device's parcel
  if (
    input.plotId === undefined ||
    input.plotId === null ||
    input.plotId === ""
  ) {
    throw new HttpError(400, "A plot is required", "PLOT_REQUIRED");
  }
  const plotId = asInt(input.plotId, "plotId", 1, 4294967295);
  await assertPlotInParcel(plotId, parcel.id);

  return { device, parcel, channel, plotId };
}
