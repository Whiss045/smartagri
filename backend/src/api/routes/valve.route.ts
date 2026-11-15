/** VALVE ROUTES  (mounted at /api/valves, protected) */
import { Router } from "express";
import * as controller from "../controllers/valve.controller";

const router = Router();

router.get("/", controller.list); // ?parcelId=
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/command", controller.command); // manual control: { "action": "on" | "off" }

export default router;
