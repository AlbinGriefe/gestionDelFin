import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function parseOptionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return value;
}

export const sessionIdParamSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
});

export const listSessionsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  userId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  active: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  reason: z.preprocess(
    emptyStringToUndefined,
    z
      .enum(["manual", "timeout", "forced", "camp_change", "security"])
      .optional(),
  ),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
});

export const revokeSessionSchema = z.object({
  reason: z.enum(["manual", "forced", "security"]).optional(),
});
