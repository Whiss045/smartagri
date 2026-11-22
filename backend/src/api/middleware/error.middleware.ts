/**
 * ERROR MIDDLEWARE
 * Converts every error into a JSON response: { message, code? }.
 * `code` is stable and meant for the frontend; `message` is for developers/logs.
 */
import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/http";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found", code: "ROUTE_NOT_FOUND" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Expected errors thrown by our code
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
    return;
  }
  // Database unique constraint violated
  if (err?.name === "SequelizeUniqueConstraintError") {
    res.status(409).json({
      message: "A record with these values already exists",
      code: "DUPLICATE",
    });
    return;
  }
  // Malformed JSON sent by the client
  if (err?.type === "entity.parse.failed") {
    res
      .status(400)
      .json({ message: "Invalid JSON body", code: "INVALID_JSON" });
    return;
  }
  // Anything else is a bug: log it, don't leak details
  console.error("[error]", err);
  res.status(500).json({ message: "Internal server error", code: "INTERNAL" });
};
