/** PLOT ROUTES  (mounted at /api/plots, protected) */
import { Router } from "express";
import * as controller from "../controllers/plot.controller";

const router = Router();

router.get("/", controller.list); // ?parcelId=
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove); // only when the plot has no equipment

export default router;
