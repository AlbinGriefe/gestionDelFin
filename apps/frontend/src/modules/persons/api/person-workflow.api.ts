import { httpClient } from "../../../shared/api/httpClient";

export type AdmissionEvaluation = {
  id: number;
  provider: string;
  modelName: string | null;
  confidence: number;
  decision: "accept" | "observe" | "reject";
  reasons: unknown;
  userDecision: "accept" | "observe" | "reject" | null;
  isFinal: boolean;
};

export type ProfessionRecommendation = {
  id: number;
  provider: string;
  confidence: number;
  reasons: unknown;
  alternatives: unknown;
  recommendedProfession: { id: number; name: string };
  selectedProfession: { id: number; name: string } | null;
  isFinal: boolean;
};

async function evaluateAdmission(personId: number) {
  return httpClient<{
    evaluation: AdmissionEvaluation;
    reusedExisting: boolean;
  }>("/admission-evaluations", {
    method: "POST",
    body: JSON.stringify({ personId }),
  });
}

async function confirmAdmission(
  evaluationId: number,
  userDecision: "accept" | "observe" | "reject",
  userObservation?: string,
) {
  return httpClient<AdmissionEvaluation>(
    `/admission-evaluations/${evaluationId}/confirm`,
    {
      method: "PATCH",
      body: JSON.stringify({ userDecision, userObservation }),
    },
  );
}

async function recommendProfession(personId: number) {
  return httpClient<{
    recommendation: ProfessionRecommendation;
    reusedExisting: boolean;
  }>("/profession-recommendations", {
    method: "POST",
    body: JSON.stringify({ personId }),
  });
}

async function confirmProfession(
  recommendationId: number,
  selectedProfessionId?: number,
  userObservation?: string,
) {
  return httpClient<ProfessionRecommendation>(
    `/profession-recommendations/${recommendationId}/confirm`,
    {
      method: "PATCH",
      body: JSON.stringify({ selectedProfessionId, userObservation }),
    },
  );
}

async function heal(
  doctorPersonId: number,
  patientPersonId: number,
  notes?: string,
) {
  return httpClient<{
    doctor: { fullName: string };
    patient: { fullName: string };
    healthBefore: number;
    healthAfter: number;
    foodCost: number;
    removedSick: boolean;
  }>("/care-actions/heal", {
    method: "POST",
    body: JSON.stringify({ doctorPersonId, patientPersonId, notes }),
  });
}

export const personWorkflowApi = {
  evaluateAdmission,
  confirmAdmission,
  recommendProfession,
  confirmProfession,
  heal,
};
