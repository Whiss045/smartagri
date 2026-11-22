// Shapes of the JSON the backend returns. Dates arrive as ISO strings.
export type ParcelType = "palm_field" | "greenhouse";
export type SystemType = "irrigation" | "heating";
export type ValveKind = "valve" | "pump";
export type ValveState = "on" | "off" | "fault" | "unknown";
export type SensorType =
  | "soil_moisture"
  | "soil_temperature"
  | "air_temperature"
  | "air_humidity"
  | "water_flow"
  | "water_pressure"
  | "water_temperature";

export interface User {
  id: number;
  username: string;
}

export interface Plot {
  id: number;
  parcelId: number;
  name: string;
  description: string | null;
  valveCount?: number;
  sensorCount?: number; // present in the list endpoint
}

export interface Device {
  id: number;
  deviceUid: string;
  name: string | null;
  parcelId: number | null;
  firmwareVersion: string | null;
  lastSeenAt: string | null;
  assigned: boolean;
  online: boolean;
}

export interface Valve {
  id: number;
  name: string;
  kind: ValveKind;
  system: SystemType;
  deviceId: number | null;
  parcelId: number | null;
  plotId: number | null;
  channel: number | null;
  state: ValveState;
  stateUpdatedAt: string | null;
  deviceOnline: boolean; // false when the ESP32 is silent: control buttons get disabled
}

// MySQL DECIMAL may arrive as a string, so values are always passed through Number()
export interface Reading {
  value: number | string;
  recordedAt: string;
}

export interface Sensor {
  id: number;
  name: string;
  type: SensorType;
  unit: string;
  deviceId: number | null;
  parcelId: number | null;
  plotId: number | null;
  channel: number | null;
  active: boolean;
  online: boolean;
  latestReading: Reading | null;
}

export interface Schedule {
  id: number;
  parcelId: number;
  valveId: number;
  system: SystemType;
  name: string;
  startTime: string;
  durationMinutes: number;
  daysOfWeek: number[];
  enabled: boolean;
  valve?: { id: number; name: string; plotId: number | null };
}

export interface Parcel {
  id: number;
  name: string;
  type: ParcelType;
  location: string | null;
  notes: string | null;
  plots?: Plot[];
  devices?: { id: number }[];
  valves?: { id: number }[];
  sensors?: { id: number }[];
}
