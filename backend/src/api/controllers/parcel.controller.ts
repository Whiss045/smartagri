/**
 * PARCEL CONTROLLER
 * HTTP layer for parcel CRUD. Each handler is one call into parcel.service.
 */
import type { Request, Response } from "express";
import * as parcelService from "../services/parcel.service";
import { bodyOf, idParam } from "../utils/http";

// GET /api/parcels
export async function list(_req: Request, res: Response) {
  res.json(await parcelService.listParcels());
}

// GET /api/parcels/:id
export async function get(req: Request, res: Response) {
  res.json(await parcelService.getParcel(idParam(req)));
}

// POST /api/parcels
export async function create(req: Request, res: Response) {
  res.status(201).json(await parcelService.createParcel(bodyOf(req)));
}

// PUT /api/parcels/:id
export async function update(req: Request, res: Response) {
  res.json(await parcelService.updateParcel(idParam(req), bodyOf(req)));
}

// DELETE /api/parcels/:id
export async function remove(req: Request, res: Response) {
  await parcelService.deleteParcel(idParam(req));
  res.status(204).send(); // 204 = success, no body
}
