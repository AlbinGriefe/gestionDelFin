import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { dashboardService } from "./dashboard.service.js";

export async function getDashboardController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.auth) {
      throw new Error("Authenticated user context is missing.");
    }
    const result = await dashboardService.getDashboard(request.auth);
    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
