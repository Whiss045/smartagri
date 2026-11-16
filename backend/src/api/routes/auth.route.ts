/**
 * AUTH ROUTES  (mounted at /api/auth)
 * Login and logout are public. There is deliberately NO register route.
 */
import rateLimit from "express-rate-limit";
import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/userAuth.middleware";

// 10 login attempts per 15 minutes per IP: stops password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, try again later" },
});

const router = Router();

router.post("/login", loginLimiter, loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", requireAuth, meHandler); // lets the frontend check for an existing session

export default router;
