/**
 * AUTH MIDDLEWARE
 * Runs before protected controllers. Reads the session cookie, verifies the JWT,
 * and either attaches the user id to the request or rejects with 401.
 */
import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE, verifyToken } from "../services/auth.service";
import { HttpError } from "../utils/http";

// Adds an optional `userId` field to Express's Request type, so req.userId is typed
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[AUTH_COOKIE];
  // No cookie (or not a string) -> not logged in
  if (!token || typeof token !== "string")
    throw new HttpError(401, "Authentication required");

  req.userId = verifyToken(token); // Throws 401 if the token is invalid or expired
  next(); // Authenticated: continue to the controller
}
