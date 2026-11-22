/**
 * SENSOR CONTROLLER
 * HTTP layer for sensor registration, assignment and history.
 * No delete handler and nothing that writes readings: history is read-only.
 */
import type { Request, Response } from "express";
import * as sensorService from "../services/sensor.service";
import { bodyOf, idParam, optionalId } from "../utils/http";

// GET /api/sensors?parcelId=&plotId=&unassigned=true   (each sensor includes its latest reading)
export async function list(req: Request, res: Response) {
  res.json(
    await sensorService.listSensors({
      parcelId: optionalId(req.query.parcelId, "parcelId"),
      plotId: optionalId(req.query.plotId, "plotId"),
      unassigned: req.query.unassigned === "true",
    }),
  );
}

// GET /api/sensors/:id
export async function get(req: Request, res: Response) {
  res.json(await sensorService.getSensor(idParam(req)));
}

// POST /api/sensors
//   one sensor:  { name, type, unit, deviceId?, channel?, plotId? }  -> returns an object
//   several:     { sensors: [{ name, type, unit, channel? }], deviceId?, plotId? } -> returns an array
export async function create(req: Request, res: Response) {
  const body = bodyOf(req);
  const result = Array.isArray(body.sensors)
    ? await sensorService.createSensors(body)
    : await sensorService.createSensor(body);
  res.status(201).json(result);
}

// PUT /api/sensors/:id   { name?, unit?, active?, plotId? }
export async function update(req: Request, res: Response) {
  res.json(await sensorService.updateSensor(idParam(req), bodyOf(req)));
}

// POST /api/sensors/:id/assign   { deviceId, channel, plotId? }
export async function assign(req: Request, res: Response) {
  res.json(await sensorService.assignSensor(idParam(req), bodyOf(req)));
}

// POST /api/sensors/:id/unassign
export async function unassign(req: Request, res: Response) {
  res.json(await sensorService.unassignSensor(idParam(req)));
}

// GET /api/sensors/:id/readings?from=&to=&limit=
export async function readings(req: Request, res: Response) {
  const { from, to, limit } = req.query;
  res.json(await sensorService.getReadings(idParam(req), { from, to, limit }));
}
