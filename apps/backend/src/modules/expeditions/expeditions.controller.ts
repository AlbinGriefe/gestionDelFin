import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  createExpeditionSchema,
  expeditionCatalogsQuerySchema,
  expeditionIdParamSchema,
  listExpeditionsQuerySchema,
  updateExpeditionStateSchema,
} from "./expeditions.schemas.js";
import { expeditionsService } from "./expeditions.service.js";
import type {
  ExpeditionCatalogFilters,
  ExpeditionCreateInput,
  ExpeditionListFilters,
  ExpeditionStateUpdateInput,
} from "./expeditions.types.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function getExpeditionsCatalogsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await expeditionCatalogsQuerySchema.parseAsync(
      request.query,
    ) as ExpeditionCatalogFilters;
    const result = await expeditionsService.getCatalogs(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listExpeditionsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listExpeditionsQuerySchema.parseAsync(
      request.query,
    ) as ExpeditionListFilters;
    const result = await expeditionsService.listExpeditions(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getExpeditionByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { expeditionId } = await expeditionIdParamSchema.parseAsync(request.params);
    const result = await expeditionsService.getExpeditionById(
      expeditionId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createExpeditionController(
  request: Request<Record<string, never>, unknown, ExpeditionCreateInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createExpeditionSchema.parseAsync(request.body);
    const result = await expeditionsService.createExpedition(
      body,
      getAuthenticatedUser(request),
    );

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateExpeditionStateController(
  request: Request<{ expeditionId: string }, unknown, ExpeditionStateUpdateInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { expeditionId } = await expeditionIdParamSchema.parseAsync(request.params);
    const body = await updateExpeditionStateSchema.parseAsync(request.body);
    const result = await expeditionsService.updateExpeditionState(
      expeditionId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
