import prisma, { Prisma } from "../../lib/prisma.js";
import type { AdmissionAiResult } from "../text-ai/text-ai.types.js";

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

const evaluationInclude = {
  persons: {
    include: {
      camps: {
        include: { camp_operational_rules: true },
      },
      person_stats: true,
    },
  },
  users: {
    select: { id_user: true, usr_username: true },
  },
} satisfies Prisma.admission_evaluationsInclude;

export type AdmissionEvaluationRecord =
  Prisma.admission_evaluationsGetPayload<{
    include: typeof evaluationInclude;
  }>;

export class AdmissionEvaluationsRepository {
  async findPerson(personId: number) {
    const person = await prisma.persons.findUnique({
      where: { id_person: personId },
      include: {
        camps: { include: { camp_operational_rules: true } },
        person_stats: true,
      },
    });
    if (!person) return null;
    const activeAcceptedPersons = await prisma.persons.count({
      where: {
        id_camp: person.id_camp,
        prn_is_active: true,
        prn_admission_status: "accepted",
      },
    });
    return { ...person, activeAcceptedPersons };
  }

  async findLatestPending(personId: number) {
    return prisma.admission_evaluations.findFirst({
      where: { id_person: personId, ade_is_final: false },
      orderBy: { ade_created_at: "desc" },
      include: evaluationInclude,
    });
  }

  async findById(evaluationId: number) {
    return prisma.admission_evaluations.findUnique({
      where: { id_admission_evaluation: evaluationId },
      include: evaluationInclude,
    });
  }

  async create(input: {
    personId: number;
    actorUserId: number;
    result: AdmissionAiResult;
    inputSnapshot: unknown;
  }) {
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.admission_evaluations.create({
        data: {
          id_person: input.personId,
          ade_provider: input.result.provider,
          ade_model_name: input.result.model,
          ade_confidence: input.result.confidence,
          ade_decision: input.result.decision,
          ade_reasons: json(input.result.reasons),
          ade_input_snapshot: json(input.inputSnapshot),
          ade_raw_response:
            input.result.rawResponse === null ||
            input.result.rawResponse === undefined
              ? Prisma.JsonNull
              : json(input.result.rawResponse),
        },
      });
      const person = await tx.persons.update({
        where: { id_person: input.personId },
        data: { prn_admission_status: "under_review" },
      });
      await tx.person_records.create({
        data: {
          id_person: input.personId,
          id_user: input.actorUserId,
          prr_event_type: "admission_evaluated",
          prr_new_value: json({
            evaluationId: evaluation.id_admission_evaluation,
            decision: input.result.decision,
            confidence: input.result.confidence,
            provider: input.result.provider,
          }),
          prr_notes: "Text admission evaluation created.",
        },
      });
      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: person.id_camp,
          evt_entity: "admission_evaluations",
          evt_entity_id: evaluation.id_admission_evaluation,
          evt_action: "created",
          evt_new_value: json({
            personId: input.personId,
            decision: input.result.decision,
            provider: input.result.provider,
          }),
          evt_description: "Text admission evaluation created.",
        },
      });
      return tx.admission_evaluations.findUniqueOrThrow({
        where: { id_admission_evaluation: evaluation.id_admission_evaluation },
        include: evaluationInclude,
      });
    });
  }

  async confirm(input: {
    evaluationId: number;
    actorUserId: number;
    userDecision: "accept" | "observe" | "reject";
    userObservation?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const evaluation = await tx.admission_evaluations.findUnique({
        where: { id_admission_evaluation: input.evaluationId },
        include: evaluationInclude,
      });
      if (!evaluation) return null;
      if (evaluation.ade_is_final) return evaluation;

      const status =
        input.userDecision === "accept"
          ? "accepted"
          : input.userDecision === "observe"
            ? "observe"
            : "rejected";

      if (status === "accepted") {
        const acceptedCount = await tx.persons.count({
          where: {
            id_camp: evaluation.persons.id_camp,
            prn_is_active: true,
            prn_admission_status: "accepted",
          },
        });
        const capacity = evaluation.persons.camps.cmp_max_capacity;
        if (capacity > 0 && acceptedCount >= capacity) {
          throw new Error("CAMP_CAPACITY_EXCEEDED");
        }
      }

      await tx.admission_evaluations.update({
        where: { id_admission_evaluation: input.evaluationId },
        data: {
          id_user_reviewer: input.actorUserId,
          ade_user_decision: input.userDecision,
          ade_user_observation: input.userObservation?.trim() || null,
          ade_is_final: true,
        },
      });
      await tx.persons.update({
        where: { id_person: evaluation.id_person },
        data: {
          prn_admission_status: status,
          prn_admission_notes:
            input.userObservation?.trim() ||
            `Admission decision: ${input.userDecision}.`,
        },
      });
      await tx.person_records.create({
        data: {
          id_person: evaluation.id_person,
          id_user: input.actorUserId,
          prr_event_type:
            status === "accepted"
              ? "accepted"
              : status === "rejected"
                ? "rejected"
                : "admission_evaluated",
          prr_old_value: json({ admissionStatus: "under_review" }),
          prr_new_value: json({ admissionStatus: status }),
          prr_notes: input.userObservation?.trim() || null,
        },
      });
      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: evaluation.persons.id_camp,
          evt_entity: "admission_evaluations",
          evt_entity_id: input.evaluationId,
          evt_action: "confirmed",
          evt_new_value: json({
            personId: evaluation.id_person,
            userDecision: input.userDecision,
            admissionStatus: status,
          }),
          evt_description: "Admission evaluation confirmed by administrator.",
        },
      });
      return tx.admission_evaluations.findUniqueOrThrow({
        where: { id_admission_evaluation: input.evaluationId },
        include: evaluationInclude,
      });
    });
  }
}

export const admissionEvaluationsRepository =
  new AdmissionEvaluationsRepository();
