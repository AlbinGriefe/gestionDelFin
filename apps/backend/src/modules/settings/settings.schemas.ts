import { z } from "zod";

const settingValueTypeEnum = z.enum([
  "string",
  "integer",
  "decimal",
  "boolean",
  "json",
]);

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

export const settingKeyParamSchema = z.object({
  key: z.string().trim().min(1).max(100),
});

export const updateSettingSchema = z.object({
  value: settingValueSchema,
  valueType: settingValueTypeEnum.optional(),
  description: z.string().trim().max(255).nullable().optional(),
  isPublic: z.boolean().optional(),
});
