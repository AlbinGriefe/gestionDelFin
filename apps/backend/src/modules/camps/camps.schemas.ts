import { z } from "zod";

import type { camps_cmp_status } from "../../generated/prisma/client.js";

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
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
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

const statusEnum = z.enum([
  "active",
  "destroyed",
  "abandoned",
  "inactive",
]) satisfies z.ZodType<camps_cmp_status>;

export const campIdParamSchema = z.object({
  campId: z.coerce.number().int().positive(),
});

export const listCampsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
  status: z.preprocess(emptyStringToUndefined, statusEnum.optional()),
});

const campBaseSchema = {
  cmp_name: z.string().trim().min(2).max(150),
  cmp_location: z.string().trim().min(2).max(255),
  cmp_latitude: z.preprocess(
    parseOptionalDecimal,
    z.number().min(-90).max(90).nullable().optional(),
  ),
  cmp_longitude: z.preprocess(
    parseOptionalDecimal,
    z.number().min(-180).max(180).nullable().optional(),
  ),
  cmp_max_capacity: z.coerce.number().int().min(0).max(100000),
  cmp_status: statusEnum.optional().default("active"),
};

export const createCampSchema = z.object(campBaseSchema);

export const updateCampSchema = z
  .object({
    cmp_name: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(2).max(150).optional(),
    ),
    cmp_location: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(2).max(255).optional(),
    ),
    cmp_latitude: z.preprocess(
      parseOptionalDecimal,
      z.number().min(-90).max(90).nullable().optional(),
    ),
    cmp_longitude: z.preprocess(
      parseOptionalDecimal,
      z.number().min(-180).max(180).nullable().optional(),
    ),
    cmp_max_capacity: z.preprocess(
      parseOptionalInteger,
      z.number().int().min(0).max(100000).optional(),
    ),
    cmp_status: z.preprocess(emptyStringToUndefined, statusEnum.optional()),
  })
  .superRefine((value, context) => {
    const hasAnyDefinedValue = Object.values(value).some(
      (entry) => entry !== undefined,
    );

    if (!hasAnyDefinedValue) {
      context.addIssue({
        code: "custom",
        message: "At least one field must be provided to update a camp.",
      });
    }
  });

export const updateCampOperationalRulesSchema = z.object({
  admissionRules: z.record(z.string(), z.unknown()).optional().default({
    minimumHealth: 1,
    requireProfileDescription: true,
    requireAvailableCapacity: true,
  }),
  expeditionSuccessProbability: z.number().min(0).max(100).optional(),
  transferSuccessProbability: z.number().min(0).max(100).optional(),
  diseaseProbability: z.number().min(0).max(100).optional(),
  valuableResourceProbability: z.number().min(0).max(100).optional(),
  diseaseHealthThreshold: z.number().min(0).max(100).optional(),
});
