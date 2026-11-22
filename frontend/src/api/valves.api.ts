import { api, qs } from "./client";
import type { SystemType, Valve, ValveKind } from "../types/models";

export type Placement = { deviceId: number; channel: number; plotId: number };

export const valvesApi = {
  list: (
    f: { parcelId?: number; plotId?: number; unassigned?: boolean } = {},
  ) => api.get<Valve[]>(`/valves${qs(f)}`),
  create: (b: { name: string; kind: ValveKind; system: SystemType }) =>
    api.post<Valve>("/valves", b),
  update: (id: number, b: { name?: string; plotId?: number }) =>
    api.put<Valve>(`/valves/${id}`, b),
  remove: (id: number) => api.del(`/valves/${id}`),
  assign: (id: number, b: Placement) =>
    api.post<Valve>(`/valves/${id}/assign`, b),
  unassign: (id: number) => api.post<Valve>(`/valves/${id}/unassign`),
  // 202: command SENT. The real state shows up later, so callers reload after a delay.
  command: (id: number, action: "on" | "off") =>
    api.post(`/valves/${id}/command`, { action }),
};
