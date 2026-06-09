import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { PersonStatsSummary } from "../persons/persons.types.js";
import { textAiProvider } from "../text-ai/resilient-text-provider.js";
import {
  admissionEvaluationsRepository,
  type AdmissionEvaluationRecord,
} from "./admission-evaluations.repository.js";

function ensureAdmin(actor: AuthenticatedUser) {
  if (actor.roleName.trim().toLowerCase() !== "administrador sistema") {
    throw new AppError(
      403,
      "Only system administrators can evaluate admissions.",
      "ADMISSION_ADMIN_REQUIRED",
    );
  }
}

function mapStats(stats: NonNullable<AdmissionEvaluationRecord["persons"]["person_stats"]>) {
  return {
    health: stats.pst_health,
    maxHealth: stats.pst_max_health,
    strength: stats.pst_strength,
    satiety: stats.pst_satiety,
    hydration: stats.pst_hydration,
    luck: stats.pst_luck,
    level: stats.pst_level,
  } satisfies PersonStatsSummary;
}

function mapEvaluation(record: AdmissionEvaluationRecord) {
  return {
    id: record.id_admission_evaluation,
    personId: record.id_person,
    provider: record.ade_provider,
    modelName: record.ade_model_name,
    confidence: Number(record.ade_confidence),
    decision: record.ade_decision,
    reasons: record.ade_reasons,
    inputSnapshot: record.ade_input_snapshot,
    userDecision: record.ade_user_decision,
    userObservation: record.ade_user_observation,
    reviewer: record.users
      ? { id: record.users.id_user, username: record.users.usr_username }
      : null,
    isFinal: record.ade_is_final,
    createdAt: record.ade_created_at.toISOString(),
    person: {
      id: record.persons.id_person,
      fullName:
        `${record.persons.prn_name} ${record.persons.prn_lastname}`.trim(),
      admissionStatus: record.persons.prn_admission_status,
    },
  };
}

export class AdmissionEvaluationsService {
  async getHealth() {
    return textAiProvider.getHealth();
  }

  async evaluate(
    input: { personId: number; modelName?: string; forceRefresh?: boolean },
    actor: AuthenticatedUser,
  ) {
    ensureAdmin(actor);
    const person = await admissionEvaluationsRepository.findPerson(input.personId);
    if (!person) {
      throw new AppError(404, "Person not found.", "ADMISSION_PERSON_NOT_FOUND");
    }
    if (!person.prn_is_active) {
      throw new AppError(
        400,
        "Inactive people cannot be evaluated.",
        "ADMISSION_PERSON_INACTIVE",
      );
    }
    if (person.prn_admission_status === "accepted") {
      throw new AppError(
        409,
        "Person is already accepted.",
        "ADMISSION_ALREADY_ACCEPTED",
      );
    }
    if (!person.person_stats) {
      throw new AppError(
        409,
        "Person does not have initial stats.",
        "ADMISSION_STATS_MISSING",
      );
    }

    const pending = await admissionEvaluationsRepository.findLatestPending(
      input.personId,
    );
    if (pending && !input.forceRefresh) {
      return { evaluation: mapEvaluation(pending), reusedExisting: true };
    }

    const rules =
      (person.camps.camp_operational_rules?.cor_admission_rules as Record<
        string,
        unknown
      > | null) ?? {
        minimumHealth: 1,
        requireProfileDescription: true,
        requireAvailableCapacity: true,
      };
    const stats = mapStats(person.person_stats);
    const providerInput = {
      personId: person.id_person,
      description: person.prn_profile_description,
      stats,
      camp: {
        id: person.camps.id_camp,
        name: person.camps.cmp_name,
        activePersons: person.activeAcceptedPersons,
        maxCapacity: person.camps.cmp_max_capacity,
      },
      rules,
      modelName: input.modelName,
    };
    const result = await textAiProvider.evaluateAdmission(providerInput);
    const created = await admissionEvaluationsRepository.create({
      personId: person.id_person,
      actorUserId: actor.id,
      result,
      inputSnapshot: providerInput,
    });
    return { evaluation: mapEvaluation(created), reusedExisting: false };
  }

  async confirm(
    evaluationId: number,
    input: {
      userDecision: "accept" | "observe" | "reject";
      userObservation?: string | null;
    },
    actor: AuthenticatedUser,
  ) {
    ensureAdmin(actor);
    try {
      const confirmed = await admissionEvaluationsRepository.confirm({
        evaluationId,
        actorUserId: actor.id,
        ...input,
      });
      if (!confirmed) {
        throw new AppError(
          404,
          "Admission evaluation not found.",
          "ADMISSION_EVALUATION_NOT_FOUND",
        );
      }
      if (confirmed.ade_is_final && confirmed.id_user_reviewer !== actor.id) {
        throw new AppError(
          409,
          "Admission evaluation was already finalized.",
          "ADMISSION_EVALUATION_FINAL",
        );
      }
      return mapEvaluation(confirmed);
    } catch (error) {
      if (error instanceof Error && error.message === "CAMP_CAPACITY_EXCEEDED") {
        throw new AppError(
          409,
          "Camp capacity would be exceeded.",
          "ADMISSION_CAMP_CAPACITY_EXCEEDED",
        );
      }
      throw error;
    }
  }
}

export const admissionEvaluationsService = new AdmissionEvaluationsService();
