import type { NextFunction, Request, Response } from "express";

import {
  campIdParamSchema,
  createCampSchema,
  listCampsQuerySchema,
  updateCampSchema,
  updateCampOperationalRulesSchema,
} from "./camps.schemas.js";
import { campsService } from "./camps.service.js";
import type { CampListFilters, CampWriteInput } from "./camps.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function listCampsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listCampsQuerySchema.parseAsync(
      request.query,
    ) as CampListFilters;
    const result = await campsService.listCamps(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getCampByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { campId } = await campIdParamSchema.parseAsync(request.params);
    const result = await campsService.getCampById(
      campId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createCampController(
  request: Request<Record<string, never>, unknown, CampWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createCampSchema.parseAsync(request.body);
    const result = await campsService.createCamp(
      body,
      getAuthenticatedUser(request),
    );

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateCampController(
  request: Request<{ campId: string }, unknown, CampWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { campId } = await campIdParamSchema.parseAsync(request.params);
    const body = await updateCampSchema.parseAsync(request.body);
    const result = await campsService.updateCamp(
      campId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateCampOperationalRulesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { campId } = await campIdParamSchema.parseAsync(request.params);
    const body = await updateCampOperationalRulesSchema.parseAsync(request.body);
    const result = await campsService.updateOperationalRules(
      campId,
      body,
      getAuthenticatedUser(request),
    );
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
