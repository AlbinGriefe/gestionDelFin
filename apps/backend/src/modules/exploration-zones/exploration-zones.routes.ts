import { Router } from "express";
import {
  authenticate,
  requireRoles,
} from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createExplorationZoneController,
  getExplorationZoneController,
  listExplorationZonesController,
  updateExplorationZoneController,
} from "./exploration-zones.controller.js";
import {
  createExplorationZoneSchema,
  updateExplorationZoneSchema,
} from "./exploration-zones.schemas.js";

export const explorationZonesRouter = Router();
explorationZonesRouter.use(authenticate);
explorationZonesRouter.get("/", listExplorationZonesController);
explorationZonesRouter.get("/:zoneId", getExplorationZoneController);
explorationZonesRouter.post(
  "/",
  requireRoles("Administrador sistema"),
  validateBody(createExplorationZoneSchema),
  createExplorationZoneController,
);
explorationZonesRouter.patch(
  "/:zoneId",
  requireRoles("Administrador sistema"),
  validateBody(updateExplorationZoneSchema),
  updateExplorationZoneController,
);
