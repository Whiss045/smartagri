import { api } from "./client";
import type { Parcel, ParcelType } from "../types/models";

export type ParcelInput = {
  name: string;
  type: ParcelType;
  location?: string;
  notes?: string;
};

export const parcelsApi = {
  list: () => api.get<Parcel[]>("/parcels"),
  get: (id: number) => api.get<Parcel>(`/parcels/${id}`),
  create: (b: ParcelInput) => api.post<Parcel>("/parcels", b),
  update: (id: number, b: Partial<Omit<ParcelInput, "type">>) =>
    api.put<Parcel>(`/parcels/${id}`, b), // type is immutable
  remove: (id: number) => api.del(`/parcels/${id}`),
};
