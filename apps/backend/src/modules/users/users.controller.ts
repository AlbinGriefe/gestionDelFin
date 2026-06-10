import type { NextFunction, Request, Response } from "express";

import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "./users.schemas.js";
import { usersService } from "./users.service.js";
import type { UserListFilters, UserWriteInput } from "./users.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

export async function getUsersCatalogsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await usersService.getCatalogs();

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = (await listUsersQuerySchema.parseAsync(
      request.query,
    )) as UserListFilters;
    const result = await usersService.listUsers(filters);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { userId } = await userIdParamSchema.parseAsync(request.params);
    const result = await usersService.getUserById(userId);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createUserController(
  request: Request<Record<string, never>, unknown, UserWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.auth) {
      throw new Error("Authenticated user context is missing.");
    }

    const body = await createUserSchema.parseAsync(request.body);
    const result = await usersService.createUser(body, request.auth);

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(
  request: Request<{ userId: string }, unknown, UserWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!request.auth) {
      throw new Error("Authenticated user context is missing.");
    }

    const { userId } = await userIdParamSchema.parseAsync(request.params);
    const body = await updateUserSchema.parseAsync(request.body);
    const result = await usersService.updateUser(userId, body, request.auth);

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
