// ─── Enums que coinciden con el schema.prisma ────────────────────────────────

export type AieDecision = "accept" | "decline" | "observe";
export type AieUserDecision = "accept" | "decline" | "observe";

// ─── Lo que devuelve Gemini ───────────────────────────────────────────────────

export interface GeminiZombieAnalysis {
  isZombie: boolean;
  confidence: number; // 0.0 – 1.0
  reasons: string[];
  skinCondition: "normal" | "pale" | "decayed" | "unknown";
  eyeCondition: "normal" | "glassy" | "absent" | "unknown";
  visibleWounds: boolean;
  overallAssessment: string;
}

// ─── Entrada al endpoint POST /evaluate ──────────────────────────────────────

export interface RunAiEvaluationInput {
  personId: number;
  photoBase64: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  reviewerUserId?: number;
  modelName?: string;
}

// ─── Entrada al endpoint PATCH /confirm/:id ──────────────────────────────────

export interface ConfirmEvaluationInput {
  evaluationId: number;
  userDecision: AieUserDecision;
  userObservation?: string;
  reviewerUserId: number;
}

// ─── Resultado de una evaluación (lo que se devuelve al cliente) ──────────────

export interface AiEvaluationResult {
  id: number;
  personId: number;
  reviewerUserId: number | null;
  date: Date;
  evaluationCriteria: GeminiZombieAnalysis;
  score: number | null;
  decision: AieDecision;
  userDecision: AieUserDecision | null;
  userObservation: string | null;
  modelName: string | null;
  isFinal: boolean;
}

// ─── Respuesta del endpoint POST /evaluate ───────────────────────────────────

export interface RunEvaluationResult {
  evaluation: AiEvaluationResult;
  verdict: "HUMAN" | "ZOMBIE" | "INCONCLUSIVE";
  message: string;
}
