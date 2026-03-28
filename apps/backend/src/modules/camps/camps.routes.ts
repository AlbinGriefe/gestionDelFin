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
} from "./camps.controller.js";
import { createCampSchema, updateCampSchema } from "./camps.schemas.js";

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

export { campsRouter };
