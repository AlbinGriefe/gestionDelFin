import type { NextFunction, Request, Response } from "express";

import { createSuccessResponse } from "../../shared/responses/api-response.js";
import { settingsService } from "./settings.service.js";
import { settingKeyParamSchema, updateSettingSchema } from "./settings.schemas.js";
import type { SettingWriteInput } from "./settings.types.js";

function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new Error("Authenticated user context is missing.");
  }

  return request.auth;
}

export async function listPublicSettingsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await settingsService.listPublicSettings();

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function listSettingsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const result = await settingsService.listSettings(getAuthenticatedUser(request));

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function getSettingByKeyController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { key } = await settingKeyParamSchema.parseAsync(request.params);
    const result = await settingsService.getSettingByKey(
      key,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}

export async function upsertSettingController(
  request: Request<{ key: string }, unknown, SettingWriteInput>,
  response: Response,
  next: NextFunction,
) {
  try {
    const { key } = await settingKeyParamSchema.parseAsync(request.params);
    const body = await updateSettingSchema.parseAsync(request.body);
    const result = await settingsService.upsertSetting(
      key,
      body,
      getAuthenticatedUser(request),
    );

    response.status(200).json(createSuccessResponse(result, request.requestId));
  } catch (error) {
    next(error);
  }
}
