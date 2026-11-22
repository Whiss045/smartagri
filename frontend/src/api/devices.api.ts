import { api, qs } from "./client";
import type { Device } from "../types/models";

export const devicesApi = {
  list: (f: { unassigned?: boolean; parcelId?: number } = {}) =>
    api.get<Device[]>(`/devices${qs(f)}`),
  update: (id: number, b: { name: string }) =>
    api.put<Device>(`/devices/${id}`, b), // rename only
  assign: (id: number, b: { parcelId: number; name?: string }) =>
    api.post<Device>(`/devices/${id}/assign`, b),
  unassign: (id: number) => api.post<Device>(`/devices/${id}/unassign`),
};
