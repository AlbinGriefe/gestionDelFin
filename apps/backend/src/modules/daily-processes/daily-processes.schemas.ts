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