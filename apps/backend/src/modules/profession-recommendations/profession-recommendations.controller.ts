import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  confirmProfessionRecommendationSchema,
  createProfessionRecommendationSchema,
  professionRecommendationIdParamSchema,
} from "./profession-recommendations.schemas.js";
import { professionRecommendationsService } from "./profession-recommendations.service.js";

function actor(request: Request) {
  if (!request.auth) throw new Error("Authenticated user context is missing.");
  return request.auth;
}

export async function createProfessionRecommendationController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await createProfessionRecommendationSchema.parseAsync(
      request.body,
    );
    const result = await professionRecommendationsService.recommend(
      input,
      actor(request),
    );
    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function confirmProfessionRecommendationController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { recommendationId } =
      await professionRecommendationIdParamSchema.parseAsync(request.params);
    const input = await confirmProfessionRecommendationSchema.parseAsync(
      request.body,
    );
    const result = await professionRecommendationsService.confirm(
      recommendationId,
      input,
      actor(request),
    );
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
