import type { PersonStatsSummary } from "../persons/persons.types.js";

export type AdmissionDecision = "accept" | "observe" | "reject";

export interface AdmissionAiInput {
  personId: number;
  description: string;
  stats: PersonStatsSummary;
  camp: {
    id: number;
    name: string;
    activePersons: number;
    maxCapacity: number;
  };
  rules: Record<string, unknown>;
  modelName?: string;
}

export interface AdmissionAiResult {
  provider: string;
  model: string | null;
  decision: AdmissionDecision;
  confidence: number;
  reasons: string[];
  rawResponse: unknown;
}

export interface ProfessionCandidate {
  id: number;
  name: string;
  description: string;
}

export interface ProfessionAiInput {
  personId: number;
  description: string;
  stats: PersonStatsSummary;
  professions: ProfessionCandidate[];
  modelName?: string;
}

export interface ProfessionAiResult {
  provider: string;
  model: string | null;
  professionName: string;
  confidence: number;
  reasons: string[];
  alternatives: Array<{ professionName: string; reason: string }>;
  rawResponse: unknown;
}

export interface TextAiProvider {
  evaluateAdmission(input: AdmissionAiInput): Promise<AdmissionAiResult>;
  recommendProfession(input: ProfessionAiInput): Promise<ProfessionAiResult>;
  getHealth(): Promise<{
    provider: string;
    ready: boolean;
    model: string | null;
    reason: string | null;
  }>;
}
