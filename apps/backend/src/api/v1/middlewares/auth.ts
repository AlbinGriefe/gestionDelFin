import type { NextFunction, Request, Response } from "express";

import { authService } from "../../../modules/auth/auth.service.js";
import {
  isSuperAdminRole,
  normalizeRoleName,
} from "../../../shared/auth/roles.js";
import { AppError } from "../../../shared/errors/app-error.js";

function extractBearerToken(request: Request) {
  const authorizationHeader = request.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing bearer token.", "MISSING_AUTH_TOKEN");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export async function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const token = extractBearerToken(request);
    request.auth = await authService.resolveAuthenticatedUser(token);

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new AppError(401, "Authentication is required.", "AUTH_REQUIRED"));
      return;
    }

    if (allowedRoles.length === 0) {
      next();
      return;
    }

    const currentRole = normalizeRoleName(request.auth.roleName);
    if (isSuperAdminRole(request.auth.roleName)) {
      next();
      return;
    }

    const isAllowed = allowedRoles.some(
      (role) => normalizeRoleName(role) === currentRole,
    );

    if (!isAllowed) {
      next(
        new AppError(
          403,
          "You do not have access to this resource.",
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}
