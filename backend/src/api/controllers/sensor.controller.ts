/**
 * SENSOR CONTROLLER
 * HTTP layer for sensor metadata and reading history.
 * No delete handler and no handler that writes readings: history is read-only.
 */
import type { Request, Response } from "express";
import * as sensorService from "../services/sensor.service";
import { bodyOf } from "../utils/http";

// GET /api/sensors?parcelId=1 (each sensor includes its latest reading)
export async function list(req: Request, res: Response) {
  const parcelId = req.query.parcelId ? Number(req.query.parcelId) : undefined;
  res.json(await sensorService.listSensors(parcelId));
}

// GET /api/sensors/:id
export async function get(req: Request, res: Response) {
  res.json(await sensorService.getSensor(Number(req.params.id)));
}

// POST /api/sensors (maps a device channel to a sensor)
export async function create(req: Request, res: Response) {
  res.status(201).json(await sensorService.createSensor(bodyOf(req)));
}

// PUT /api/sensors/:id (metadata only)
export async function update(req: Request, res: Response) {
  res.json(
    await sensorService.updateSensor(Number(req.params.id), bodyOf(req)),
  );
}

// GET /api/sensors/:id/readings?from=&to=&limit=
export async function readings(req: Request, res: Response) {
  const { from, to, limit } = req.query;
  res.json(
    await sensorService.getReadings(Number(req.params.id), { from, to, limit }),
  );
}
