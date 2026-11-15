/**
 * ERROR MIDDLEWARE
 * One place that converts every error into a clean JSON response, so controllers
 * stay free of try/catch blocks. (Express 5 forwards async errors here automatically.)
 */
import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/http";

// Reached only when no route matched
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Expected errors thrown by our code (validation, not found, conflicts...)
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  // Database unique constraint violated (e.g. channel already mapped)
  if (err?.name === "SequelizeUniqueConstraintError") {
    res
      .status(409)
      .json({ message: "A record with these values already exists" });
    return;
  }
  // Malformed JSON sent by the client
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON body" });
    return;
  }
  // Anything else is a bug: log details server-side, but don't leak them to the client
  console.error("[error]", err);
  res.status(500).json({ message: "Internal server error" });
};
