/**
 * SCHEDULE CONTROLLER
 * HTTP layer for managing irrigation and heating schedules (not for running them).
 */
import type { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service";
import { bodyOf } from "../utils/http";

// GET /api/schedules?parcelId=1&system=heating
export async function list(req: Request, res: Response) {
  const parcelId = req.query.parcelId ? Number(req.query.parcelId) : undefined;
  res.json(
    await scheduleService.listSchedules({ parcelId, system: req.query.system }),
  );
}

// GET /api/schedules/:id
export async function get(req: Request, res: Response) {
  res.json(await scheduleService.getSchedule(Number(req.params.id)));
}

// POST /api/schedules
export async function create(req: Request, res: Response) {
  res.status(201).json(await scheduleService.createSchedule(bodyOf(req)));
}

// PUT /api/schedules/:id
export async function update(req: Request, res: Response) {
  res.json(
    await scheduleService.updateSchedule(Number(req.params.id), bodyOf(req)),
  );
}

// DELETE /api/schedules/:id
export async function remove(req: Request, res: Response) {
  await scheduleService.deleteSchedule(Number(req.params.id));
  res.status(204).send();
}
