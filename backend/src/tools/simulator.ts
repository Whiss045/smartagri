/**
 * ESP32 SIMULATOR (development tool, not part of the API).
 * Starts two fake devices that speak our MQTT contract:
 *   device -> backend: hello, telemetry, status      backend -> device: commands
 * Type commands in this terminal (see HELP below) to test offline devices and faults.
 */
import { connect } from "mqtt";

const BROKER = process.env.MQTT_URL ?? "mqtt://127.0.0.1:1883";

type ValveState = "on" | "off" | "fault";

type SensorConfig = {
  channel: number;
  value: number; // starting value
  min: number;
  max: number;
  step: number; // size of the random drift per tick
  soil?: boolean; // soil moisture rises while a valve is open, falls slowly otherwise
};

type DeviceConfig = {
  uid: string; // must equal the broker username
  password: string;
  sensors: SensorConfig[];
  valveChannels: number[];
};

/* ---------------- The fake hardware: edit freely ---------------- */
const DEVICES: DeviceConfig[] = [
  {
    uid: "esp32-sim-01",
    password: "simpass1",
    sensors: [
      { channel: 0, value: 24, min: 15, max: 42, step: 0.3 }, // air temperature
      { channel: 1, value: 45, min: 20, max: 85, step: 0.8 }, // air humidity
      { channel: 2, value: 35, min: 5, max: 90, step: 0, soil: true }, // soil moisture
    ],
    valveChannels: [0, 1],
  },
  {
    uid: "esp32-sim-02",
    password: "simpass2",
    sensors: [
      { channel: 0, value: 50, min: 5, max: 90, step: 0, soil: true }, // soil moisture
      { channel: 1, value: 22, min: 15, max: 35, step: 0.2 }, // soil temperature
    ],
    valveChannels: [0],
  },
];

const TELEMETRY_MS = 10_000; // a message every 10 s keeps the device "online" (limit is 120 s)
const STATUS_MS = 30_000; // periodic valve-state report, besides the one after each command

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/* ---------------- One simulated device ---------------- */
function startDevice(cfg: DeviceConfig) {
  const base = `smartagri/devices/${cfg.uid}`;
  const log = (msg: string) => console.log(`[${cfg.uid}] ${msg}`);

  const sensors = cfg.sensors.map((s) => ({ ...s }));
  const valves = cfg.valveChannels.map((channel) => ({
    channel,
    state: "off" as ValveState,
    timer: undefined as NodeJS.Timeout | undefined, // local auto-off, like the real firmware must do
  }));
  let online = true; // false = the device is "unplugged": it sends and hears nothing

  const client = connect(BROKER, {
    clientId: cfg.uid,
    username: cfg.uid,
    password: cfg.password,
  });

  const send = (kind: "hello" | "telemetry" | "status", payload: unknown) => {
    if (online && client.connected)
      client.publish(`${base}/${kind}`, JSON.stringify(payload));
  };
  const sendStatus = () =>
    send("status", {
      valves: valves.map((v) => ({ channel: v.channel, state: v.state })),
    });

  client.on("connect", () => {
    log("connected to the broker");
    // Subscribe BEFORE announcing, so no command can be missed
    client.subscribe(`${base}/commands`, (err) => {
      if (err) return log(`subscribe failed: ${err.message}`);
      send("hello", { firmware: "1.0.0-sim" });
      sendStatus();
    });
  });
  client.on("error", (err) => log(`error: ${err.message}`));

  // A command arrives: { channel, action: 'on'|'off', source, durationSeconds?, ts }
  client.on("message", (_topic, buf) => {
    if (!online) return;
    let cmd: {
      channel?: number;
      action?: string;
      source?: string;
      durationSeconds?: number;
    };
    try {
      cmd = JSON.parse(buf.toString());
    } catch {
      return;
    }

    const valve = valves.find((v) => v.channel === cmd.channel);
    if (!valve) return log(`command for unknown valve channel ${cmd.channel}`);

    clearTimeout(valve.timer);
    if (cmd.action === "on" && valve.state !== "fault") {
      valve.state = "on";
      // The device enforces the stop itself, even if the network dies afterwards
      if (cmd.durationSeconds) {
        valve.timer = setTimeout(() => {
          valve.state = "off";
          log(`valve ${valve.channel}: auto-off after ${cmd.durationSeconds}s`);
          sendStatus();
        }, cmd.durationSeconds * 1000);
      }
    } else if (cmd.action === "off" && valve.state !== "fault") {
      valve.state = "off";
    }
    log(
      `valve ${valve.channel} -> ${valve.state} (${cmd.action}, from ${cmd.source}${cmd.durationSeconds ? `, ${cmd.durationSeconds}s` : ""})`,
    );
    sendStatus(); // the backend only learns the real state from this report
  });

  // Sensor readings: random drift, soil moisture reacts to open valves
  const telemetryTimer = setInterval(() => {
    const watering = valves.some((v) => v.state === "on");
    for (const s of sensors) {
      const delta = s.soil
        ? watering
          ? 1.2
          : -0.08
        : (Math.random() - 0.5) * 2 * s.step;
      s.value = clamp(s.value + delta, s.min, s.max);
    }
    send("telemetry", {
      readings: sensors.map((s) => ({
        channel: s.channel,
        value: round1(s.value),
      })),
    });
  }, TELEMETRY_MS);

  const statusTimer = setInterval(sendStatus, STATUS_MS);

  return {
    uid: cfg.uid,
    setOnline(value: boolean) {
      online = value;
      log(value ? "back ONLINE" : "now OFFLINE (silent)");
    },
    // Toggles a fault on a valve: fault -> off, anything else -> fault
    toggleFault(channel: number) {
      const v = valves.find((x) => x.channel === channel);
      if (!v) return log(`no valve on channel ${channel}`);
      clearTimeout(v.timer);
      v.state = v.state === "fault" ? "off" : "fault";
      log(`valve ${channel} -> ${v.state}`);
      sendStatus();
    },
    stop() {
      clearInterval(telemetryTimer);
      clearInterval(statusTimer);
      valves.forEach((v) => clearTimeout(v.timer));
      client.end();
    },
  };
}

/* ---------------- Start everything + terminal commands ---------------- */
const running = DEVICES.map(startDevice);

const HELP = `
Commands (device numbers start at 1):
  offline <n>        device n goes silent (the backend marks it offline after ~2 min)
  online <n>         device n comes back
  fault <n> <ch>     toggle a fault on valve channel <ch> of device n
  help               show this list
  quit               stop the simulator
`;
console.log(HELP);

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  for (const line of chunk.split("\n")) {
    const [cmd, a, b] = line.trim().split(/\s+/);
    const device = running[Number(a) - 1];
    if (cmd === "offline" && device) device.setOnline(false);
    else if (cmd === "online" && device) device.setOnline(true);
    else if (cmd === "fault" && device) device.toggleFault(Number(b));
    else if (cmd === "help") console.log(HELP);
    else if (cmd === "quit") shutdown();
  }
});

function shutdown() {
  running.forEach((d) => d.stop());
  setTimeout(() => process.exit(0), 300);
}
process.on("SIGINT", shutdown);
