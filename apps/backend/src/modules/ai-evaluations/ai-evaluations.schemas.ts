import { z } from "zod";

// ─── Schema para POST /evaluate ──────────────────────────────────────────────

export const runAiEvaluationBodySchema = z.object({
  personId: z
    .number({ required_error: "El ID de la persona es requerido" })
    .int("El ID de la persona debe ser un número entero")
    .positive("El ID de la persona debe ser positivo"),

  photoBase64: z
    .string({ required_error: "La foto en base64 es requerida" })
    .min(100, "La imagen proporcionada no es válida"),

  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .optional()
    .default("image/jpeg"),

  modelName: z.string().max(100).optional(),
});

// ─── Schema para PATCH /confirm/:id ──────────────────────────────────────────

export const confirmEvaluationBodySchema = z.object({
  userDecision: z.enum(["accept", "decline", "observe"], {
    required_error: "La decisión del usuario es requerida",
    invalid_type_error: "La decisión debe ser: accept, decline u observe",
  }),
  userObservation: z.string().max(255).optional(),
});

export const confirmEvaluationParamsSchema = z.object({
  id: z.coerce
    .number({ required_error: "El ID de la evaluación es requerido" })
    .int()
    .positive(),
});

// ─── Schema para GET /person/:personId ───────────────────────────────────────

export const getByPersonParamsSchema = z.object({
  personId: z.coerce
    .number({ required_error: "El ID de la persona es requerido" })
    .int()
    .positive(),
});

// ─── Tipos derivados ──────────────────────────────────────────────────────────

export type RunAiEvaluationBody = z.infer<typeof runAiEvaluationBodySchema>;
export type ConfirmEvaluationBody = z.infer<typeof confirmEvaluationBodySchema>;
