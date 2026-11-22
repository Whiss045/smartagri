/** SENSOR ROUTES  (mounted at /api/sensors, protected) */
import { Router } from "express";
import * as controller from "../controllers/sensor.controller";

const router = Router();

// No DELETE and no write endpoints for readings: history is read-only.
router.get("/", controller.list); // ?parcelId=&plotId=&unassigned=true
router.post("/", controller.create); // one sensor or { sensors: [...] }
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.post("/:id/assign", controller.assign); // { deviceId, channel, plotId? }
router.post("/:id/unassign", controller.unassign);
router.get("/:id/readings", controller.readings); // ?from=&to=&limit=

export default router;
