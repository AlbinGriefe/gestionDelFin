import { z } from "zod";

export const professionRecommendationIdParamSchema = z.object({
  recommendationId: z.coerce.number().int().positive(),
});

export const createProfessionRecommendationSchema = z.object({
  personId: z.number().int().positive(),
  modelName: z.string().trim().min(1).max(100).optional(),
  forceRefresh: z.boolean().optional().default(false),
});

export const confirmProfessionRecommendationSchema = z.object({
  selectedProfessionId: z.number().int().positive().optional(),
  userObservation: z.string().trim().max(255).nullable().optional(),
});
