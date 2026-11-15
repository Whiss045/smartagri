/** PARCEL ROUTES  (mounted at /api/parcels, protected) */
import { Router } from "express";
import * as controller from "../controllers/parcel.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
