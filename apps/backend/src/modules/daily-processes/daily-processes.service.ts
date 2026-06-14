import prisma, { Prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getServerNow } from "../../shared/helpers/server-time.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { healthPercentage } from "../persons/person-stats.js";
import { applyPersonProgression } from "../persons/person-progression.service.js";
import {
  applyDailyRations,
  applyPersonProduction,
  findActiveCampPersons,
  findCampById,
  findFoodAndWaterResourceIds,
  findPersonsOutOfCamp,
  findRationableStorage,
  findRationPerPersonSetting,
  findSickHealthStatus,
  findTodayDailyProcessEvent,
  findWorkablePersons,
  listDailyAssignments,
  replaceDailyAssignments,
  writeDailyProcessEvent,
} from "./daily-processes.repository.js";
import type {
  DailyAssignmentsInput,
  DailyAssignmentTask,
  DailyProcessRunResult,
  RunDailyProcessInput,
} from "./daily-processes.types.js";

function normalizeRole(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isSystemAdministrator(user: AuthenticatedUser) {
  return normalizeRole(user.roleName) === "administrador sistema";
}

function canTriggerDailyProcess(user: AuthenticatedUser) {
  const role = normalizeRole(user.roleName);
  return role.includes("gestion") && role.includes("recurso");
}

function ensureCanTrigger(user: AuthenticatedUser) {
  if (!canTriggerDailyProcess(user)) {
    throw new AppError(
      403,
      "Only resource managers can manage daily processes.",
      "DAILY_PROCESS_FORBIDDEN_ROLE",
    );
  }
}

function ensureCampScope(actor: AuthenticatedUser, campId: number) {
  if (!isSystemAdministrator(actor) && actor.campId !== campId) {
    throw new AppError(
      403,
      "You can only manage the daily process for your assigned camp.",
      "DAILY_PROCESS_FORBIDDEN_CAMP",
    );
  }
}

function dateOnly(value: Date) {
  return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function isTaskCompatible(
  task: DailyAssignmentTask,
  profession: {
    pfs_food_generated_per_day: unknown;
    pfs_water_generated_per_day: unknown;
  } | null,
) {
  if (!profession) return false;
  const food = Number(profession.pfs_food_generated_per_day);
  const water = Number(profession.pfs_water_generated_per_day);
  if (task === "food_production") return food > 0;
  if (task === "water_production") return water > 0;
  return food === 0 && water === 0;
}

function automaticTask(profession: {
  pfs_food_generated_per_day: unknown;
  pfs_water_generated_per_day: unknown;
}): DailyAssignmentTask {
  if (Number(profession.pfs_food_generated_per_day) > 0) {
    return "food_production";
  }
  if (Number(profession.pfs_water_generated_per_day) > 0) {
    return "water_production";
  }
  return "camp_support";
}

function mapAssignment(
  assignment: Awaited<ReturnType<typeof listDailyAssignments>>[number],
) {
  return {
    id: assignment.id_daily_assignment,
    campId: assignment.id_camp,
    personId: assignment.id_person,
    fullName:
      `${assignment.persons.prn_name} ${assignment.persons.prn_lastname}`.trim(),
    profession: assignment.persons.professions
      ? {
          id: assignment.persons.professions.id_profession,
          name: assignment.persons.professions.pfs_name,
        }
      : null,
    date: assignment.das_date.toISOString().slice(0, 10),
    task: assignment.das_task,
    isAutomatic: assignment.das_is_automatic,
    isCompatible: assignment.das_is_compatible,
    wasSuccessful: assignment.das_was_successful,
    result: assignment.das_result,
  };
}

async function applyDiseaseEvents(
  tx: Prisma.TransactionClient,
  input: {
    campId: number;
    actorUserId: number;
    people: Awaited<ReturnType<typeof findActiveCampPersons>>;
    diseaseProbability: number;
    diseaseThreshold: number;
    sickHealthId: number | null;
  },
) {
  if (!input.sickHealthId) return;

  for (const person of input.people) {
    const stats = person.person_stats;
    if (
      !stats ||
      person.person_health?.phs_name.toLowerCase().includes("enfer")
    ) {
      continue;
    }
    const percentage = healthPercentage({
      health: stats.pst_health,
      maxHealth: stats.pst_max_health,
    });
    if (percentage >= input.diseaseThreshold) continue;

    const luckProtection = (stats.pst_luck / 31) * 10;
    const probability = Math.max(
      5,
      Math.min(95, input.diseaseProbability - luckProtection),
    );
    const roll = Math.random() * 100;
    if (roll > probability) continue;

    await tx.person_health_records.updateMany({
      where: { id_person: person.id_person, phr_is_current: true },
      data: {
        phr_is_current: false,
        phr_end_date: new Date(),
      },
    });
    await tx.persons.update({
      where: { id_person: person.id_person },
      data: { id_person_health: input.sickHealthId },
    });
    await tx.person_health_records.create({
      data: {
        id_person: person.id_person,
        id_person_health: input.sickHealthId,
        phr_recorded_by_user_id: input.actorUserId,
        phr_notes: "Disease event caused by critical health.",
      },
    });
    await tx.narrative_events.create({
      data: {
        id_camp: input.campId,
        id_user: input.actorUserId,
        nre_type: "disease",
        nre_status: "applied",
        nre_source_type: "daily_process",
        nre_probability: probability,
        nre_roll: roll,
        nre_participants: { personIds: [person.id_person] },
        nre_effects: {
          previousHealthStatusId: person.id_person_health,
          healthStatusId: input.sickHealthId,
          healthPercentage: percentage,
        },
        nre_description: `${person.prn_name} ${person.prn_lastname} became sick due to critical health.`,
      },
    });
  }
}

export class DailyProcessesService {
  async runScheduledDailyProcesses() {
    const camps = await prisma.camps.findMany({
      where: { cmp_status: "active" },
      include: {
        users: {
          where: {
            usr_is_active: true,
            roles: {
              is: {
                rls_name: { contains: "gestion recursos" },
              },
            },
          },
          include: {
            roles: true,
          },
          take: 1,
        },
      },
      orderBy: { id_camp: "asc" },
    });

    const results: Array<{
      campId: number;
      campName: string;
      status: "processed" | "skipped" | "failed";
      message?: string;
      result?: DailyProcessRunResult;
    }> = [];

    for (const camp of camps) {
      const manager = camp.users[0];
      if (!manager) {
        results.push({
          campId: camp.id_camp,
          campName: camp.cmp_name,
          status: "skipped",
          message: "No active resource manager is assigned to the camp.",
        });
        continue;
      }

      try {
        const result = await this.runDailyProcess(
          { campId: camp.id_camp },
          {
            id: manager.id_user,
            username: manager.usr_username,
            email: manager.usr_email,
            roleName: manager.roles.rls_name,
            campId: camp.id_camp,
            campName: camp.cmp_name,
            personId: manager.id_person,
            availableCamps: [{ id: camp.id_camp, name: camp.cmp_name }],
            sessionId: "scheduled-process",
            sessionExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            sessionTimeoutMinutes: 1,
          },
        );
        results.push({
          campId: camp.id_camp,
          campName: camp.cmp_name,
          status: "processed",
          result,
        });
      } catch (error) {
        results.push({
          campId: camp.id_camp,
          campName: camp.cmp_name,
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      runAt: getServerNow().toISOString(),
      camps: results,
    };
  }

  async getAssignments(campId: number, date: Date, actor: AuthenticatedUser) {
    ensureCanTrigger(actor);
    ensureCampScope(actor, campId);
    const assignments = await listDailyAssignments(campId, dateOnly(date));
    return {
      campId,
      date: date.toISOString().slice(0, 10),
      assignments: assignments.map(mapAssignment),
    };
  }

  async updateAssignments(
    input: DailyAssignmentsInput,
    actor: AuthenticatedUser,
  ) {
    ensureCanTrigger(actor);
    ensureCampScope(actor, input.campId);
    const people = await findWorkablePersons(input.campId);
    const byId = new Map(people.map((person) => [person.id_person, person]));
    const uniqueIds = new Set(input.assignments.map((item) => item.personId));
    if (uniqueIds.size !== input.assignments.length) {
      throw new AppError(
        400,
        "A person can only have one assignment per day.",
        "DAILY_ASSIGNMENT_DUPLICATE_PERSON",
      );
    }

    const assignments = input.assignments.map((assignment) => {
      const person = byId.get(assignment.personId);
      if (!person) {
        throw new AppError(
          400,
          `Person ${assignment.personId} is not eligible for daily work.`,
          "DAILY_ASSIGNMENT_PERSON_INELIGIBLE",
        );
      }
      return {
        ...assignment,
        compatible: isTaskCompatible(assignment.task, person.professions),
      };
    });
    const saved = await replaceDailyAssignments({
      campId: input.campId,
      date: dateOnly(input.date),
      assignments,
      automatic: false,
    });
    return {
      campId: input.campId,
      date: input.date.toISOString().slice(0, 10),
      assignments: saved.map(mapAssignment),
    };
  }

  async runDailyProcess(
    input: RunDailyProcessInput,
    actor: AuthenticatedUser,
  ): Promise<DailyProcessRunResult> {
    ensureCanTrigger(actor);
    const campId = input.campId ?? actor.campId;
    ensureCampScope(actor, campId);
    const camp = await findCampById(campId);
    if (!camp) {
      throw new AppError(
        404,
        "Camp not found.",
        "DAILY_PROCESS_CAMP_NOT_FOUND",
      );
    }
    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "The daily process can only run for active camps.",
        "DAILY_PROCESS_INACTIVE_CAMP",
      );
    }

    const existingEvent = await findTodayDailyProcessEvent(campId);
    if (existingEvent && !input.force) {
      const cached =
        existingEvent.evt_new_value as DailyProcessRunResult | null;
      if (cached) return { ...cached, alreadyRunToday: true };
      throw new AppError(
        409,
        "The daily process has already run today.",
        "DAILY_PROCESS_ALREADY_RAN_TODAY",
      );
    }
    if (input.force && !canTriggerDailyProcess(actor)) {
      throw new AppError(
        403,
        "Only resource managers can force a re-run.",
        "DAILY_PROCESS_FORCE_FORBIDDEN",
      );
    }

    const now = getServerNow();
    const day = dateOnly(now);
    const [
      workablePersons,
      allActivePersons,
      rationableStorage,
      resources,
      rationPerPerson,
      outOfCampIds,
      sickHealth,
    ] = await Promise.all([
      findWorkablePersons(campId),
      findActiveCampPersons(campId),
      findRationableStorage(campId),
      findFoodAndWaterResourceIds(),
      findRationPerPersonSetting(),
      findPersonsOutOfCamp(campId),
      findSickHealthStatus(),
    ]);

    let assignments = await listDailyAssignments(campId, day);
    if (assignments.length === 0) {
      assignments = await replaceDailyAssignments({
        campId,
        date: day,
        automatic: true,
        assignments: workablePersons
          .filter((person) => person.professions)
          .map((person) => {
            const task = automaticTask(person.professions!);
            return {
              personId: person.id_person,
              task,
              compatible: true,
            };
          }),
      });
    }

    const productionRows: DailyProcessRunResult["production"]["production"] =
      [];
    const rationRows: DailyProcessRunResult["rations"]["rations"] = [];

    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        const person = assignment.persons;
        const profession = person.professions;
        const isOutOfCamp = outOfCampIds.has(person.id_person);
        if (!profession || isOutOfCamp) {
          productionRows.push({
            personId: person.id_person,
            fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
            professionId: profession?.id_profession ?? 0,
            professionName: profession?.pfs_name ?? "Sin oficio",
            foodProduced: 0,
            waterProduced: 0,
            skipped: true,
            skipReason: !profession
              ? "Person does not have an assigned profession"
              : "Person is currently out of camp",
          });
          await tx.daily_assignments.update({
            where: { id_daily_assignment: assignment.id_daily_assignment },
            data: {
              das_was_successful: false,
              das_result: { skipped: true },
            },
          });
          continue;
        }

        const penalty = Number(profession.pfs_production_penalty);
        let foodAmount = 0;
        let waterAmount = 0;
        if (assignment.das_task === "food_production") {
          foodAmount = assignment.das_is_compatible
            ? Number(profession.pfs_food_generated_per_day)
            : -penalty;
        } else if (assignment.das_task === "water_production") {
          waterAmount = assignment.das_is_compatible
            ? Number(profession.pfs_water_generated_per_day)
            : -penalty;
        }
        const successful =
          assignment.das_is_compatible &&
          (assignment.das_task === "camp_support" ||
            foodAmount > 0 ||
            waterAmount > 0);
        const applied = await applyPersonProduction(tx, {
          campId,
          personId: person.id_person,
          actorUserId: actor.id,
          foodResourceId: resources.foodResourceId ?? 0,
          waterResourceId: resources.waterResourceId,
          foodAmount,
          waterAmount,
          now,
        });
        await tx.daily_assignments.update({
          where: { id_daily_assignment: assignment.id_daily_assignment },
          data: {
            das_was_successful: successful,
            das_result: {
              foodProduced: applied.foodApplied,
              waterProduced: applied.waterApplied,
              penaltyApplied: !assignment.das_is_compatible,
            },
          },
        });
        if (successful) {
          await applyPersonProgression(tx, {
            personId: person.id_person,
            sourceType: "daily_assignment",
            referenceKey: `daily:${day.toISOString().slice(0, 10)}`,
            actorUserId: actor.id,
          });
        }
        productionRows.push({
          personId: person.id_person,
          fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
          professionId: profession.id_profession,
          professionName: profession.pfs_name,
          foodProduced: applied.foodApplied,
          waterProduced: applied.waterApplied,
          skipped: false,
          skipReason: null,
        });
      }

      const eligiblePersonCount = allActivePersons.filter(
        (person) => !outOfCampIds.has(person.id_person),
      ).length;
      if (eligiblePersonCount > 0 && rationableStorage.length > 0) {
        rationRows.push(
          ...(await applyDailyRations(tx, {
            campId,
            actorUserId: actor.id,
            eligiblePersonCount,
            rationableStorage,
            rationPerPerson,
            now,
          })),
        );
      }

      const rules = camp.camp_operational_rules;
      await applyDiseaseEvents(tx, {
        campId,
        actorUserId: actor.id,
        people: allActivePersons,
        diseaseProbability: Number(rules?.cor_disease_probability ?? 25),
        diseaseThreshold: Number(rules?.cor_disease_threshold ?? 25),
        sickHealthId: sickHealth?.id_person_health ?? null,
      });

      const summary = buildRunSummary({
        campId,
        campName: camp.cmp_name,
        now,
        productionRows,
        rationRows,
        alreadyRunToday: false,
      });
      await writeDailyProcessEvent(tx, {
        campId,
        actorUserId: actor.id,
        summary,
        now,
      });
    });

    return buildRunSummary({
      campId,
      campName: camp.cmp_name,
      now,
      productionRows,
      rationRows,
      alreadyRunToday: false,
    });
  }

  async getDailyProcessStatus(campId: number, actor: AuthenticatedUser) {
    ensureCampScope(actor, campId);
    const camp = await findCampById(campId);
    if (!camp) {
      throw new AppError(
        404,
        "Camp not found.",
        "DAILY_PROCESS_CAMP_NOT_FOUND",
      );
    }
    const existingEvent = await findTodayDailyProcessEvent(campId);
    return {
      campId,
      campName: camp.cmp_name,
      ranToday: Boolean(existingEvent),
      lastRunAt: existingEvent?.evt_created_at.toISOString() ?? null,
      summary: existingEvent?.evt_new_value ?? null,
    };
  }
}

export const dailyProcessesService = new DailyProcessesService();

function buildRunSummary(input: {
  campId: number;
  campName: string;
  now: Date;
  productionRows: DailyProcessRunResult["production"]["production"];
  rationRows: DailyProcessRunResult["rations"]["rations"];
  alreadyRunToday: boolean;
}): DailyProcessRunResult {
  const totalFood = input.productionRows.reduce(
    (total, row) => total + row.foodProduced,
    0,
  );
  const totalWater = input.productionRows.reduce(
    (total, row) => total + row.waterProduced,
    0,
  );
  return {
    campId: input.campId,
    campName: input.campName,
    runAt: input.now.toISOString(),
    alreadyRunToday: input.alreadyRunToday,
    production: {
      campId: input.campId,
      campName: input.campName,
      date: input.now.toISOString().slice(0, 10),
      production: input.productionRows,
      totals: {
        foodProduced: Number(totalFood.toFixed(2)),
        waterProduced: Number(totalWater.toFixed(2)),
        personsProcessed: input.productionRows.filter((row) => !row.skipped)
          .length,
        personsSkipped: input.productionRows.filter((row) => row.skipped)
          .length,
      },
    },
    rations: {
      campId: input.campId,
      campName: input.campName,
      date: input.now.toISOString().slice(0, 10),
      rations: input.rationRows,
      totals: {
        resourcesProcessed: input.rationRows.length,
        personsServed: input.rationRows[0]
          ? Math.round(
              input.rationRows[0].totalConsumed /
                (input.rationRows[0].rationPerPerson || 1),
            )
          : 0,
      },
    },
  };
}
