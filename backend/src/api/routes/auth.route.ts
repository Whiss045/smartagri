/**
 * AUTH ROUTES  (mounted at /api/auth)
 * Login and logout are public. There is deliberately NO register route.
 */
import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/userAuth.middleware";

const router = Router();

router.post("/login", loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", requireAuth, meHandler); // lets the frontend check for an existing session

export default router;
