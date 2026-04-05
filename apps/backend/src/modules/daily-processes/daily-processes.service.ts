import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { dailyProcessesRepository } from "./daily-processes.repository.js";
import type {
  DailyProcessResult,
  DailyProcessRunInput,
  ProductionCorrectionInput,
} from "./daily-processes.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLowerCase() === "administrador sistema";
}

function canRunDailyProcess(user: AuthenticatedUser) {
  if (isSystemAdministrator(user)) return true;

  const normalized = user.roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return normalized.includes("recurso") || normalized.includes("gestion");
}

function ensureCanRunDailyProcess(user: AuthenticatedUser) {
  if (!canRunDailyProcess(user)) {
    throw new AppError(
      403,
      "You do not have permission to run the daily process.",
      "DAILY_PROCESS_FORBIDDEN_ROLE",
    );
  }
}

function resolveSettingInteger(settings: Record<string, string>, key: string): number {
  const raw = settings[key];

  if (raw === undefined || raw === null) {
    throw new AppError(
      500,
      `Required setting "${key}" is not configured. Please ask an administrator to configure it.`,
      "DAILY_PROCESS_MISSING_SETTING",
    );
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    throw new AppError(
      500,
      `Setting "${key}" has an invalid value: "${raw}".`,
      "DAILY_PROCESS_INVALID_SETTING",
    );
  }

  return parsed;
}

function resolveSettingDecimal(settings: Record<string, string>, key: string): number {
  const raw = settings[key];

  if (raw === undefined || raw === null) {
    throw new AppError(
      500,
      `Required setting "${key}" is not configured. Please ask an administrator to configure it.`,
      "DAILY_PROCESS_MISSING_SETTING",
    );
  }

  const parsed = Number.parseFloat(raw);

  if (Number.isNaN(parsed)) {
    throw new AppError(
      500,
      `Setting "${key}" has an invalid value: "${raw}".`,
      "DAILY_PROCESS_INVALID_SETTING",
    );
  }

  return parsed;
}

export class DailyProcessesService {
  async runDailyProcess(
    input: DailyProcessRunInput,
    actor: AuthenticatedUser,
  ): Promise<DailyProcessResult> {
    ensureCanRunDailyProcess(actor);

    const campId = input.campId ?? actor.campId;

    if (!isSystemAdministrator(actor) && campId !== actor.campId) {
      throw new AppError(
        403,
        "You can only run the daily process for your assigned camp.",
        "DAILY_PROCESS_FORBIDDEN_CAMP_SCOPE",
      );
    }

    const camp = await dailyProcessesRepository.findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "DAILY_PROCESS_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "Daily process can only run for active camps.",
        "DAILY_PROCESS_INVALID_CAMP_STATUS",
      );
    }

    const alreadyRan = await dailyProcessesRepository.checkDailyProductionRan(campId);

    if (alreadyRan) {
      throw new AppError(
        409,
        "The daily process has already run today for this camp.",
        "DAILY_PROCESS_ALREADY_RAN",
      );
    }

    const settings = await dailyProcessesRepository.getRequiredSettings();
    const foodResourceId = resolveSettingInteger(settings, "daily_food_resource_id");
    const waterResourceId = resolveSettingInteger(settings, "daily_water_resource_id");
    const foodRationPerPerson = resolveSettingDecimal(settings, "daily_food_ration_per_person");
    const waterRationPerPerson = resolveSettingDecimal(settings, "daily_water_ration_per_person");

    const workingPersons = await dailyProcessesRepository.findWorkingPersons(campId);
    const allActivePersons = await dailyProcessesRepository.findActivePersons(campId);

    let totalFoodProduced = 0;
    let totalWaterProduced = 0;

    for (const person of workingPersons) {
      totalFoodProduced += Number(person.professions.pfs_food_generated_per_day);
      totalWaterProduced += Number(person.professions.pfs_water_generated_per_day);
    }

    totalFoodProduced = Number(totalFoodProduced.toFixed(2));
    totalWaterProduced = Number(totalWaterProduced.toFixed(2));

    const totalPersonsCount = allActivePersons.length;
    const totalFoodRation = Number((totalPersonsCount * foodRationPerPerson).toFixed(2));
    const totalWaterRation = Number((totalPersonsCount * waterRationPerPerson).toFixed(2));

    const now = new Date();

    const result = await dailyProcessesRepository.runDailyProcess({
      campId,
      actorUserId: actor.id,
      foodResourceId,
      waterResourceId,
      totalFoodProduced,
      totalWaterProduced,
      totalFoodRation,
      totalWaterRation,
      workingPersonsCount: workingPersons.length,
      totalPersonsCount,
      now,
    });

    return {
      campId,
      workingPersonsCount: workingPersons.length,
      totalPersonsCount,
      production: {
        food: {
          resourceId: foodResourceId,
          amountProduced: totalFoodProduced,
          newStorageQuantity: result.foodProduction.nextQuantity,
        },
        water: {
          resourceId: waterResourceId,
          amountProduced: totalWaterProduced,
          newStorageQuantity: result.waterProduction.nextQuantity,
        },
      },
      rations: {
        food: {
          resourceId: foodResourceId,
          amountConsumed: totalFoodRation,
          newStorageQuantity: result.foodRation.nextQuantity,
          isBelowMinimum: result.foodRation.isBelowMinimum,
        },
        water: {
          resourceId: waterResourceId,
          amountConsumed: totalWaterRation,
          newStorageQuantity: result.waterRation.nextQuantity,
          isBelowMinimum: result.waterRation.isBelowMinimum,
        },
      },
      ranAt: now.toISOString(),
    };
  }

  async applyProductionCorrection(
    input: ProductionCorrectionInput,
    actor: AuthenticatedUser,
  ) {
    ensureCanRunDailyProcess(actor);

    const campId = input.campId ?? actor.campId;

    if (!isSystemAdministrator(actor) && campId !== actor.campId) {
      throw new AppError(
        403,
        "You can only apply corrections for your assigned camp.",
        "DAILY_PROCESS_FORBIDDEN_CAMP_SCOPE",
      );
    }

    const camp = await dailyProcessesRepository.findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "DAILY_PROCESS_CAMP_NOT_FOUND");
    }

    const person = await dailyProcessesRepository.findPersonById(input.personId);

    if (!person) {
      throw new AppError(404, "Person not found.", "DAILY_PROCESS_PERSON_NOT_FOUND");
    }

    if (person.id_camp !== campId) {
      throw new AppError(
        400,
        "The person does not belong to the target camp.",
        "DAILY_PROCESS_PERSON_CAMP_MISMATCH",
      );
    }

    const resource = await dailyProcessesRepository.findResourceById(input.resourceId);

    if (!resource) {
      throw new AppError(404, "Resource not found.", "DAILY_PROCESS_RESOURCE_NOT_FOUND");
    }

    if (!resource.rss_is_active) {
      throw new AppError(
        400,
        "Inactive resources cannot be adjusted.",
        "DAILY_PROCESS_RESOURCE_INACTIVE",
      );
    }

    try {
      const result = await dailyProcessesRepository.applyProductionCorrection({
        campId,
        personId: input.personId,
        resourceId: input.resourceId,
        quantityDelta: input.quantityDelta,
        reason: input.reason.trim(),
        actorUserId: actor.id,
        now: new Date(),
      });

      return {
        campId,
        personId: input.personId,
        resourceId: input.resourceId,
        quantityDelta: input.quantityDelta,
        previousQuantity: result.previousQuantity,
        newQuantity: result.nextQuantity,
        isBelowMinimum: result.isBelowMinimum,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Insufficient stock")) {
        throw new AppError(400, error.message, "DAILY_PROCESS_INSUFFICIENT_STOCK");
      }

      throw error;
    }
  }
}

export const dailyProcessesService = new DailyProcessesService();
