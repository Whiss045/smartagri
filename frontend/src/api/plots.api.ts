import { api, qs } from "./client";
import type { Plot } from "../types/models";

export const plotsApi = {
  list: (parcelId?: number) => api.get<Plot[]>(`/plots${qs({ parcelId })}`),
  get: (id: number) => api.get<Plot>(`/plots/${id}`),
  create: (b: { parcelId: number; name: string; description?: string }) =>
    api.post<Plot>("/plots", b),
  update: (id: number, b: { name?: string; description?: string }) =>
    api.put<Plot>(`/plots/${id}`, b),
  remove: (id: number) => api.del(`/plots/${id}`),
};
