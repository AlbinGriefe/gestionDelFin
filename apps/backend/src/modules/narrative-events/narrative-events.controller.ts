import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  listNarrativeEventsQuerySchema,
  narrativeEventIdParamSchema,
} from "./narrative-events.schemas.js";
import { narrativeEventsService } from "./narrative-events.service.js";

function actor(request: Request) {
  if (!request.auth) throw new Error("Authenticated user context is missing.");
  return request.auth;
}

export async function listNarrativeEventsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await listNarrativeEventsQuerySchema.parseAsync(request.query);
    const result = await narrativeEventsService.list(input, actor(request));
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getNarrativeEventController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { eventId } = await narrativeEventIdParamSchema.parseAsync(
      request.params,
    );
    const result = await narrativeEventsService.getById(eventId, actor(request));
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
