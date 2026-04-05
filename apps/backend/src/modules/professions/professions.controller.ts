import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  createProfessionSchema,
  listProfessionsQuerySchema,
  professionIdParamSchema,
  updateProfessionSchema,
} from "./professions.schemas.js";
import { professionsService } from "./professions.service.js";
import type { ProfessionListFilters, ProfessionWriteInput } from "./professions.types.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function listProfessionsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = (await listProfessionsQuerySchema.parseAsync(
      request.query,
    )) as ProfessionListFilters;

    const result = await professionsService.listProfessions(filters);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getProfessionByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { professionId } = await professionIdParamSchema.parseAsync(request.params);
    const result = await professionsService.getProfessionById(professionId);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createProfessionController(
  request: Request<Record<string, never>, unknown, ProfessionWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createProfessionSchema.parseAsync(request.body);
    const result = await professionsService.createProfession(
      body,
      getAuthenticatedUser(request),
    );

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateProfessionController(
  request: Request<{ professionId: string }, unknown, ProfessionWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { professionId } = await professionIdParamSchema.parseAsync(request.params);
    const body = await updateProfessionSchema.parseAsync(request.body);
    const result = await professionsService.updateProfession(
      professionId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
