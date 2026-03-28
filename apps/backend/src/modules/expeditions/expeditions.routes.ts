import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createExpeditionController,
  getExpeditionByIdController,
  getExpeditionsCatalogsController,
  listExpeditionsController,
  updateExpeditionStateController,
} from "./expeditions.controller.js";
import {
  createExpeditionSchema,
  updateExpeditionStateSchema,
} from "./expeditions.schemas.js";

const expeditionsRouter = Router();

expeditionsRouter.use(authenticate);
expeditionsRouter.get("/catalogs", getExpeditionsCatalogsController);
expeditionsRouter.get("/", listExpeditionsController);
expeditionsRouter.get("/:expeditionId", getExpeditionByIdController);
expeditionsRouter.post(
  "/",
  validateBody(createExpeditionSchema),
  createExpeditionController,
);
expeditionsRouter.patch(
  "/:expeditionId/state",
  validateBody(updateExpeditionStateSchema),
  updateExpeditionStateController,
);

export { expeditionsRouter };
