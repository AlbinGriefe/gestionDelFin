import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  dailyProcessStatusParamsSchema,
  dailyAssignmentsQuerySchema,
  runDailyProcessBodySchema,
  updateDailyAssignmentsSchema,
} from "./daily-processes.schemas.js";
import { dailyProcessesService } from "./daily-processes.service.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }
  return request.auth;
}

export async function runDailyProcessController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await runDailyProcessBodySchema.parseAsync(request.body);
    const actor = getAuthenticatedUser(request);
    const result = await dailyProcessesService.runDailyProcess(body, actor);

    response
      .status(result.alreadyRunToday ? 200 : 201)
      .json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getDailyProcessStatusController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { campId } = await dailyProcessStatusParamsSchema.parseAsync(request.params);
    const actor = getAuthenticatedUser(request);
    const result = await dailyProcessesService.getDailyProcessStatus(campId, actor);

    response
      .status(200)
      .json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getDailyAssignmentsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await dailyAssignmentsQuerySchema.parseAsync(request.query);
    const result = await dailyProcessesService.getAssignments(
      input.campId,
      input.date,
      getAuthenticatedUser(request),
    );
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateDailyAssignmentsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await updateDailyAssignmentsSchema.parseAsync(request.body);
    const result = await dailyProcessesService.updateAssignments(
      input,
      getAuthenticatedUser(request),
    );
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
