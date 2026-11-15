/**
 * AUTH SERVICE
 * Login logic for the single farmer account. It only READS the user table:
 * it never creates, edits or deletes accounts.
 */
import argon2 from "argon2";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models";
import { HttpError } from "../utils/http";

// Name of the HTTP-only cookie that holds the session token
export const AUTH_COOKIE = "smartagri_session";

// Refuse to start without a secret: signing tokens with `undefined` would be a security hole
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
  "8h") as SignOptions["expiresIn"];

// Verifies credentials and returns a signed token. The controller puts it in the cookie.
export async function login(username: unknown, password: unknown) {
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    throw new HttpError(400, "Username and password are required");
  }

  const user = await User.findOne({ where: { username } });
  let valid = false;
  if (user) {
    try {
      valid = await argon2.verify(user.passwordHash, password); // Compares against the stored hash
    } catch {
      valid = false; // A malformed hash counts as a failed login
    }
  }
  // Same message for "unknown user" and "wrong password" so attackers can't tell which
  if (!user || !valid) throw new HttpError(401, "Invalid credentials");

  // The token only carries the user id (as `sub`), nothing sensitive
  const token = jwt.sign({}, JWT_SECRET as string, {
    subject: String(user.id),
    expiresIn: JWT_EXPIRES_IN,
  });

  return { token, user: { id: user.id, username: user.username } };
}

// Validates a token from the cookie and returns the user id inside it
export function verifyToken(token: string): number {
  try {
    const payload = jwt.verify(token, JWT_SECRET as string); // Checks signature and expiry
    const userId = Number(typeof payload === "object" ? payload.sub : NaN);
    if (!Number.isInteger(userId)) throw new Error("bad subject");
    return userId;
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}

// Used by GET /auth/me so the frontend can check whether a session exists
export async function getFarmer(userId: number) {
  // `attributes` excludes passwordHash from the query entirely
  const user = await User.findByPk(userId, { attributes: ["id", "username"] });
  if (!user) throw new HttpError(401, "Account not found");
  return { id: user.id, username: user.username };
}
