import { Router } from "express";
import { authenticate } from "../../api/v1/middlewares/authenticate.js";
import {
  evaluatePersonController,
  confirmEvaluationController,
  getPersonEvaluationsController,
} from "./ai-evaluations.controller.js";

const router = Router();

/**
 * POST /api/v1/ai-evaluations/evaluate
 * Evalúa una persona con Gemini Vision para detectar infección zombie.
 * Body: { personId, photoBase64, mimeType?, modelName? }
 */
router.post("/evaluate", authenticate, evaluatePersonController);

/**
 * PATCH /api/v1/ai-evaluations/confirm/:id
 * Un revisor humano confirma o corrige la decisión de la IA.
 * Body: { userDecision, userObservation? }
 */
router.patch("/confirm/:id", authenticate, confirmEvaluationController);

/**
 * GET /api/v1/ai-evaluations/person/:personId
 * Obtiene el historial de evaluaciones de una persona.
 */
router.get("/person/:personId", authenticate, getPersonEvaluationsController);

export default router;
