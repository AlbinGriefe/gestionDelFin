import { z } from "zod";

export const runDailyProcessBodySchema = z.object({
  campId: z.number().int().positive().optional(),
  force: z.boolean().optional().default(false),
});

export const dailyProcessStatusParamsSchema = z.object({
  campId: z
    .string()
    .regex(/^\d+$/, "campId must be a positive integer")
    .transform(Number),
});

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const dailyAssignmentsQuerySchema = z.object({
  campId: z.coerce.number().int().positive(),
  date: dateOnly,
});

export const updateDailyAssignmentsSchema = z.object({
  campId: z.number().int().positive(),
  date: dateOnly,
  assignments: z
    .array(
      z.object({
        personId: z.number().int().positive(),
        task: z.enum(["food_production", "water_production", "camp_support"]),
      }),
    )
    .max(500),
});
