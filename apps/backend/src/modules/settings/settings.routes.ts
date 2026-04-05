import { Router } from "express";

import {
  authenticate,
  requireRoles,
} from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  getSettingByKeyController,
  listPublicSettingsController,
  listSettingsController,
  upsertSettingController,
} from "./settings.controller.js";
import { updateSettingSchema } from "./settings.schemas.js";

const settingsRouter = Router();

settingsRouter.get("/public", listPublicSettingsController);

settingsRouter.use(authenticate);
settingsRouter.get("/:key", getSettingByKeyController);
settingsRouter.get("/", requireRoles("Administrador sistema"), listSettingsController);
settingsRouter.put(
  "/:key",
  requireRoles("Administrador sistema"),
  validateBody(updateSettingSchema),
  upsertSettingController,
);

export { settingsRouter };
