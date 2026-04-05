import { prisma } from "../../lib/prisma.js";
import type {
  AiEvaluationResult,
  GeminiZombieAnalysis,
  AieDecision,
  AieUserDecision,
} from "./ai-evaluations.types.js";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface SaveEvaluationData {
  personId: number;
  reviewerUserId?: number;
  geminiAnalysis: GeminiZombieAnalysis;
  decision: AieDecision;
  score: number;
  modelName?: string;
}

interface ConfirmEvaluationData {
  evaluationId: number;
  reviewerUserId: number;
  userDecision: AieUserDecision;
  userObservation?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findPersonById(personId: number) {
  return prisma.persons.findUnique({
    where: { id_person: personId },
    select: {
      id_person: true,
      prn_name: true,
      prn_lastname: true,
      prn_is_active: true,
      id_camp: true,
    },
  });
}

export async function findEvaluationById(evaluationId: number) {
  return prisma.ai_evaluations.findUnique({
    where: { id_ai_evaluation: evaluationId },
  });
}

export async function findEvaluationsByPerson(
  personId: number
): Promise<AiEvaluationResult[]> {
  const records = await prisma.ai_evaluations.findMany({
    where: { id_person: personId },
    orderBy: { aie_date: "desc" },
  });

  return records.map(mapToResult);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function saveEvaluation(
  data: SaveEvaluationData
): Promise<AiEvaluationResult> {
  const record = await prisma.ai_evaluations.create({
    data: {
      id_person: data.personId,
      id_user_reviewer: data.reviewerUserId ?? null,
      aie_evaluation_criteria: data.geminiAnalysis as object,
      aie_score: data.score,
      aie_decision: data.decision,
      aie_model_name: data.modelName ?? "gemini-2.0-flash",
      aie_is_final: false,
    },
  });

  return mapToResult(record);
}

export async function confirmEvaluation(
  data: ConfirmEvaluationData
): Promise<AiEvaluationResult> {
  const record = await prisma.ai_evaluations.update({
    where: { id_ai_evaluation: data.evaluationId },
    data: {
      id_user_reviewer: data.reviewerUserId,
      aie_user_decision: data.userDecision,
      aie_user_observation: data.userObservation ?? null,
      aie_is_final: true,
    },
  });

  return mapToResult(record);
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapToResult(record: any): AiEvaluationResult {
  return {
    id: record.id_ai_evaluation,
    personId: record.id_person,
    reviewerUserId: record.id_user_reviewer,
    date: record.aie_date,
    evaluationCriteria: record.aie_evaluation_criteria as GeminiZombieAnalysis,
    score: record.aie_score ? Number(record.aie_score) : null,
    decision: record.aie_decision as AieDecision,
    userDecision: record.aie_user_decision as AieUserDecision | null,
    userObservation: record.aie_user_observation,
    modelName: record.aie_model_name,
    isFinal: record.aie_is_final,
  };
}
