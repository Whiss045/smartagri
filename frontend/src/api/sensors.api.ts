import { api, qs } from "./client";
import type { Reading, Sensor, SensorType } from "../types/models";
import type { Placement } from "./valves.api";

export const sensorsApi = {
  list: (
    f: { parcelId?: number; plotId?: number; unassigned?: boolean } = {},
  ) => api.get<Sensor[]>(`/sensors${qs(f)}`),
  get: (id: number) => api.get<Sensor>(`/sensors/${id}`),
  // One call registers one or several sensors (a DHT22 sends two) in one transaction
  create: (sensors: { name: string; type: SensorType; unit: string }[]) =>
    api.post<Sensor[]>("/sensors", { sensors }),
  update: (
    id: number,
    b: { name?: string; unit?: string; active?: boolean; plotId?: number },
  ) => api.put<Sensor>(`/sensors/${id}`, b),
  assign: (id: number, b: Placement) =>
    api.post<Sensor>(`/sensors/${id}/assign`, b),
  unassign: (id: number) => api.post<Sensor>(`/sensors/${id}/unassign`),
  readings: (id: number, limit = 200) =>
    api.get<Reading[]>(`/sensors/${id}/readings${qs({ limit })}`),
};
