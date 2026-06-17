import { Router } from "express";
import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
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
  requireRoles(
    "SuperAdmin",
    "Administrador sistema",
    "Encargado de viajes y comunicacion",
  ),
  validateBody(createExplorationZoneSchema),
  createExplorationZoneController,
);
explorationZonesRouter.patch(
  "/:zoneId",
  requireRoles(
    "SuperAdmin",
    "Administrador sistema",
    "Encargado de viajes y comunicacion",
  ),
  validateBody(updateExplorationZoneSchema),
  updateExplorationZoneController,
);
