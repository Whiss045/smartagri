/** DEVICE ROUTES  (mounted at /api/devices, protected) */
import { Router } from "express";
import * as controller from "../controllers/device.controller";

const router = Router();

router.get("/", controller.list); // ?unassigned=true for the "unassigned devices" list
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.post("/:id/assign", controller.assign); // { "parcelId": 1, "name"?: "..." }
router.post("/:id/unassign", controller.unassign);

export default router;
