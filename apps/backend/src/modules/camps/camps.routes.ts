import { Router } from "express";

import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createCampController,
  getCampByIdController,
  listCampLocationsController,
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
campsRouter.get("/locations", listCampLocationsController);
campsRouter.get("/:campId", getCampByIdController);
campsRouter.post(
  "/",
  requireRoles("SuperAdmin"),
  validateBody(createCampSchema),
  createCampController,
);
campsRouter.patch(
  "/:campId",
  requireRoles("SuperAdmin"),
  validateBody(updateCampSchema),
  updateCampController,
);
campsRouter.put(
  "/:campId/operational-rules",
  requireRoles("SuperAdmin"),
  validateBody(updateCampOperationalRulesSchema),
  updateCampOperationalRulesController,
);

export { campsRouter };
