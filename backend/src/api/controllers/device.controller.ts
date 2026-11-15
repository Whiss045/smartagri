/**
 * DEVICE CONTROLLER
 * HTTP layer for ESP32 devices: list (including the unassigned list), rename, assign, unassign.
 * Devices are never created here: they register themselves through MQTT.
 */
import type { Request, Response } from "express";
import * as deviceService from "../services/device.service";
import { bodyOf, idParam } from "../utils/http";

// GET /api/devices or GET /api/devices?unassigned=true
export async function list(req: Request, res: Response) {
  res.json(await deviceService.listDevices(req.query.unassigned === "true"));
}

// GET /api/devices/:id
export async function get(req: Request, res: Response) {
  res.json(await deviceService.getDevice(idParam(req)));
}

// PUT /api/devices/:id (rename)
export async function update(req: Request, res: Response) {
  res.json(await deviceService.updateDevice(idParam(req), bodyOf(req)));
}

// POST /api/devices/:id/assign with { "parcelId": 1 }
export async function assign(req: Request, res: Response) {
  res.json(await deviceService.assignDevice(idParam(req), bodyOf(req)));
}

// POST /api/devices/:id/unassign
export async function unassign(req: Request, res: Response) {
  res.json(await deviceService.unassignDevice(idParam(req)));
}
