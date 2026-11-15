/** SENSOR ROUTES  (mounted at /api/sensors, protected) */
import { Router } from "express";
import * as controller from "../controllers/sensor.controller";

const router = Router();

// No DELETE and no write endpoints for readings: history is read-only.
router.get("/", controller.list); // ?parcelId=
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.get("/:id/readings", controller.readings); // ?from=&to=&limit=

export default router;
