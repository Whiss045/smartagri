/**
 * VALVE CONTROLLER
 * HTTP layer for equipment mapping and MANUAL control (open/close).
 */
import type { Request, Response } from "express";
import * as valveService from "../services/valve.service";
import { bodyOf } from "../utils/http";

// GET /api/valves?parcelId=1
export async function list(req: Request, res: Response) {
  const parcelId = req.query.parcelId ? Number(req.query.parcelId) : undefined;
  res.json(await valveService.listValves(parcelId));
}

// GET /api/valves/:id
export async function get(req: Request, res: Response) {
  res.json(await valveService.getValve(Number(req.params.id)));
}

// POST /api/valves (maps a device channel to a valve/pump)
export async function create(req: Request, res: Response) {
  res.status(201).json(await valveService.createValve(bodyOf(req)));
}

// PUT /api/valves/:id
export async function update(req: Request, res: Response) {
  res.json(await valveService.updateValve(Number(req.params.id), bodyOf(req)));
}

// DELETE /api/valves/:id
export async function remove(req: Request, res: Response) {
  await valveService.deleteValve(Number(req.params.id));
  res.status(204).send();
}

// POST /api/valves/:id/command with { "action": "on" | "off" }
// 202 Accepted: the command was SENT; the real state arrives later via MQTT status
export async function command(req: Request, res: Response) {
  const result = await valveService.commandValve(
    Number(req.params.id),
    bodyOf(req).action,
    "manual",
  );
  res.status(202).json(result);
}
