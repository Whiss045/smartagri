/**
 * MQTT SERVICE
 * Pure communication layer with the Mosquitto broker: connect, listen, publish.
 * It contains NO business logic. Incoming messages are handed to a callback
 * (device.service), which decides what to do with them.
 */
import mqtt, { MqttClient } from "mqtt";
import { mqttUrl, mqttOptions, MQTT_TOPICS } from "../../config/mqtt";

type MessageHandler = (topic: string, payload: Buffer) => Promise<void> | void;

let client: MqttClient | null = null; // Single shared connection

// Connects to the broker and wires up all lifecycle events
export function connectMqtt(onMessage: MessageHandler): MqttClient {
  client = mqtt.connect(mqttUrl, mqttOptions);

  // Runs on the first connection AND after every automatic reconnection,
  // so subscriptions are always restored
  client.on("connect", () => {
    console.log("[mqtt] connected");
    client?.subscribe(MQTT_TOPICS.subscribe, { qos: 1 }, (err) => {
      if (err) console.error("[mqtt] subscribe failed", err.message);
    });
  });

  // Every device message arrives here. A failure in one message must never crash the server.
  client.on("message", (topic, payload) => {
    Promise.resolve(onMessage(topic, payload)).catch((err) =>
      console.error("[mqtt] message handling failed", err),
    );
  });

  client.on("reconnect", () => console.log("[mqtt] reconnecting..."));
  client.on("close", () => console.log("[mqtt] connection closed"));
  client.on("error", (err) => console.error("[mqtt] error", err.message));

  return client;
}

// Sends a command to one ESP32. Resolves when the broker accepted it, rejects if not connected.
export function publishCommand(
  deviceUid: string,
  command: Record<string, unknown>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      reject(new Error("MQTT client not connected"));
      return;
    }
    client.publish(
      MQTT_TOPICS.commands(deviceUid),
      JSON.stringify(command),
      { qos: 1, retain: false }, // qos 1 = delivered at least once; retain false = no stale commands replayed later
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

// Called on shutdown to close the connection cleanly
export function disconnectMqtt(): Promise<void> {
  return new Promise((resolve) => {
    if (!client) return resolve();
    client.end(false, {}, () => resolve());
  });
}
