import type { Request, Response } from "express";

import { createErrorResponse } from "../../../shared/responses/api-response.js";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json(
    createErrorResponse({
      code: "ROUTE_NOT_FOUND",
      message: `Route ${request.method} ${request.originalUrl} was not found.`,
      requestId: request.requestId,
    }),
  );
}
