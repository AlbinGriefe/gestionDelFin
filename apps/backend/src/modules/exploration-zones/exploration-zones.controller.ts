import type { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "../../shared/responses/api-response.js";
import {
  createExplorationZoneSchema,
  explorationZoneIdParamSchema,
  listExplorationZonesQuerySchema,
  updateExplorationZoneSchema,
} from "./exploration-zones.schemas.js";
import { explorationZonesService } from "./exploration-zones.service.js";

function actor(request: Request) {
  if (!request.auth) throw new Error("Authenticated user context is missing.");
  return request.auth;
}

export async function listExplorationZonesController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await listExplorationZonesQuerySchema.parseAsync(
      request.query,
    );
    response
      .status(200)
      .json(
        createSuccessResponse(
          await explorationZonesService.list(input, actor(request)),
          request.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function getExplorationZoneController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { zoneId } = await explorationZoneIdParamSchema.parseAsync(
      request.params,
    );
    response
      .status(200)
      .json(
        createSuccessResponse(
          await explorationZonesService.getById(zoneId, actor(request)),
          request.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function createExplorationZoneController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = await createExplorationZoneSchema.parseAsync(request.body);
    response
      .status(201)
      .json(
        createSuccessResponse(
          await explorationZonesService.create(input, actor(request)),
          request.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}

export async function updateExplorationZoneController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { zoneId } = await explorationZoneIdParamSchema.parseAsync(
      request.params,
    );
    const input = await updateExplorationZoneSchema.parseAsync(request.body);
    response
      .status(200)
      .json(
        createSuccessResponse(
          await explorationZonesService.update(zoneId, input, actor(request)),
          request.requestId,
        ),
      );
  } catch (error) {
    next(error);
  }
}
