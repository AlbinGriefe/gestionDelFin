import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "../../../lib/logger.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { createErrorResponse } from "../../../shared/responses/api-response.js";

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null;
}

function getSafeErrorDetails(error: unknown): ErrorRecord {
  if (!isRecord(error)) {
    return {
      value: String(error),
    };
  }

  const details: ErrorRecord = {
    name: typeof error.name === "string" ? error.name : error.constructor?.name,
    message: error instanceof Error ? error.message : String(error),
  };

  if (typeof error.code === "string") {
    details.code = error.code;
  }

  if ("clientVersion" in error && typeof error.clientVersion === "string") {
    details.clientVersion = error.clientVersion;
  }

  if ("meta" in error) {
    details.meta = error.meta;
  }

  if (error instanceof Error && error.stack) {
    details.stack = error.stack;
  }

  if ("cause" in error && isRecord(error.cause)) {
    details.cause = {
      name:
        typeof error.cause.name === "string"
          ? error.cause.name
          : error.cause.constructor?.name,
      message:
        error.cause instanceof Error
          ? error.cause.message
          : String(error.cause),
      code: typeof error.cause.code === "string" ? error.cause.code : undefined,
    };
  }

  return details;
}

function getPrismaErrorCode(error: unknown) {
  if (!isRecord(error)) {
    return null;
  }

  if (typeof error.code !== "string") {
    return null;
  }

  const name =
    typeof error.name === "string"
      ? error.name
      : (error.constructor?.name ?? "");

  if (name.includes("Prisma") || "clientVersion" in error) {
    return error.code;
  }

  return null;
}

function mapKnownPersistenceError(error: unknown): AppError | null {
  const code = getPrismaErrorCode(error);

  switch (code) {
    case "P2000":
      return new AppError(
        400,
        "One of the provided values is too long.",
        "DATABASE_VALUE_TOO_LONG",
      );
    case "P2002":
      return new AppError(
        409,
        "A record with the same unique value already exists.",
        "DATABASE_UNIQUE_CONSTRAINT",
      );
    case "P2003":
      return new AppError(
        409,
        "A related record is missing or cannot be changed.",
        "DATABASE_RELATION_CONSTRAINT",
      );
    case "P2004":
    case "P2011":
    case "P2012":
    case "P2014":
      return new AppError(
        400,
        "The request violates a database constraint.",
        "DATABASE_CONSTRAINT_FAILED",
      );
    case "P2025":
      return new AppError(
        404,
        "The requested record no longer exists.",
        "DATABASE_RECORD_NOT_FOUND",
      );
    default:
      return null;
  }
}

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

  const persistenceError = mapKnownPersistenceError(error);

  if (persistenceError) {
    logger.warn("Handled persistence error.", {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      userId: request.auth?.id ?? null,
      roleName: request.auth?.roleName ?? null,
      campId: request.auth?.campId ?? null,
      error: getSafeErrorDetails(error),
    });

    response.status(persistenceError.statusCode).json(
      createErrorResponse({
        code: persistenceError.code,
        message: persistenceError.message,
        details: persistenceError.details,
        requestId: request.requestId,
      }),
    );
    return;
  }

  logger.error("Unhandled application error.", {
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
    userId: request.auth?.id ?? null,
    roleName: request.auth?.roleName ?? null,
    campId: request.auth?.campId ?? null,
    error: getSafeErrorDetails(error),
  });

  response.status(500).json(
    createErrorResponse({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      requestId: request.requestId,
    }),
  );
}
