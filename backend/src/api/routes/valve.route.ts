/** VALVE ROUTES  (mounted at /api/valves, protected) */
import { Router } from "express";
import * as controller from "../controllers/valve.controller";

const router = Router();

router.get("/", controller.list); // ?parcelId=&plotId=&unassigned=true
router.post("/", controller.create); // register (optionally assign in the same request)
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove); // unassigned valves only
router.post("/:id/assign", controller.assign); // { deviceId, channel, plotId? }
router.post("/:id/unassign", controller.unassign);
router.post("/:id/command", controller.command); // { "action": "on" | "off" }

export default router;
