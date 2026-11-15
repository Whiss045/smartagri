/**
 * CENTRAL API ROUTER  (mounted at /api by server.ts)
 * Order matters here: public routes first, then the auth gate, then protected routes.
 */
import { Router } from "express";
import authRoutes from "./routes/auth.route";
import parcelRoutes from "./routes/parcel.route";
import scheduleRoutes from "./routes/schedule.route";
import valveRoutes from "./routes/valve.route";
import deviceRoutes from "./routes/device.route";
import sensorRoutes from "./routes/sensor.route";
import { requireAuth } from "./middleware/userAuth.middleware";

const router = Router();

// Simple liveness check (useful for monitoring)
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Public: login/logout only (no registration)
router.use("/auth", authRoutes);

// Everything registered BELOW this line requires the farmer's session
router.use(requireAuth);
router.use("/parcels", parcelRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/valves", valveRoutes);
router.use("/devices", deviceRoutes);
router.use("/sensors", sensorRoutes);

export default router;
