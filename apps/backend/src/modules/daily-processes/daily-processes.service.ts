import prisma from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getServerNow } from "../../shared/helpers/server-time.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  applyDailyRations,
  applyPersonProduction,
  findActiveCampPersons,
  findCampById,
  findFoodAndWaterResourceIds,
  findPersonsOutOfCamp,
  findRationableStorage,
  findRationPerPersonSetting,
  findTodayDailyProcessEvent,
  findWorkablePersons,
  writeDailyProcessEvent,
} from "./daily-processes.repository.js";
import type {
  DailyProcessRunResult,
  RunDailyProcessInput,
} from "./daily-processes.types.js";

// ─── Role helpers ─────────────────────────────────────────────────────────────

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
  if (isSystemAdministrator(user)) return true;
  const role = normalizeRole(user.roleName);
  return role.includes("gestion") && role.includes("recurso");
}

function ensureCanTrigger(user: AuthenticatedUser) {
  if (!canTriggerDailyProcess(user)) {
    throw new AppError(
      403,
      "Only resource managers or system administrators can run the daily process.",
      "DAILY_PROCESS_FORBIDDEN_ROLE",
    );
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DailyProcessesService {
  async runDailyProcess(
    input: RunDailyProcessInput,
    actor: AuthenticatedUser,
  ): Promise<DailyProcessRunResult> {
    ensureCanTrigger(actor);

    const campId = input.campId ?? actor.campId;

    if (input.campId && input.campId !== actor.campId && !isSystemAdministrator(actor)) {
      throw new AppError(
        403,
        "You can only run the daily process for your assigned camp.",
        "DAILY_PROCESS_FORBIDDEN_CAMP",
      );
    }

    const camp = await findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "DAILY_PROCESS_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "The daily process can only run for active camps.",
        "DAILY_PROCESS_INACTIVE_CAMP",
      );
    }

    // ── Idempotencia ─────────────────────────────────────────────────────────
    const existingEvent = await findTodayDailyProcessEvent(campId);

    if (existingEvent && !input.force) {
      const cached = existingEvent.evt_new_value as DailyProcessRunResult | null;
      if (cached) return { ...cached, alreadyRunToday: true };

      throw new AppError(
        409,
        "The daily process has already run today. Pass force=true to override (admin only).",
        "DAILY_PROCESS_ALREADY_RAN_TODAY",
      );
    }

    if (input.force && !isSystemAdministrator(actor)) {
      throw new AppError(
        403,
        "Only system administrators can force a re-run.",
        "DAILY_PROCESS_FORCE_FORBIDDEN",
      );
    }

    // ── Datos ─────────────────────────────────────────────────────────────────
    const now = getServerNow();

    const [
      workablePersons,
      allActivePersons,
      rationableStorage,
      { foodResourceId, waterResourceId },
      rationPerPerson,
      outOfCampIds,
    ] = await Promise.all([
      findWorkablePersons(campId),
      findActiveCampPersons(campId),
      findRationableStorage(campId),
      findFoodAndWaterResourceIds(),
      findRationPerPersonSetting(),
      findPersonsOutOfCamp(campId),
    ]);

    // ── Transacción ───────────────────────────────────────────────────────────
    const productionRows: DailyProcessRunResult["production"]["production"] = [];
    const rationRows: DailyProcessRunResult["rations"]["rations"] = [];

    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      // 1. Producción por persona
      for (const person of workablePersons) {
        const profession = person.professions;
        const isOutOfCamp = outOfCampIds.has(person.id_person);

        if (isOutOfCamp) {
          productionRows.push({
            personId: person.id_person,
            fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
            professionId: profession.id_profession,
            professionName: profession.pfs_name,
            foodProduced: 0,
            waterProduced: 0,
            skipped: true,
            skipReason: "Person is currently out of camp",
          });
          continue;
        }

        const foodAmount = Number(profession.pfs_food_generated_per_day);
        const waterAmount = Number(profession.pfs_water_generated_per_day);

        await applyPersonProduction(tx, {
          campId,
          personId: person.id_person,
          actorUserId: actor.id,
          foodResourceId: foodResourceId ?? 0,
          waterResourceId,
          foodAmount,
          waterAmount,
          now,
        });

        productionRows.push({
          personId: person.id_person,
          fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
          professionId: profession.id_profession,
          professionName: profession.pfs_name,
          foodProduced: foodAmount,
          waterProduced: waterAmount,
          skipped: false,
          skipReason: null,
        });
      }

      // 2. Raciones
      const eligiblePersonCount = allActivePersons.filter(
        (p: { id_person: number }) => !outOfCampIds.has(p.id_person),
      ).length;

      if (eligiblePersonCount > 0 && rationableStorage.length > 0) {
        const results = await applyDailyRations(tx, {
          campId,
          actorUserId: actor.id,
          eligiblePersonCount,
          rationableStorage,
          rationPerPerson,
          now,
        });
        rationRows.push(...results);
      }

      // 3. Evento centinela
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
    const resolvedCampId = isSystemAdministrator(actor) ? campId : actor.campId;

    if (campId !== resolvedCampId) {
      throw new AppError(
        403,
        "You can only view the status for your assigned camp.",
        "DAILY_PROCESS_FORBIDDEN_CAMP",
      );
    }

    const camp = await findCampById(resolvedCampId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "DAILY_PROCESS_CAMP_NOT_FOUND");
    }

    const existingEvent = await findTodayDailyProcessEvent(resolvedCampId);

    if (!existingEvent) {
      return {
        campId: resolvedCampId,
        campName: camp.cmp_name,
        ranToday: false,
        lastRunAt: null,
        summary: null,
      };
    }

    return {
      campId: resolvedCampId,
      campName: camp.cmp_name,
      ranToday: true,
      lastRunAt: existingEvent.evt_created_at.toISOString(),
      summary: existingEvent.evt_new_value ?? null,
    };
  }
}

export const dailyProcessesService = new DailyProcessesService();

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildRunSummary(input: {
  campId: number;
  campName: string;
  now: Date;
  productionRows: DailyProcessRunResult["production"]["production"];
  rationRows: DailyProcessRunResult["rations"]["rations"];
  alreadyRunToday: boolean;
}): DailyProcessRunResult {
  const totalFood = input.productionRows.reduce((acc, r) => acc + r.foodProduced, 0);
  const totalWater = input.productionRows.reduce((acc, r) => acc + r.waterProduced, 0);

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
        personsProcessed: input.productionRows.filter((r) => !r.skipped).length,
        personsSkipped: input.productionRows.filter((r) => r.skipped).length,
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