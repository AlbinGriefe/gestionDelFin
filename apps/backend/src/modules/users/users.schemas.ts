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

const campIdsSchema = z
  .array(z.coerce.number().int().positive())
  .max(100)
  .optional();

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(70)
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username can only contain letters, numbers, dots, underscores and hyphens.",
  );

const emailSchema = z.preprocess(
  emptyStringToNull,
  z.string().trim().email().max(150).nullable().optional(),
);

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const listUsersQuerySchema = z.object({
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
  roleId: optionalPositiveInteger,
  personId: optionalPositiveInteger,
  active: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
});

export const createUserSchema = z.object({
  id_person: nullablePositiveInteger,
  id_role: z.coerce.number().int().positive(),
  id_camp: optionalPositiveInteger,
  campIds: campIdsSchema,
  usr_username: usernameSchema,
  usr_email: emailSchema,
  usr_password: passwordSchema,
  usr_is_active: z.boolean().optional().default(true),
});

export const updateUserSchema = z
  .object({
    id_person: nullablePositiveInteger,
    id_role: optionalPositiveInteger,
    id_camp: optionalPositiveInteger,
    campIds: campIdsSchema,
    usr_username: z.preprocess(
      emptyStringToUndefined,
      usernameSchema.optional(),
    ),
    usr_email: emailSchema,
    usr_password: z.preprocess(
      emptyStringToUndefined,
      passwordSchema.optional(),
    ),
    usr_is_active: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    const hasAnyDefinedValue = Object.values(value).some(
      (entry) => entry !== undefined,
    );

    if (!hasAnyDefinedValue) {
      context.addIssue({
        code: "custom",
        message: "At least one field must be provided to update a user.",
      });
    }
  });
