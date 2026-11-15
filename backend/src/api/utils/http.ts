/**
 * HTTP HELPERS (shared utilities)
 * - HttpError: an error carrying an HTTP status code
 * - validators (asText / asInt / asEnum): check and clean untrusted input
 * Services throw HttpError, and error.middleware turns it into a JSON response.
 */
import type { Request } from "express";

export type Body = Record<string, unknown>;

// An error with a status code, e.g. throw new HttpError(404, 'Parcel not found')
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Type guard: is this value a plain object (not null, not an array)?
export const isRecord = (v: unknown): v is Body =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Safely returns req.body as an object, even if the client sent nothing or garbage
export const bodyOf = (req: Request): Body =>
  isRecord(req.body) ? req.body : {};

// Validates a string field. Trims it, enforces max length, and handles required/optional.
export function asText(
  v: unknown,
  field: string,
  opts: { required?: boolean; max?: number } = {},
): string | null {
  const { required = true, max = 100 } = opts;
  // Empty values: either an error (required) or null (optional)
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  if (typeof v !== "string")
    throw new HttpError(400, `${field} must be a string`);
  const t = v.trim();
  if (!t) {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  if (t.length > max)
    throw new HttpError(400, `${field} must be at most ${max} characters`);
  return t;
}

// Validates an integer within [min, max]. Accepts numeric strings too (useful for query params).
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
    );
  }
  return n;
}

// Validates that a value is one of a fixed list (e.g. parcel type, valve action)
export function asEnum<T extends string>(
  v: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(", ")}`);
  }
  return v as T;
}
