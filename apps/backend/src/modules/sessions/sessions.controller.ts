import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { sessionsService } from "./sessions.service.js";
import {
  listSessionsQuerySchema,
  revokeSessionSchema,
  sessionIdParamSchema,
} from "./sessions.schemas.js";
import type {
  SessionListFilters,
  SessionRevokeInput,
} from "./sessions.types.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function listSessionsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listSessionsQuerySchema.parseAsync(
      request.query,
    ) as SessionListFilters;
    const result = await sessionsService.listSessions(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getCurrentSessionController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await sessionsService.getCurrentSession(
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getSessionByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { sessionId } = await sessionIdParamSchema.parseAsync(request.params);
    const result = await sessionsService.getSessionById(
      sessionId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function revokeSessionController(
  request: Request<{ sessionId: string }, unknown, SessionRevokeInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { sessionId } = await sessionIdParamSchema.parseAsync(request.params);
    const body = await revokeSessionSchema.parseAsync(request.body);
    const result = await sessionsService.revokeSession(
      sessionId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
