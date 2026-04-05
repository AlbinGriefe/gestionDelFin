import type { NextFunction, Request, Response } from "express";

import { authService } from "./auth.service.js";
import type { LoginInput } from "./auth.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

function resolveIpAddress(request: Request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

export async function loginController(
  request: Request<Record<string, never>, unknown, LoginInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.login(
      request.body,
      resolveIpAddress(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function sessionConfigController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.getSessionConfig();

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function meController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json(createSuccessResponse(request.auth, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.auth) {
      throw new Error("Authenticated user context is missing.");
    }

    const result = await authService.logout(request.auth.sessionId);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
