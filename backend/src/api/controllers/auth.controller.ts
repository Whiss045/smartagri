/**
 * AUTH CONTROLLER
 * Handles login, logout and "who am I". Owns the session COOKIE (the service owns the logic).
 */
import type { Request, Response } from "express";
import { AUTH_COOKIE, getFarmer, login } from "../services/auth.service";
import { bodyOf } from "../utils/http";

// Cookie hardening:
//  - httpOnly: JavaScript in the browser cannot read it (protects against XSS theft)
//  - secure: sent only over HTTPS in production
//  - sameSite strict: not sent on cross-site requests (protects against CSRF)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// POST /api/auth/login
export async function loginHandler(req: Request, res: Response) {
  const { username, password } = bodyOf(req);
  const { token, user } = await login(username, password);

  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  }); // 8 hours
  res.json({ user }); // The token itself is never returned in the body
}

// POST /api/auth/logout: just deletes the cookie
export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).send();
}

// GET /api/auth/me: protected by requireAuth in the route file
export async function meHandler(req: Request, res: Response) {
  res.json({ user: await getFarmer(req.userId as number) });
}
