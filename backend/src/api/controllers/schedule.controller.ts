/**
 * SCHEDULE CONTROLLER
 * HTTP layer for managing irrigation and heating schedules (not for running them).
 */
import type { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service";
import { bodyOf, idParam } from "../utils/http";

// GET /api/schedules?parcelId=1&system=heating
export async function list(req: Request, res: Response) {
  const parcelId = req.query.parcelId ? Number(req.query.parcelId) : undefined;
  res.json(
    await scheduleService.listSchedules({ parcelId, system: req.query.system }),
  );
}

// GET /api/schedules/:id
export async function get(req: Request, res: Response) {
  res.json(await scheduleService.getSchedule(idParam(req)));
}

// POST /api/schedules
export async function create(req: Request, res: Response) {
  res.status(201).json(await scheduleService.createSchedule(bodyOf(req)));
}

// PUT /api/schedules/:id
export async function update(req: Request, res: Response) {
  res.json(await scheduleService.updateSchedule(idParam(req), bodyOf(req)));
}

// DELETE /api/schedules/:id
export async function remove(req: Request, res: Response) {
  await scheduleService.deleteSchedule(idParam(req));
  res.status(204).send();
}
