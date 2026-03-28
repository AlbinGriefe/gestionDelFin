import type { NextFunction, Request, Response } from "express";

import {
  createTransferSchema,
  listTransfersQuerySchema,
  transferCatalogsQuerySchema,
  transferIdParamSchema,
  updateTransferStateSchema,
} from "./transfers.schemas.js";
import { transfersService } from "./transfers.service.js";
import type {
  TransferCatalogFilters,
  TransferCreateInput,
  TransferListFilters,
  TransferStateUpdateInput,
} from "./transfers.types.js";
import { createSuccessResponse } from "../../shared/responses/api-response.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function getTransferCatalogsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await transferCatalogsQuerySchema.parseAsync(
      request.query,
    ) as TransferCatalogFilters;
    const result = await transfersService.getCatalogs(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listTransfersController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const filters = await listTransfersQuerySchema.parseAsync(
      request.query,
    ) as TransferListFilters;
    const result = await transfersService.listTransfers(
      filters,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getTransferByIdController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { transferId } = await transferIdParamSchema.parseAsync(request.params);
    const result = await transfersService.getTransferById(
      transferId,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function createTransferController(
  request: Request<Record<string, never>, unknown, TransferCreateInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const body = await createTransferSchema.parseAsync(request.body);
    const result = await transfersService.createTransfer(
      body,
      getAuthenticatedUser(request),
    );

    response.status(201).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function updateTransferStateController(
  request: Request<{ transferId: string }, unknown, TransferStateUpdateInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { transferId } = await transferIdParamSchema.parseAsync(request.params);
    const body = await updateTransferStateSchema.parseAsync(request.body);
    const result = await transfersService.updateTransferState(
      transferId,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
