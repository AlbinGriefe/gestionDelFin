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

const optionalPositiveInteger = z.preprocess(
  parseOptionalInteger,
  z.number().int().positive().optional(),
);

const nullablePositiveInteger = z.preprocess((value) => {
  if (value === null || value === "" || value === "null") {
    return null;
  }

  return parseOptionalInteger(value);
}, z.number().int().positive().nullable().optional());

export const professionIdParamSchema = z.object({
  professionId: z.coerce.number().int().positive(),
});

export const listProfessionsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  campId: optionalPositiveInteger,
  active: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  collectsResources: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
});

export const createProfessionSchema = z.object({
  pfs_name: z.string().trim().min(1).max(100),
  pfs_description: z.string().trim().min(1).max(255),
  pfs_collects_resources: z.boolean().optional().default(false),
  pfs_food_generated_per_day: z.number().min(0).optional().default(0),
  pfs_water_generated_per_day: z.number().min(0).optional().default(0),
  pfs_can_expedition: z.boolean().optional().default(false),
  pfs_can_transfer: z.boolean().optional().default(false),
  pfs_production_penalty: z.number().min(0).optional().default(0),
  pfs_valuable_bonus_pp: z.number().min(0).max(100).optional().default(0),
  pfs_transfer_bonus_pp: z.number().min(0).max(100).optional().default(0),
  pfs_extra_food_chance_pp: z.number().min(0).max(100).optional().default(0),
  pfs_extra_food_min: z.number().int().min(0).optional().default(0),
  pfs_extra_food_max: z.number().int().min(0).optional().default(0),
  pfs_healing_food_cost: z.number().min(0).optional().default(0),
  pfs_healing_amount: z.number().int().min(0).optional().default(0),
  id_camp: nullablePositiveInteger,
  pfs_is_active: z.boolean().optional().default(true),
});

export const coverageQuerySchema = z.object({
  campId: z.preprocess(parseOptionalInteger, z.number().int().positive()),
});

export const temporaryReassignmentSchema = z.object({
  targetProfessionId: z.number().int().positive(),
  personIds: z.array(z.number().int().positive()).min(1).max(50),
  notes: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255).optional(),
  ),
});

export const revertReassignmentSchema = z.object({
  personIds: z.array(z.number().int().positive()).min(1).max(50),
  notes: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(255).optional(),
  ),
});

export const updateProfessionSchema = z
  .object({
    pfs_name: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(100).optional(),
    ),
    pfs_description: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(255).optional(),
    ),
    pfs_collects_resources: z.boolean().optional(),
    pfs_food_generated_per_day: z.number().min(0).optional(),
    pfs_water_generated_per_day: z.number().min(0).optional(),
    pfs_can_expedition: z.boolean().optional(),
    pfs_can_transfer: z.boolean().optional(),
    pfs_production_penalty: z.number().min(0).optional(),
    pfs_valuable_bonus_pp: z.number().min(0).max(100).optional(),
    pfs_transfer_bonus_pp: z.number().min(0).max(100).optional(),
    pfs_extra_food_chance_pp: z.number().min(0).max(100).optional(),
    pfs_extra_food_min: z.number().int().min(0).optional(),
    pfs_extra_food_max: z.number().int().min(0).optional(),
    pfs_healing_food_cost: z.number().min(0).optional(),
    pfs_healing_amount: z.number().int().min(0).optional(),
    id_camp: nullablePositiveInteger,
    pfs_is_active: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    const hasAnyDefinedValue = Object.values(value).some(
      (entry) => entry !== undefined,
    );

    if (!hasAnyDefinedValue) {
      context.addIssue({
        code: "custom",
        message: "At least one field must be provided to update a profession.",
      });
    }
  });
