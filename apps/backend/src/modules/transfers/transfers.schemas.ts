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

const transferTypeEnum = z.enum(["resources", "people", "mixed"]);
const transferStateEnum = z.enum([
  "pending",
  "accepted",
  "declined",
  "scheduled",
  "in_transit",
  "delivered",
  "failed",
  "returned",
  "completed",
  "cancelled",
]);

const transferPersonItemSchema = z.object({
  id_person: z.coerce.number().int().positive(),
  assignedRations: z.preprocess(
    parseOptionalDecimal,
    z.number().min(0).optional().default(0),
  ),
  notes: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255).nullable().optional(),
  ),
});

const transferResourceItemSchema = z.object({
  id_resource: z.coerce.number().int().positive(),
  quantity: z.preprocess(parseOptionalDecimal, z.number().positive()),
  notes: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255).nullable().optional(),
  ),
});

function ensureUniqueIds<
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

export const transferIdParamSchema = z.object({
  transferId: z.coerce.number().int().positive(),
});

export const transferCatalogsQuerySchema = z.object({
  originCampId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
});

export const listTransfersQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  state: z.preprocess(emptyStringToUndefined, transferStateEnum.optional()),
  type: z.preprocess(emptyStringToUndefined, transferTypeEnum.optional()),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(120).optional(),
  ),
});

export const createTransferSchema = z
  .object({
    id_origin_camp: z.preprocess(
      parseOptionalInteger,
      z.number().int().positive().optional(),
    ),
    id_destiny_camp: z.coerce.number().int().positive(),
    tfs_type: transferTypeEnum,
    tfs_comments: z.preprocess(
      emptyStringToNull,
      z.string().trim().max(512).nullable().optional(),
    ),
    persons: z.array(transferPersonItemSchema).optional().default([]),
    resources: z.array(transferResourceItemSchema).optional().default([]),
  })
  .superRefine((value, context) => {
    ensureUniqueIds(value.persons, "id_person", context, "persons");
    ensureUniqueIds(value.resources, "id_resource", context, "resources");

    if (
      value.id_origin_camp &&
      value.id_origin_camp === value.id_destiny_camp
    ) {
      context.addIssue({
        code: "custom",
        message: "Origin and destiny camps must be different.",
        path: ["id_destiny_camp"],
      });
    }

    if (value.tfs_type === "people" && value.persons.length === 0) {
      context.addIssue({
        code: "custom",
        message: "At least one person is required for a people transfer.",
        path: ["persons"],
      });
    }

    if (value.tfs_type === "resources" && value.resources.length === 0) {
      context.addIssue({
        code: "custom",
        message: "At least one resource is required for a resources transfer.",
        path: ["resources"],
      });
    }

    if (value.tfs_type === "mixed") {
      if (value.persons.length === 0) {
        context.addIssue({
          code: "custom",
          message: "At least one person is required for a mixed transfer.",
          path: ["persons"],
        });
      }

      if (value.resources.length === 0) {
        context.addIssue({
          code: "custom",
          message: "At least one resource is required for a mixed transfer.",
          path: ["resources"],
        });
      }
    }
  });

export const updateTransferStateSchema = z.object({
  nextState: transferStateEnum,
  comments: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(512).nullable().optional(),
  ),
});
