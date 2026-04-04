import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  productionCorrectionSchema,
  runDailyProcessSchema,
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
    const body = await runDailyProcessSchema.parseAsync(request.body);
    const result = await dailyProcessesService.runDailyProcess(
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function applyProductionCorrectionController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await productionCorrectionSchema.parseAsync(request.body);
    const result = await dailyProcessesService.applyProductionCorrection(
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
