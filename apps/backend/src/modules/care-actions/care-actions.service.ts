import prisma from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { applyPersonProgression } from "../persons/person-progression.service.js";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ensureAdmin(actor: AuthenticatedUser) {
  if (actor.roleName.trim().toLowerCase() !== "administrador sistema") {
    throw new AppError(
      403,
      "Only system administrators can register care actions.",
      "CARE_ACTION_ADMIN_REQUIRED",
    );
  }
}

export class CareActionsService {
  async heal(
    input: {
      doctorPersonId: number;
      patientPersonId: number;
      notes?: string | null;
    },
    actor: AuthenticatedUser,
  ) {
    ensureAdmin(actor);
    if (input.doctorPersonId === input.patientPersonId) {
      throw new AppError(
        400,
        "Doctor and patient must be different people.",
        "CARE_ACTION_SAME_PERSON",
      );
    }

    return prisma.$transaction(async (tx) => {
      const [doctor, patient, resources, healthyStatus] = await Promise.all([
        tx.persons.findUnique({
          where: { id_person: input.doctorPersonId },
          include: { professions: true, person_stats: true },
        }),
        tx.persons.findUnique({
          where: { id_person: input.patientPersonId },
          include: { person_health: true, person_stats: true },
        }),
        tx.resources.findMany({
          where: { rss_is_active: true },
          orderBy: { id_resource: "asc" },
        }),
        tx.person_health.findFirst({
          where: {
            phs_is_active_status: true,
            phs_name: { contains: "Sano" },
          },
        }),
      ]);

      if (!doctor || !patient) {
        throw new AppError(404, "Doctor or patient not found.", "CARE_PERSON_NOT_FOUND");
      }
      if (
        doctor.id_camp !== patient.id_camp ||
        doctor.prn_admission_status !== "accepted" ||
        patient.prn_admission_status !== "accepted" ||
        !doctor.prn_is_active ||
        !patient.prn_is_active
      ) {
        throw new AppError(
          400,
          "Doctor and patient must be active, accepted, and in the same camp.",
          "CARE_PERSON_INELIGIBLE",
        );
      }
      if (!doctor.professions || normalize(doctor.professions.pfs_name) !== "medico") {
        throw new AppError(
          400,
          "Selected doctor does not have the Medico profession.",
          "CARE_DOCTOR_INVALID_PROFESSION",
        );
      }
      if (!patient.person_stats) {
        throw new AppError(
          409,
          "Patient stats are missing.",
          "CARE_PATIENT_STATS_MISSING",
        );
      }

      const food = resources.find((resource) => {
        const name = normalize(resource.rss_name);
        return name.includes("comida") || name.includes("food") || name.includes("aliment");
      });
      if (!food) {
        throw new AppError(
          409,
          "Food resource is not configured.",
          "CARE_FOOD_RESOURCE_MISSING",
        );
      }
      const storage = await tx.storage.findUnique({
        where: {
          id_camp_id_resource: {
            id_camp: doctor.id_camp,
            id_resource: food.id_resource,
          },
        },
      });
      const configuredFoodCost = Number(
        doctor.professions.pfs_healing_food_cost,
      );
      const foodCost = configuredFoodCost > 0 ? configuredFoodCost : 3;
      if (!storage || Number(storage.stg_quantity) < foodCost) {
        throw new AppError(
          409,
          "There is not enough food to perform the treatment.",
          "CARE_INSUFFICIENT_FOOD",
        );
      }
      const healthBefore = patient.person_stats.pst_health;
      const healingAmount = doctor.professions.pfs_healing_amount || 5;
      const healthAfter = Math.min(
        patient.person_stats.pst_max_health,
        healthBefore + healingAmount,
      );
      const wasSick = Boolean(
        patient.person_health &&
          normalize(patient.person_health.phs_name).includes("enfer"),
      );
      const previousFood = Number(storage.stg_quantity);
      const nextFood = Number((previousFood - foodCost).toFixed(2));

      await tx.storage.update({
        where: { id_storage: storage.id_storage },
        data: { stg_quantity: nextFood, stg_last_updated_at: new Date() },
      });
      await tx.storage_records.create({
        data: {
          id_storage: storage.id_storage,
          id_user: actor.id,
          str_previous_quantity: previousFood,
          str_new_quantity: nextFood,
          str_reason: `Medical treatment for person #${patient.id_person}`,
          str_is_below_minimum: nextFood < Number(storage.stg_min_quantity),
        },
      });
      await tx.resources_movements.create({
        data: {
          id_resource: food.id_resource,
          id_camp: doctor.id_camp,
          id_user: actor.id,
          id_person: doctor.id_person,
          rsm_type: "adjustment",
          rsm_quantity: -foodCost,
          rsm_reason_for_movement: "Medical treatment food cost",
          rsm_reference_type: "person",
          id_reference: patient.id_person,
        },
      });
      await tx.person_stats.update({
        where: { id_person: patient.id_person },
        data: { pst_health: healthAfter, pst_updated_at: new Date() },
      });

      let removedSick = false;
      if (wasSick) {
        await tx.person_health_records.updateMany({
          where: { id_person: patient.id_person, phr_is_current: true },
          data: { phr_is_current: false, phr_end_date: new Date() },
        });
        await tx.persons.update({
          where: { id_person: patient.id_person },
          data: { id_person_health: healthyStatus?.id_person_health ?? null },
        });
        if (healthyStatus) {
          await tx.person_health_records.create({
            data: {
              id_person: patient.id_person,
              id_person_health: healthyStatus.id_person_health,
              phr_recorded_by_user_id: actor.id,
              phr_notes: "Recovered after medical treatment.",
            },
          });
        }
        removedSick = true;
      }

      const action = await tx.care_actions.create({
        data: {
          id_camp: doctor.id_camp,
          id_doctor: doctor.id_person,
          id_patient: patient.id_person,
          id_user: actor.id,
          cra_food_cost: foodCost,
          cra_health_before: healthBefore,
          cra_health_after: healthAfter,
          cra_removed_sick: removedSick,
          cra_notes: input.notes?.trim() || null,
        },
      });
      await applyPersonProgression(tx, {
        personId: doctor.id_person,
        sourceType: "care",
        referenceKey: `care:${action.id_care_action}`,
        actorUserId: actor.id,
      });
      await tx.events.create({
        data: {
          id_user: actor.id,
          id_camp: doctor.id_camp,
          evt_entity: "care_actions",
          evt_entity_id: action.id_care_action,
          evt_action: "heal",
          evt_new_value: {
            doctorPersonId: doctor.id_person,
            patientPersonId: patient.id_person,
            foodCost,
            healthBefore,
            healthAfter,
            removedSick,
          },
          evt_description: "Medical treatment completed.",
        },
      });

      return {
        id: action.id_care_action,
        campId: doctor.id_camp,
        doctorPersonId: doctor.id_person,
        patientPersonId: patient.id_person,
        foodCost,
        healthBefore,
        healthAfter,
        removedSick,
        createdAt: action.cra_created_at.toISOString(),
      };
    });
  }
}

export const careActionsService = new CareActionsService();
