import { z } from "zod";

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

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const optionalPositiveInteger = z.preprocess(
  parseOptionalInteger,
  z.number().int().positive().optional(),
);

export const eventIdParamSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});

export const listEventsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  campId: optionalPositiveInteger,
  entity: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
  entityId: optionalPositiveInteger,
  userId: optionalPositiveInteger,
  dateFrom: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  dateTo: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
});
