import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { PersonStatsSummary } from "../persons/persons.types.js";
import { textAiProvider } from "../text-ai/resilient-text-provider.js";
import {
  professionRecommendationsRepository,
  type ProfessionRecommendationRecord,
} from "./profession-recommendations.repository.js";

function ensureAdmin(actor: AuthenticatedUser) {
  if (actor.roleName.trim().toLowerCase() !== "administrador sistema") {
    throw new AppError(
      403,
      "Only system administrators can manage profession recommendations.",
      "PROFESSION_RECOMMENDATION_ADMIN_REQUIRED",
    );
  }
}

function mapStats(
  stats: NonNullable<ProfessionRecommendationRecord["persons"]["person_stats"]>,
) {
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

function mapRecord(record: ProfessionRecommendationRecord) {
  return {
    id: record.id_profession_recommendation,
    personId: record.id_person,
    provider: record.pfr_provider,
    modelName: record.pfr_model_name,
    confidence: Number(record.pfr_confidence),
    reasons: record.pfr_reasons,
    alternatives: record.pfr_alternatives,
    recommendedProfession: {
      id: record.recommended_profession.id_profession,
      name: record.recommended_profession.pfs_name,
    },
    selectedProfession: record.selected_profession
      ? {
          id: record.selected_profession.id_profession,
          name: record.selected_profession.pfs_name,
        }
      : null,
    reviewer: record.users
      ? { id: record.users.id_user, username: record.users.usr_username }
      : null,
    userObservation: record.pfr_user_observation,
    isFinal: record.pfr_is_final,
    createdAt: record.pfr_created_at.toISOString(),
  };
}

export class ProfessionRecommendationsService {
  async recommend(
    input: { personId: number; modelName?: string; forceRefresh?: boolean },
    actor: AuthenticatedUser,
  ) {
    ensureAdmin(actor);
    const person = await professionRecommendationsRepository.findPerson(
      input.personId,
    );
    if (!person) {
      throw new AppError(
        404,
        "Person not found.",
        "PROFESSION_RECOMMENDATION_PERSON_NOT_FOUND",
      );
    }
    if (
      !person.prn_is_active ||
      person.prn_admission_status !== "accepted"
    ) {
      throw new AppError(
        409,
        "Only active, accepted people can receive a profession recommendation.",
        "PROFESSION_RECOMMENDATION_PERSON_INELIGIBLE",
      );
    }
    if (!person.person_stats) {
      throw new AppError(
        409,
        "Person stats are missing.",
        "PROFESSION_RECOMMENDATION_STATS_MISSING",
      );
    }

    const pending =
      await professionRecommendationsRepository.findLatestPending(input.personId);
    if (pending && !input.forceRefresh) {
      return { recommendation: mapRecord(pending), reusedExisting: true };
    }

    const professions =
      await professionRecommendationsRepository.listAvailableProfessions(
        person.id_camp,
      );
    if (professions.length === 0) {
      throw new AppError(
        409,
        "No active professions are available.",
        "PROFESSION_RECOMMENDATION_NO_CANDIDATES",
      );
    }
    const providerInput = {
      personId: person.id_person,
      description: person.prn_profile_description,
      stats: mapStats(person.person_stats),
      professions: professions.map((profession) => ({
        id: profession.id_profession,
        name: profession.pfs_name,
        description: profession.pfs_description,
      })),
      modelName: input.modelName,
    };
    const result = await textAiProvider.recommendProfession(providerInput);
    const recommended = professions.find(
      (profession) =>
        profession.pfs_name.toLowerCase() ===
        result.professionName.toLowerCase(),
    );
    if (!recommended) {
      throw new AppError(
        502,
        "AI provider returned an unknown profession.",
        "PROFESSION_RECOMMENDATION_INVALID_PROVIDER_RESULT",
      );
    }
    const created = await professionRecommendationsRepository.create({
      personId: person.id_person,
      actorUserId: actor.id,
      recommendedProfessionId: recommended.id_profession,
      result,
      inputSnapshot: providerInput,
    });
    return { recommendation: mapRecord(created), reusedExisting: false };
  }

  async confirm(
    recommendationId: number,
    input: { selectedProfessionId?: number; userObservation?: string | null },
    actor: AuthenticatedUser,
  ) {
    ensureAdmin(actor);
    try {
      const confirmed = await professionRecommendationsRepository.confirm({
        recommendationId,
        actorUserId: actor.id,
        ...input,
      });
      if (!confirmed) {
        throw new AppError(
          404,
          "Profession recommendation not found.",
          "PROFESSION_RECOMMENDATION_NOT_FOUND",
        );
      }
      return mapRecord(confirmed);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INVALID_SELECTED_PROFESSION"
      ) {
        throw new AppError(
          400,
          "Selected profession is inactive or belongs to another camp.",
          "PROFESSION_RECOMMENDATION_INVALID_SELECTION",
        );
      }
      if (
        error instanceof Error &&
        error.message === "PERSON_NO_LONGER_ELIGIBLE"
      ) {
        throw new AppError(
          409,
          "The person must remain active and accepted to confirm a profession.",
          "PROFESSION_RECOMMENDATION_PERSON_INELIGIBLE",
        );
      }
      throw error;
    }
  }
}

export const professionRecommendationsService =
  new ProfessionRecommendationsService();
