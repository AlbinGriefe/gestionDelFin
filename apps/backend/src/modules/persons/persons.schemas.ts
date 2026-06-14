import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function emptyStringToNull(value: unknown) {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  return value;
}

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return value;
}

function parseOptionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const normalized = value.trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

    if (dateOnlyMatch) {
      const [, yearValue, monthValue, dayValue] = dateOnlyMatch;
      const year = Number(yearValue);
      const month = Number(monthValue);
      const day = Number(dayValue);
      const parsed = new Date(Date.UTC(year, month - 1, day));

      const isExactDate =
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day;

      return isExactDate ? parsed : value;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}

const optionalPositiveInteger = z.preprocess(
  parseOptionalInteger,
  z.number().int().positive().optional(),
);

const nullablePositiveInteger = z.preprocess(
  (value) =>
    value === null || value === "" ? null : parseOptionalInteger(value),
  z.number().int().positive().nullable().optional(),
);

const nullableIdentifierString = z.preprocess(
  emptyStringToNull,
  z.string().trim().max(100).nullable().optional(),
);

const nullableShortText = z.preprocess(
  emptyStringToNull,
  z.string().trim().max(255).nullable().optional(),
);

const nullableProfileDescription = z.preprocess(
  emptyStringToNull,
  z.string().trim().min(20).max(2000).nullable().optional(),
);

export const personIdParamSchema = z.object({
  personId: z.coerce.number().int().positive(),
});

export const listPersonsQuerySchema = z.object({
  page: z.preprocess(parseOptionalInteger, z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    parseOptionalInteger,
    z.number().int().min(1).max(100).default(20),
  ),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
  campId: optionalPositiveInteger,
  professionId: optionalPositiveInteger,
  healthId: optionalPositiveInteger,
  accepted: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  admissionStatus: z
    .enum(["pending", "under_review", "observe", "accepted", "rejected"])
    .optional(),
  active: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
});

export const createPersonSchema = z.object({
  id_camp: optionalPositiveInteger,
  id_person_health: nullablePositiveInteger,
  prn_name: z.string().trim().min(1).max(100),
  prn_lastname: z.string().trim().min(1).max(100),
  prn_birth_date: z.preprocess(
    parseOptionalDate,
    z.date().nullable().optional(),
  ),
  prn_document_number: nullableIdentifierString,
  prn_profile_description: nullableProfileDescription,
  prn_is_active: z.boolean().optional().default(true),
  prn_admission_notes: nullableShortText,
});

export const updatePersonSchema = z
  .object({
    id_camp: optionalPositiveInteger,
    id_person_health: nullablePositiveInteger,
    prn_name: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(100).optional(),
    ),
    prn_lastname: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(100).optional(),
    ),
    prn_birth_date: z.preprocess(
      parseOptionalDate,
      z.date().nullable().optional(),
    ),
    prn_document_number: nullableIdentifierString,
    prn_profile_description: nullableProfileDescription,
    prn_is_active: z.boolean().optional(),
    prn_admission_notes: nullableShortText,
  })
  .superRefine((value, context) => {
    if (!Object.values(value).some((entry) => entry !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "At least one field must be provided to update a person.",
      });
    }
  });
