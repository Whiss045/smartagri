/**
 * ENTRY POINT
 * Boots everything in order: Express app -> database -> MQTT -> scheduler -> HTTP server.
 * No business logic lives here, it only wires the pieces together.
 */
import "dotenv/config"; // Loads .env into process.env (must run before anything reads env vars)
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/database";
import "./api/models"; // Side-effect import: registers all models and their associations
import apiRouter from "./api/api.route";
import {
  errorHandler,
  notFoundHandler,
} from "./api/middleware/error.middleware";
import { connectMqtt, disconnectMqtt } from "./api/services/mqtt.service";
import { handleIncomingMessage } from "./api/services/device.service";
import {
  startScheduler,
  stopScheduler,
} from "./api/services/scheduler.service";

const app = express();

// --- Global middleware ---------------------------------------------------
// CORS with credentials, so the React frontend can send the HTTP-only session cookie
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" })); // Parses JSON bodies, with a size cap
app.use(cookieParser()); // Exposes req.cookies (needed to read the session cookie)

// --- Routes and error handling --------------------------------------------
app.use("/api", apiRouter); // Everything is mounted under /api
app.use(notFoundHandler); // Unknown routes -> 404 JSON
app.use(errorHandler); // Must be LAST: turns thrown errors into JSON responses

const port = Number(process.env.PORT ?? 5224);
const server = http.createServer(app);

// --- Startup sequence ------------------------------------------------------
async function start(): Promise<void> {
  await sequelize.authenticate(); // Fail fast if the database is unreachable
  console.log("[db] connected");

  // Optional: auto-create tables in development (set DB_SYNC=true). Leave off in production.
  if (process.env.DB_SYNC === "true") {
    await sequelize.sync();
    console.log("[db] tables synchronized");
  }

  // Connect to Mosquitto and route every incoming device message to the device service
  connectMqtt(handleIncomingMessage);
  startScheduler(); // Starts the loop that runs irrigation/heating schedules

  server.listen(port, () => console.log(`[http] listening on port ${port}`));
}

// --- Graceful shutdown (Ctrl+C or process manager stop) ------------------
async function shutdown(): Promise<void> {
  stopScheduler();
  await disconnectMqtt();
  server.close(() => sequelize.close().finally(() => process.exit(0)));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("[startup] failed", err);
  process.exit(1);
});
