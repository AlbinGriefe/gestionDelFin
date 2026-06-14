import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createProfessionController,
  getProfessionByIdController,
  getProfessionCoverageController,
  listProfessionsController,
  revertReassignmentController,
  temporaryReassignmentController,
  updateProfessionController,
} from "./professions.controller.js";
import {
  createProfessionSchema,
  revertReassignmentSchema,
  temporaryReassignmentSchema,
  updateProfessionSchema,
} from "./professions.schemas.js";

const professionsRouter = Router();

professionsRouter.use(authenticate);
professionsRouter.get("/coverage", getProfessionCoverageController);
professionsRouter.get("/", listProfessionsController);
professionsRouter.get("/:professionId", getProfessionByIdController);
professionsRouter.post(
  "/",
  validateBody(createProfessionSchema),
  createProfessionController,
);
professionsRouter.post(
  "/temporary-reassignment",
  validateBody(temporaryReassignmentSchema),
  temporaryReassignmentController,
);
professionsRouter.post(
  "/revert-reassignment",
  validateBody(revertReassignmentSchema),
  revertReassignmentController,
);
professionsRouter.patch(
  "/:professionId",
  validateBody(updateProfessionSchema),
  updateProfessionController,
);

export { professionsRouter };
