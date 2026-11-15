/** SCHEDULE ROUTES  (mounted at /api/schedules, protected) */
import { Router } from "express";
import * as controller from "../controllers/schedule.controller";

const router = Router();

router.get("/", controller.list); // ?parcelId=&system=irrigation|heating
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
