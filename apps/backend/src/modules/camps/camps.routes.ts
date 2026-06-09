import { Router } from "express";

import {
  authenticate,
  requireRoles,
} from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createCampController,
  getCampByIdController,
  listCampsController,
  updateCampController,
  updateCampOperationalRulesController,
} from "./camps.controller.js";
import {
  createCampSchema,
  updateCampOperationalRulesSchema,
  updateCampSchema,
} from "./camps.schemas.js";

const campsRouter = Router();

campsRouter.use(authenticate);
campsRouter.get("/", listCampsController);
campsRouter.get("/:campId", getCampByIdController);
campsRouter.post(
  "/",
  requireRoles("Administrador sistema"),
  validateBody(createCampSchema),
  createCampController,
);
campsRouter.patch(
  "/:campId",
  requireRoles("Administrador sistema"),
  validateBody(updateCampSchema),
  updateCampController,
);
campsRouter.put(
  "/:campId/operational-rules",
  requireRoles("Administrador sistema"),
  validateBody(updateCampOperationalRulesSchema),
  updateCampOperationalRulesController,
);

export { campsRouter };
