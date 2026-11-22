import { api, qs } from "./client";
import type { Schedule, SystemType } from "../types/models";

export type ScheduleInput = {
  valveId: number;
  name: string;
  startTime: string;
  durationMinutes: number;
  daysOfWeek: number[];
  enabled: boolean;
};

export const schedulesApi = {
  list: (f: { parcelId?: number; system?: SystemType } = {}) =>
    api.get<Schedule[]>(`/schedules${qs(f)}`),
  create: (b: ScheduleInput) => api.post<Schedule>("/schedules", b),
  // The valve of an existing schedule can't change, so valveId is left out
  update: (id: number, b: Partial<Omit<ScheduleInput, "valveId">>) =>
    api.put<Schedule>(`/schedules/${id}`, b),
  remove: (id: number) => api.del(`/schedules/${id}`),
};
