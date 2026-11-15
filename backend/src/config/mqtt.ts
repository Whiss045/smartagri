/**
 * MQTT CONFIG
 * Only connection settings and topic names live here.
 * The actual communication logic is in services/mqtt.service.ts.
 */
import type { IClientOptions } from "mqtt";

export const mqttUrl = process.env.MQTT_URL ?? "mqtt://localhost:1883";

// Options passed to mqtt.connect(). The backend authenticates to Mosquitto like any client.
export const mqttOptions: IClientOptions = {
  clientId: process.env.MQTT_CLIENT_ID ?? "smartagri-backend",
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clean: true,
  reconnectPeriod: 5000, // Retry every 5 s if the broker drops
  connectTimeout: 10000,
};

// Single source of truth for topic names, so they are never hardcoded elsewhere
export const MQTT_TOPICS = {
  // Topics the backend listens to. '+' is a wildcard for the device id.
  subscribe: [
    "smartagri/devices/+/hello", // Device announces itself (used for auto-registration)
    "smartagri/devices/+/telemetry", // Sensor readings
    "smartagri/devices/+/status", // Valve/pump states
  ],
  // Topic the backend publishes to; each ESP32 subscribes only to its own
  commands: (deviceUid: string): string =>
    `smartagri/devices/${deviceUid}/commands`,
};
