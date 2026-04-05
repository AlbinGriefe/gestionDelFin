import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function emptyStringToNull(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
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

function parseOptionalDecimal(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }

  return value;
}

function ensureUniqueMemberIds<
  T extends Record<string, unknown>,
  K extends keyof T & string,
>(items: T[], key: K, context: z.RefinementCtx, path: string) {
  const seen = new Set<number>();

  items.forEach((item, index) => {
    const value = item[key];

    if (typeof value !== "number") {
      return;
    }

    if (seen.has(value)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate ${path} items are not allowed.`,
        path: [path, index, key],
      });
      return;
    }

    seen.add(value);
  });
}

const expeditionStateEnum = z.enum([
  "planned",
  "in_progress",
  "returned",
  "failed",
  "cancelled",
]);

export const expeditionIdParamSchema = z.object({
  expeditionId: z.coerce.number().int().positive(),
});

export const expeditionCatalogsQuerySchema = z.object({
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
});

export const listExpeditionsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  state: z.preprocess(emptyStringToUndefined, expeditionStateEnum.optional()),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(120).optional(),
  ),
});

const expeditionMemberSchema = z.object({
  id_person: z.coerce.number().int().positive(),
  id_resource: z.preprocess(
    (value) => {
      if (value === null || value === "" || value === "null") {
        return null;
      }

      return parseOptionalInteger(value);
    },
    z.number().int().positive().nullable().optional(),
  ),
  roleInExpedition: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(100).nullable().optional(),
  ),
  rationsAssigned: z.preprocess(
    parseOptionalDecimal,
    z.number().min(0).optional().default(0),
  ),
  notes: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255).nullable().optional(),
  ),
});

export const createExpeditionSchema = z
  .object({
    id_camp: z.preprocess(
      parseOptionalInteger,
      z.number().int().positive().optional(),
    ),
    exs_name: z.string().trim().min(3).max(100),
    exs_leaving_date: z.preprocess(parseOptionalDate, z.date()),
    exs_estimated_days: z.preprocess(
      parseOptionalInteger,
      z.number().int().min(1).max(365).optional().default(1),
    ),
    exe_notes: z.preprocess(
      emptyStringToNull,
      z.string().trim().max(255).nullable().optional(),
    ),
    members: z.array(expeditionMemberSchema).min(1),
  })
  .superRefine((value, context) => {
    ensureUniqueMemberIds(value.members, "id_person", context, "members");
  });

const expeditionReturnMemberSchema = z.object({
  id_person: z.coerce.number().int().positive(),
  resourcesFound: z.preprocess(
    parseOptionalDecimal,
    z.number().min(0).optional().default(0),
  ),
  notes: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255).nullable().optional(),
  ),
});

export const updateExpeditionStateSchema = z
  .object({
    nextState: z.enum(["in_progress", "returned", "failed", "cancelled"]),
    exe_resources_used: z.preprocess(
      parseOptionalDecimal,
      z.number().min(0).optional(),
    ),
    exe_resources_returned: z.preprocess(
      parseOptionalDecimal,
      z.number().min(0).optional(),
    ),
    exs_arriving_date: z.preprocess(parseOptionalDate, z.date().nullable().optional()),
    members: z.array(expeditionReturnMemberSchema).optional().default([]),
    notes: z.preprocess(
      emptyStringToNull,
      z.string().trim().max(255).nullable().optional(),
    ),
  })
  .superRefine((value, context) => {
    ensureUniqueMemberIds(value.members, "id_person", context, "members");

    if (value.nextState === "in_progress" && value.exs_arriving_date) {
      context.addIssue({
        code: "custom",
        message: "Arrival date cannot be set when expedition is starting.",
        path: ["exs_arriving_date"],
      });
    }
  });
