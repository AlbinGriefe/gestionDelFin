import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { eventIdParamSchema, listEventsQuerySchema } from "./events.schemas.js";
import { eventsService } from "./events.service.js";
import type { EventListFilters } from "./events.types.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function listEventsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = (await listEventsQuerySchema.parseAsync(
      request.query,
    )) as EventListFilters;

    const result = await eventsService.listEvents(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getEventByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { eventId } = await eventIdParamSchema.parseAsync(request.params);

    const result = await eventsService.getEventById(
      eventId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
