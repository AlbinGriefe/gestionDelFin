import type { NextFunction, Request, Response } from "express";

import {
  createPersonSchema,
  listPersonsQuerySchema,
  personIdParamSchema,
} from "./persons.schemas.js";
import { personsService } from "./persons.service.js";
import type { PersonListFilters, PersonWriteInput } from "./persons.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function getPersonsCatalogsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await personsService.getCatalogs();

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listPersonsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listPersonsQuerySchema.parseAsync(
      request.query,
    ) as PersonListFilters;
    const result = await personsService.listPersons(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getPersonByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { personId } = await personIdParamSchema.parseAsync(request.params);
    const result = await personsService.getPersonById(
      personId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createPersonController(
  request: Request<Record<string, never>, unknown, PersonWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createPersonSchema.parseAsync(request.body);
    const result = await personsService.createPerson(
      body,
      getAuthenticatedUser(request),
    );

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updatePersonController(
  request: Request<{ personId: string }, unknown, PersonWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { personId } = await personIdParamSchema.parseAsync(request.params);
    const result = await personsService.updatePerson(
      personId,
      request.body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
