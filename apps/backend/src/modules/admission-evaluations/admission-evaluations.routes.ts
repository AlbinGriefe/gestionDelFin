import { Router } from "express";
import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  confirmAdmissionEvaluationController,
  createAdmissionEvaluationController,
  getTextAiHealthController,
} from "./admission-evaluations.controller.js";
import {
  confirmAdmissionEvaluationSchema,
  createAdmissionEvaluationSchema,
} from "./admission-evaluations.schemas.js";

export const admissionEvaluationsRouter = Router();

admissionEvaluationsRouter.use(authenticate);
admissionEvaluationsRouter.use(requireRoles("Administrador sistema"));
admissionEvaluationsRouter.get("/health", getTextAiHealthController);
admissionEvaluationsRouter.post(
  "/",
  validateBody(createAdmissionEvaluationSchema),
  createAdmissionEvaluationController,
);
admissionEvaluationsRouter.patch(
  "/:evaluationId/confirm",
  validateBody(confirmAdmissionEvaluationSchema),
  confirmAdmissionEvaluationController,
);
