import { z } from "zod";

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

export const runDailyProcessSchema = z.object({
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
});

export const productionCorrectionSchema = z.object({
  campId: z.preprocess(
    parseOptionalInteger,
    z.number().int().positive().optional(),
  ),
  personId: z.number().int().positive(),
  resourceId: z.number().int().positive(),
  quantityDelta: z
    .number()
    .refine((val) => val !== 0, {
      message: "quantityDelta must be non-zero.",
    }),
  reason: z.string().trim().min(1).max(255),
});
