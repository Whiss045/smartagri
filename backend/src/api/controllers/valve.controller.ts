/**
 * VALVE CONTROLLER
 * HTTP layer for equipment mapping and MANUAL control (open/close).
 */
import type { Request, Response } from "express";
import * as valveService from "../services/valve.service";
import { bodyOf, idParam, optionalId } from "../utils/http";

// GET /api/valves?parcelId=1
export async function list(req: Request, res: Response) {
  const parcelId = optionalId(req.query.parcelId, "parcelId");
  res.json(await valveService.listValves(parcelId));
}

// GET /api/valves/:id
export async function get(req: Request, res: Response) {
  res.json(await valveService.getValve(idParam(req)));
}

// POST /api/valves (maps a device channel to a valve/pump)
export async function create(req: Request, res: Response) {
  res.status(201).json(await valveService.createValve(bodyOf(req)));
}

// PUT /api/valves/:id
export async function update(req: Request, res: Response) {
  res.json(await valveService.updateValve(idParam(req), bodyOf(req)));
}

// DELETE /api/valves/:id
export async function remove(req: Request, res: Response) {
  await valveService.deleteValve(idParam(req));
  res.status(204).send();
}

// POST /api/valves/:id/command with { "action": "on" | "off" }
// 202 Accepted: the command was SENT; the real state arrives later via MQTT status
export async function command(req: Request, res: Response) {
  const result = await valveService.commandValve(
    idParam(req),
    bodyOf(req).action,
    "manual",
  );
  res.status(202).json(result);
}
