import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  admissionEvaluationIdParamSchema,
  confirmAdmissionEvaluationSchema,
  createAdmissionEvaluationSchema,
} from "./admission-evaluations.schemas.js";
import { admissionEvaluationsService } from "./admission-evaluations.service.js";

function actor(request: Request) {
  if (!request.auth) throw new Error("Authenticated user context is missing.");
  return request.auth;
}

export async function getTextAiHealthController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json(
        createSuccessResponse(
          await admissionEvaluationsService.getHealth(),
          request.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function createAdmissionEvaluationController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await createAdmissionEvaluationSchema.parseAsync(request.body);
    const result = await admissionEvaluationsService.evaluate(
      input,
      actor(request),
    );
    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function confirmAdmissionEvaluationController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { evaluationId } =
      await admissionEvaluationIdParamSchema.parseAsync(request.params);
    const input = await confirmAdmissionEvaluationSchema.parseAsync(request.body);
    const result = await admissionEvaluationsService.confirm(
      evaluationId,
      input,
      actor(request),
    );
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
