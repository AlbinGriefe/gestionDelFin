import { Router } from "express";

import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createInventoryAdjustmentController,
  getInventoryByStorageIdController,
  getInventoryCatalogsController,
  listInventoryController,
  updateInventoryThresholdsController,
} from "./inventory.controller.js";
import {
  createInventoryAdjustmentSchema,
  updateInventoryThresholdsSchema,
} from "./inventory.schemas.js";

const inventoryWriterRoles = [
  "SuperAdmin",
  "Administrador sistema",
  "Gestión recursos",
  "Gestion recursos",
] as const;

const inventoryRouter = Router();

inventoryRouter.use(authenticate);
inventoryRouter.get("/catalogs", getInventoryCatalogsController);
inventoryRouter.get("/", listInventoryController);
inventoryRouter.get("/:storageId", getInventoryByStorageIdController);
inventoryRouter.post(
  "/adjustments",
  requireRoles(...inventoryWriterRoles),
  validateBody(createInventoryAdjustmentSchema),
  createInventoryAdjustmentController,
);
inventoryRouter.patch(
  "/:storageId/thresholds",
  requireRoles(...inventoryWriterRoles),
  validateBody(updateInventoryThresholdsSchema),
  updateInventoryThresholdsController,
);

export { inventoryRouter };
