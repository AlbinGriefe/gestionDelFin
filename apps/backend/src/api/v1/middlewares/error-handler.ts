import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { createErrorResponse } from "../../../shared/responses/api-response.js";

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    response.status(400).json(
      createErrorResponse({
        code: "VALIDATION_ERROR",
        message: "The request body is invalid.",
        details: error.flatten(),
        requestId: request.requestId,
      }),
    );
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json(
      createErrorResponse({
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.requestId,
      }),
    );
    return;
  }

  logger.error("Unhandled application error.", {
    error,
    requestId: request.requestId,
  });

  response.status(500).json(
    createErrorResponse({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      requestId: request.requestId,
    }),
  );
}
