/**
 * VALVE CONTROLLER
 * HTTP layer for valve registration, assignment and control.
 */
import type { Request, Response } from "express";
import * as valveService from "../services/valve.service";
import { bodyOf, idParam, optionalId } from "../utils/http";

// GET /api/valves?parcelId=&plotId=&unassigned=true
export async function list(req: Request, res: Response) {
  res.json(
    await valveService.listValves({
      parcelId: optionalId(req.query.parcelId, "parcelId"),
      plotId: optionalId(req.query.plotId, "plotId"),
      unassigned: req.query.unassigned === "true",
    }),
  );
}

// GET /api/valves/:id
export async function get(req: Request, res: Response) {
  res.json(await valveService.getValve(idParam(req)));
}

// POST /api/valves   { name, kind?, system?, deviceId?, channel?, plotId? }
export async function create(req: Request, res: Response) {
  res.status(201).json(await valveService.createValve(bodyOf(req)));
}

// PUT /api/valves/:id   { name?, plotId? }
export async function update(req: Request, res: Response) {
  res.json(await valveService.updateValve(idParam(req), bodyOf(req)));
}

// DELETE /api/valves/:id   (unassigned valves only)
export async function remove(req: Request, res: Response) {
  await valveService.deleteValve(idParam(req));
  res.status(204).send();
}

// POST /api/valves/:id/assign   { deviceId, channel, plotId? }
export async function assign(req: Request, res: Response) {
  res.json(await valveService.assignValve(idParam(req), bodyOf(req)));
}

// POST /api/valves/:id/unassign
export async function unassign(req: Request, res: Response) {
  res.json(await valveService.unassignValve(idParam(req)));
}

// POST /api/valves/:id/command   { action: "on" | "off" }
// 202 Accepted: the command was SENT; the real state arrives later via MQTT
export async function command(req: Request, res: Response) {
  res
    .status(202)
    .json(
      await valveService.commandValve(
        idParam(req),
        bodyOf(req).action,
        "manual",
      ),
    );
}
