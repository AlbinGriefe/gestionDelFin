import { z } from "zod";

export const explorationZoneIdParamSchema = z.object({
  zoneId: z.coerce.number().int().positive(),
});

export const listExplorationZonesQuerySchema = z.object({
  campId: z.coerce.number().int().positive().optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createExplorationZoneSchema = z.object({
  campId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(255).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  risk: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  isActive: z.boolean().optional().default(true),
});

export const updateExplorationZoneSchema = createExplorationZoneSchema
  .omit({ campId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
