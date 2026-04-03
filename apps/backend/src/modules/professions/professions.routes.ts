import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createProfessionController,
  getProfessionByIdController,
  listProfessionsController,
  updateProfessionController,
} from "./professions.controller.js";
import { createProfessionSchema, updateProfessionSchema } from "./professions.schemas.js";

const professionsRouter = Router();

professionsRouter.use(authenticate);
professionsRouter.get("/", listProfessionsController);
professionsRouter.get("/:professionId", getProfessionByIdController);
professionsRouter.post("/", validateBody(createProfessionSchema), createProfessionController);
professionsRouter.patch(
  "/:professionId",
  validateBody(updateProfessionSchema),
  updateProfessionController,
);

export { professionsRouter };
