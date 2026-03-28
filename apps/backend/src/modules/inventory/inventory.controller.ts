import type { NextFunction, Request, Response } from "express";

import {
  createInventoryAdjustmentSchema,
  listInventoryQuerySchema,
  storageIdParamSchema,
  updateInventoryThresholdsSchema,
} from "./inventory.schemas.js";
import { inventoryService } from "./inventory.service.js";
import type {
  InventoryAdjustmentInput,
  InventoryListFilters,
  InventoryThresholdsInput,
} from "./inventory.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function getInventoryCatalogsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await inventoryService.getCatalogs(
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listInventoryController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listInventoryQuerySchema.parseAsync(
      request.query,
    ) as InventoryListFilters;
    const result = await inventoryService.listInventory(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getInventoryByStorageIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { storageId } = await storageIdParamSchema.parseAsync(request.params);
    const result = await inventoryService.getInventoryByStorageId(
      storageId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createInventoryAdjustmentController(
  request: Request<Record<string, never>, unknown, InventoryAdjustmentInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createInventoryAdjustmentSchema.parseAsync(request.body);
    const result = await inventoryService.applyAdjustment(
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateInventoryThresholdsController(
  request: Request<{ storageId: string }, unknown, InventoryThresholdsInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { storageId } = await storageIdParamSchema.parseAsync(request.params);
    const body = await updateInventoryThresholdsSchema.parseAsync(request.body);
    const result = await inventoryService.updateThresholds(
      storageId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
