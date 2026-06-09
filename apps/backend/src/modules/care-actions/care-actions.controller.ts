import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { healPersonSchema } from "./care-actions.schemas.js";
import { careActionsService } from "./care-actions.service.js";

export async function healPersonController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.auth) throw new Error("Authenticated user context is missing.");
    const input = await healPersonSchema.parseAsync(request.body);
    const result = await careActionsService.heal(input, request.auth);
    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
