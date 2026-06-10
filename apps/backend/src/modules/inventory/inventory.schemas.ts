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

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLocaleLowerCase();

    if (["true", "1", "yes", "si"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return value;
}

export const storageIdParamSchema = z.object({
  storageId: z.coerce.number().int().positive(),
});

export const listInventoryQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  resourceTypeId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
  belowMinimum: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  priorityOnly: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  rationableOnly: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
});

export const createInventoryAdjustmentSchema = z
  .object({
    id_camp: z.preprocess(
      parseOptionalInteger,
      z.number().int().positive().optional(),
    ),
    id_resource: z.coerce.number().int().positive(),
    mode: z.enum(["set", "delta"]),
    quantity: z.preprocess(parseOptionalDecimal, z.number()),
    reason: z.string().trim().min(3).max(255),
  })
  .superRefine((value, context) => {
    if (value.mode === "set" && value.quantity < 0) {
      context.addIssue({
        code: "custom",
        message: "Quantity cannot be negative when mode is set.",
        path: ["quantity"],
      });
    }

    if (value.mode === "delta" && value.quantity === 0) {
      context.addIssue({
        code: "custom",
        message: "Quantity delta cannot be zero.",
        path: ["quantity"],
      });
    }
  });

export const updateInventoryThresholdsSchema = z
  .object({
    stg_min_quantity: z.preprocess(
      parseOptionalDecimal,
      z.number().min(0).optional(),
    ),
    stg_max_quantity: z.preprocess((value) => {
      if (value === null || value === "" || value === "null") {
        return null;
      }

      return parseOptionalDecimal(value);
    }, z.number().min(0).nullable().optional()),
  })
  .superRefine((value, context) => {
    const hasAnyDefinedValue = Object.values(value).some(
      (entry) => entry !== undefined,
    );

    if (!hasAnyDefinedValue) {
      context.addIssue({
        code: "custom",
        message: "At least one threshold must be provided.",
      });
    }

    const minQuantity = value.stg_min_quantity;
    const maxQuantity = value.stg_max_quantity;

    if (
      minQuantity !== undefined &&
      maxQuantity !== undefined &&
      maxQuantity !== null &&
      maxQuantity < minQuantity
    ) {
      context.addIssue({
        code: "custom",
        message: "Maximum quantity cannot be lower than minimum quantity.",
        path: ["stg_max_quantity"],
      });
    }
  });
