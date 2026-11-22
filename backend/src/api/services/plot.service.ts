/**
 * PLOT SERVICE
 * CRUD for plots. A plot belongs to one parcel for life (the parcel cannot be changed),
 * and it cannot be deleted while it still contains equipment.
 */
import { Parcel, Plot, Sensor, Valve } from "../models";
import { HttpError, asInt, asText } from "../utils/http";

// Adds the counters the PlotCard needs
async function toDto(plot: Plot) {
  const [valveCount, sensorCount] = await Promise.all([
    Valve.count({ where: { plotId: plot.id } }),
    Sensor.count({ where: { plotId: plot.id } }),
  ]);
  return { ...plot.toJSON(), valveCount, sensorCount };
}

async function findPlot(id: number): Promise<Plot> {
  const plot = await Plot.findByPk(id);
  if (!plot) throw new HttpError(404, "Plot not found", "PLOT_NOT_FOUND");
  return plot;
}

async function assertNameFree(
  parcelId: number,
  name: string,
  ignoreId?: number,
): Promise<void> {
  const same = await Plot.findOne({ where: { parcelId, name } });
  if (same && same.id !== ignoreId) {
    throw new HttpError(
      409,
      "This parcel already has a plot with that name",
      "PLOT_NAME_TAKEN",
    );
  }
}

export async function listPlots(parcelId?: number) {
  const plots = await Plot.findAll({
    where: parcelId ? { parcelId } : {},
    order: [["name", "ASC"]],
  });
  return Promise.all(plots.map(toDto));
}

export async function getPlot(id: number) {
  return toDto(await findPlot(id));
}

export async function createPlot(input: Record<string, unknown>) {
  const parcelId = asInt(input.parcelId, "parcelId", 1, 4294967295);
  const parcel = await Parcel.findByPk(parcelId);
  if (!parcel) throw new HttpError(404, "Parcel not found", "PARCEL_NOT_FOUND");

  const name = asText(input.name, "name") as string;
  await assertNameFree(parcelId, name);

  const plot = await Plot.create({
    parcelId,
    name,
    description: asText(input.description, "description", {
      required: false,
      max: 500,
    }),
  });
  return toDto(plot);
}

// The parcel is immutable; only name and description can change
export async function updatePlot(id: number, input: Record<string, unknown>) {
  const plot = await findPlot(id);

  if (input.name !== undefined) {
    const name = asText(input.name, "name") as string;
    await assertNameFree(plot.parcelId, name, plot.id);
    plot.name = name;
  }
  if (input.description !== undefined) {
    plot.description = asText(input.description, "description", {
      required: false,
      max: 500,
    });
  }
  await plot.save();
  return toDto(plot);
}

// Blocked while equipment is placed in it: the farmer must move or unassign it first
export async function deletePlot(id: number): Promise<void> {
  const plot = await findPlot(id);
  const [valves, sensors] = await Promise.all([
    Valve.count({ where: { plotId: plot.id } }),
    Sensor.count({ where: { plotId: plot.id } }),
  ]);
  if (valves + sensors > 0) {
    throw new HttpError(
      409,
      "The plot still contains equipment",
      "PLOT_NOT_EMPTY",
    );
  }
  await plot.destroy();
}
