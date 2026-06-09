import { z } from "zod";

export const admissionEvaluationIdParamSchema = z.object({
  evaluationId: z.coerce.number().int().positive(),
});

export const createAdmissionEvaluationSchema = z.object({
  personId: z.number().int().positive(),
  modelName: z.string().trim().min(1).max(100).optional(),
  forceRefresh: z.boolean().optional().default(false),
});

export const confirmAdmissionEvaluationSchema = z.object({
  userDecision: z.enum(["accept", "observe", "reject"]),
  userObservation: z.string().trim().max(255).nullable().optional(),
});
