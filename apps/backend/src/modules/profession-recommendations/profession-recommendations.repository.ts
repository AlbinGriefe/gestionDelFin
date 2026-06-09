import prisma, { Prisma } from "../../lib/prisma.js";
import type { ProfessionAiResult } from "../text-ai/text-ai.types.js";

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

const recommendationInclude = {
  persons: {
    include: {
      person_stats: true,
      camps: true,
    },
  },
  recommended_profession: true,
  selected_profession: true,
  users: {
    select: { id_user: true, usr_username: true },
  },
} satisfies Prisma.profession_recommendationsInclude;

export type ProfessionRecommendationRecord =
  Prisma.profession_recommendationsGetPayload<{
    include: typeof recommendationInclude;
  }>;

export class ProfessionRecommendationsRepository {
  async findPerson(personId: number) {
    return prisma.persons.findUnique({
      where: { id_person: personId },
      include: { person_stats: true, camps: true },
    });
  }

  async listAvailableProfessions(campId: number) {
    return prisma.professions.findMany({
      where: {
        pfs_is_active: true,
        OR: [{ id_camp: null }, { id_camp: campId }],
      },
      orderBy: { pfs_name: "asc" },
    });
  }

  async findLatestPending(personId: number) {
    return prisma.profession_recommendations.findFirst({
      where: { id_person: personId, pfr_is_final: false },
      orderBy: { pfr_created_at: "desc" },
      include: recommendationInclude,
    });
  }

  async create(input: {
    personId: number;
    actorUserId: number;
    recommendedProfessionId: number;
    result: ProfessionAiResult;
    inputSnapshot: unknown;
  }) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.profession_recommendations.create({
        data: {
          id_person: input.personId,
          id_recommended_profession: input.recommendedProfessionId,
          pfr_provider: input.result.provider,
          pfr_model_name: input.result.model,
          pfr_confidence: input.result.confidence,
          pfr_reasons: json(input.result.reasons),
          pfr_alternatives: json(input.result.alternatives),
          pfr_input_snapshot: json(input.inputSnapshot),
          pfr_raw_response:
            input.result.rawResponse === null ||
            input.result.rawResponse === undefined
              ? Prisma.JsonNull
              : json(input.result.rawResponse),
        },
      });
      const person = await tx.persons.findUniqueOrThrow({
        where: { id_person: input.personId },
      });
      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: person.id_camp,
          evt_entity: "profession_recommendations",
          evt_entity_id: record.id_profession_recommendation,
          evt_action: "created",
          evt_new_value: json({
            personId: input.personId,
            recommendedProfessionId: input.recommendedProfessionId,
            provider: input.result.provider,
          }),
          evt_description: "Profession recommendation created.",
        },
      });
      return tx.profession_recommendations.findUniqueOrThrow({
        where: {
          id_profession_recommendation: record.id_profession_recommendation,
        },
        include: recommendationInclude,
      });
    });
  }

  async confirm(input: {
    recommendationId: number;
    selectedProfessionId?: number;
    actorUserId: number;
    userObservation?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.profession_recommendations.findUnique({
        where: { id_profession_recommendation: input.recommendationId },
        include: recommendationInclude,
      });
      if (!record) return null;
      if (record.pfr_is_final) return record;
      if (
        !record.persons.prn_is_active ||
        record.persons.prn_admission_status !== "accepted"
      ) {
        throw new Error("PERSON_NO_LONGER_ELIGIBLE");
      }

      const selectedProfessionId =
        input.selectedProfessionId ?? record.id_recommended_profession;
      const profession = await tx.professions.findUnique({
        where: { id_profession: selectedProfessionId },
      });
      if (
        !profession ||
        !profession.pfs_is_active ||
        (profession.id_camp !== null &&
          profession.id_camp !== record.persons.id_camp)
      ) {
        throw new Error("INVALID_SELECTED_PROFESSION");
      }

      await tx.profession_recommendations.update({
        where: { id_profession_recommendation: input.recommendationId },
        data: {
          id_selected_profession: selectedProfessionId,
          id_user_reviewer: input.actorUserId,
          pfr_user_observation: input.userObservation?.trim() || null,
          pfr_is_final: true,
        },
      });
      await tx.persons.update({
        where: { id_person: record.id_person },
        data: { id_profession: selectedProfessionId },
      });
      await tx.person_records.create({
        data: {
          id_person: record.id_person,
          id_user: input.actorUserId,
          prr_event_type: "profession_changed",
          prr_old_value: json({ id_profession: record.persons.id_profession }),
          prr_new_value: json({
            id_profession: selectedProfessionId,
            recommendationId: input.recommendationId,
          }),
          prr_notes: input.userObservation?.trim() || null,
        },
      });
      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: record.persons.id_camp,
          evt_entity: "profession_recommendations",
          evt_entity_id: input.recommendationId,
          evt_action: "confirmed",
          evt_new_value: json({
            personId: record.id_person,
            selectedProfessionId,
          }),
          evt_description: "Profession recommendation confirmed.",
        },
      });
      return tx.profession_recommendations.findUniqueOrThrow({
        where: { id_profession_recommendation: input.recommendationId },
        include: recommendationInclude,
      });
    });
  }
}

export const professionRecommendationsRepository =
  new ProfessionRecommendationsRepository();
