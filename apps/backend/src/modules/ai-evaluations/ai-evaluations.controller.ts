import type { Request, Response, NextFunction } from "express";
import { AiEvaluationsService } from "./ai-evaluations.service.js";
import {
  runAiEvaluationBodySchema,
  confirmEvaluationBodySchema,
  confirmEvaluationParamsSchema,
  getByPersonParamsSchema,
} from "./ai-evaluations.schemas.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { AppError } from "../../shared/errors/app-error.js";

const service = new AiEvaluationsService();

// ─── POST /api/v1/ai-evaluations/evaluate ────────────────────────────────────

export async function evaluatePersonController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = runAiEvaluationBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400);
    }

    const result = await service.evaluatePerson({
      personId: parsed.data.personId,
      photoBase64: parsed.data.photoBase64,
      mimeType: parsed.data.mimeType,
      modelName: parsed.data.modelName,
      reviewerUserId: (req as any).user?.id_user,
    });

    res
      .status(200)
      .json(createSuccessResponse(result, `Evaluación completada: ${result.verdict}`));
  } catch (error) {
    next(error);
  }
}

// ─── PATCH /api/v1/ai-evaluations/confirm/:id ────────────────────────────────

export async function confirmEvaluationController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedParams = confirmEvaluationParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new AppError(parsedParams.error.errors[0].message, 400);
    }

    const parsedBody = confirmEvaluationBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new AppError(parsedBody.error.errors[0].message, 400);
    }

    const result = await service.confirmEvaluation({
      evaluationId: parsedParams.data.id,
      userDecision: parsedBody.data.userDecision,
      userObservation: parsedBody.data.userObservation,
      reviewerUserId: (req as any).user?.id_user,
    });

    res
      .status(200)
      .json(createSuccessResponse(result, "Evaluación confirmada correctamente"));
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/v1/ai-evaluations/person/:personId ─────────────────────────────

export async function getPersonEvaluationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = getByPersonParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0].message, 400);
    }

    const result = await service.getPersonEvaluations(parsed.data.personId);

    res
      .status(200)
      .json(
        createSuccessResponse(
          result,
          `Se encontraron ${result.length} evaluaciones para la persona ${parsed.data.personId}`
        )
      );
  } catch (error) {
    next(error);
  }
}
