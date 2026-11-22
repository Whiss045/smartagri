/**
 * PLOT CONTROLLER
 * HTTP layer for plots. Each handler is one call into plot.service.
 */
import type { Request, Response } from "express";
import * as plotService from "../services/plot.service";
import { bodyOf, idParam, optionalId } from "../utils/http";

// GET /api/plots?parcelId=1
export async function list(req: Request, res: Response) {
  res.json(
    await plotService.listPlots(optionalId(req.query.parcelId, "parcelId")),
  );
}

// GET /api/plots/:id
export async function get(req: Request, res: Response) {
  res.json(await plotService.getPlot(idParam(req)));
}

// POST /api/plots   { parcelId, name, description? }
export async function create(req: Request, res: Response) {
  res.status(201).json(await plotService.createPlot(bodyOf(req)));
}

// PUT /api/plots/:id   { name?, description? }
export async function update(req: Request, res: Response) {
  res.json(await plotService.updatePlot(idParam(req), bodyOf(req)));
}

// DELETE /api/plots/:id   (only when the plot is empty)
export async function remove(req: Request, res: Response) {
  await plotService.deletePlot(idParam(req));
  res.status(204).send();
}
