/**
 * HTTP HELPERS (shared utilities)
 * - HttpError: an error carrying an HTTP status AND an optional machine-readable code,
 *   so the frontend can show an exact Arabic message instead of parsing English text.
 * - validators: check and clean untrusted input.
 */
import type { Request } from "express";

export type Body = Record<string, unknown>;

export class HttpError extends Error {
  status: number;
  code?: string; // e.g. 'DEVICE_OFFLINE'; optional, so older throw sites keep working
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const isRecord = (v: unknown): v is Body =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const bodyOf = (req: Request): Body =>
  isRecord(req.body) ? req.body : {};

// Validates a string field: trims, enforces max length, handles required/optional
export function asText(
  v: unknown,
  field: string,
  opts: { required?: boolean; max?: number } = {},
): string | null {
  const { required = true, max = 100 } = opts;
  if (v === undefined || v === null || v === "") {
    if (required)
      throw new HttpError(400, `${field} is required`, "VALIDATION");
    return null;
  }
  if (typeof v !== "string")
    throw new HttpError(400, `${field} must be a string`, "VALIDATION");
  const t = v.trim();
  if (!t) {
    if (required)
      throw new HttpError(400, `${field} is required`, "VALIDATION");
    return null;
  }
  if (t.length > max) {
    throw new HttpError(
      400,
      `${field} must be at most ${max} characters`,
      "VALIDATION",
    );
  }
  return t;
}

// Validates an integer within [min, max]. Accepts numeric strings (query params).
export function asInt(
  v: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(
      400,
      `${field} must be an integer between ${min} and ${max}`,
      "VALIDATION",
    );
  }
  return n;
}

// Like asInt, but absent/null/'' means "no value" (null)
export function asOptionalInt(
  v: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (v === undefined || v === null || v === "") return null;
  return asInt(v, field, min, max);
}

// Validates that a value is one of a fixed list
export function asEnum<T extends string>(
  v: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    throw new HttpError(
      400,
      `${field} must be one of: ${allowed.join(", ")}`,
      "VALIDATION",
    );
  }
  return v as T;
}

// Route parameter -> validated positive integer (bad id = clean 400, not a database error)
export const idParam = (req: Request, name = "id"): number =>
  asInt(req.params[name], name, 1, 4294967295);

// Optional query id such as ?parcelId=2. Returns undefined when absent.
export function optionalId(v: unknown, field: string): number | undefined {
  if (v === undefined || v === "") return undefined;
  return asInt(v, field, 1, 4294967295);
}
