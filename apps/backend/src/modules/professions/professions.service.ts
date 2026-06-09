import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  applyBulkProfessionChange,
  countWorkablePersonsInProfession,
  findAllActiveProfessionsForCamp,
  findCampWithPersonsForCoverage,
  findLastTemporaryRecord,
  findPersonsForReassignment,
  findPersonsOutOfCampForCoverage,
  findTemporarilyAssignedPersonIds,
  professionsRepository,
} from "./professions.repository.js";
import type {
  ProfessionCoverageEntry,
  ProfessionCoverageResult,
  ProfessionListFilters,
  ProfessionSummary,
  ProfessionWriteInput,
  ReassignmentResult,
  RevertReassignmentInput,
  TemporaryReassignmentInput,
} from "./professions.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLowerCase() === "administrador sistema";
}

function ensureCanManageProfessions(user: AuthenticatedUser) {
  if (isSystemAdministrator(user)) {
    return;
  }

  throw new AppError(
    403,
    "Only system administrators can manage professions.",
    "PROFESSIONS_FORBIDDEN_ROLE",
  );
}

function serializeProfession(profession: {
  pfs_name: string;
  pfs_description: string;
  pfs_collects_resources: boolean;
  pfs_food_generated_per_day: unknown;
  pfs_water_generated_per_day: unknown;
  pfs_can_expedition: boolean;
  pfs_can_transfer: boolean;
  pfs_production_penalty: unknown;
  pfs_valuable_bonus_pp: unknown;
  pfs_transfer_bonus_pp: unknown;
  pfs_extra_food_chance_pp: unknown;
  pfs_extra_food_min: number;
  pfs_extra_food_max: number;
  pfs_healing_food_cost: unknown;
  pfs_healing_amount: number;
  id_camp: number | null;
  pfs_is_active: boolean;
}) {
  return {
    pfs_name: profession.pfs_name,
    pfs_description: profession.pfs_description,
    pfs_collects_resources: profession.pfs_collects_resources,
    pfs_food_generated_per_day: Number(profession.pfs_food_generated_per_day),
    pfs_water_generated_per_day: Number(profession.pfs_water_generated_per_day),
    pfs_can_expedition: profession.pfs_can_expedition,
    pfs_can_transfer: profession.pfs_can_transfer,
    pfs_production_penalty: Number(profession.pfs_production_penalty),
    pfs_valuable_bonus_pp: Number(profession.pfs_valuable_bonus_pp),
    pfs_transfer_bonus_pp: Number(profession.pfs_transfer_bonus_pp),
    pfs_extra_food_chance_pp: Number(profession.pfs_extra_food_chance_pp),
    pfs_extra_food_min: profession.pfs_extra_food_min,
    pfs_extra_food_max: profession.pfs_extra_food_max,
    pfs_healing_food_cost: Number(profession.pfs_healing_food_cost),
    pfs_healing_amount: profession.pfs_healing_amount,
    id_camp: profession.id_camp,
    pfs_is_active: profession.pfs_is_active,
  };
}

function mapProfession(record: {
  id_profession: number;
  pfs_name: string;
  pfs_description: string;
  pfs_collects_resources: boolean;
  pfs_food_generated_per_day: unknown;
  pfs_water_generated_per_day: unknown;
  pfs_can_expedition: boolean;
  pfs_can_transfer: boolean;
  pfs_production_penalty: unknown;
  pfs_valuable_bonus_pp: unknown;
  pfs_transfer_bonus_pp: unknown;
  pfs_extra_food_chance_pp: unknown;
  pfs_extra_food_min: number;
  pfs_extra_food_max: number;
  pfs_healing_food_cost: unknown;
  pfs_healing_amount: number;
  id_camp: number | null;
  pfs_is_active: boolean;
}): ProfessionSummary {
  return {
    id: record.id_profession,
    name: record.pfs_name,
    description: record.pfs_description,
    collectsResources: record.pfs_collects_resources,
    foodGeneratedPerDay: Number(record.pfs_food_generated_per_day),
    waterGeneratedPerDay: Number(record.pfs_water_generated_per_day),
    canExpedition: record.pfs_can_expedition,
    canTransfer: record.pfs_can_transfer,
    productionPenalty: Number(record.pfs_production_penalty),
    valuableBonusPoints: Number(record.pfs_valuable_bonus_pp),
    transferBonusPoints: Number(record.pfs_transfer_bonus_pp),
    extraFoodChancePoints: Number(record.pfs_extra_food_chance_pp),
    extraFoodMin: record.pfs_extra_food_min,
    extraFoodMax: record.pfs_extra_food_max,
    healingFoodCost: Number(record.pfs_healing_food_cost),
    healingAmount: record.pfs_healing_amount,
    campId: record.id_camp,
    isActive: record.pfs_is_active,
  };
}

export class ProfessionsService {
  async listProfessions(filters: ProfessionListFilters) {
    const search = filters.search?.trim();
    const where = {
      ...(filters.campId !== undefined
        ? { id_camp: filters.campId }
        : {}),
      ...(filters.active !== undefined ? { pfs_is_active: filters.active } : {}),
      ...(filters.collectsResources !== undefined
        ? { pfs_collects_resources: filters.collectsResources }
        : {}),
      ...(search
        ? {
            OR: [
              { pfs_name: { contains: search } },
              { pfs_description: { contains: search } },
            ],
          }
        : {}),
    };

    const result = await professionsRepository.listProfessions({
      where,
      filters,
    });

    return {
      items: result.items.map(mapProfession),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: { ...filters, search },
    };
  }

  async getProfessionById(professionId: number): Promise<ProfessionSummary> {
    const profession = await professionsRepository.findProfessionById(professionId);

    if (!profession) {
      throw new AppError(404, "Profession not found.", "PROFESSION_NOT_FOUND");
    }

    return mapProfession(profession);
  }

  async createProfession(input: ProfessionWriteInput, actor: AuthenticatedUser) {
    ensureCanManageProfessions(actor);

    if (!input.pfs_name) {
      throw new AppError(400, "A name is required.", "PROFESSION_NAME_REQUIRED");
    }

    if (!input.pfs_description) {
      throw new AppError(
        400,
        "A description is required.",
        "PROFESSION_DESCRIPTION_REQUIRED",
      );
    }

    const existing = await professionsRepository.findProfessionByName(input.pfs_name.trim());

    if (existing) {
      throw new AppError(
        409,
        "A profession with that name already exists.",
        "PROFESSION_NAME_ALREADY_EXISTS",
      );
    }

    if (input.id_camp !== undefined && input.id_camp !== null) {
      const camp = await professionsRepository.findCampById(input.id_camp);

      if (!camp) {
        throw new AppError(404, "Camp not found.", "PROFESSION_CAMP_NOT_FOUND");
      }
    }

    const profession = await professionsRepository.createProfession({
      data: {
        pfs_name: input.pfs_name.trim(),
        pfs_description: input.pfs_description.trim(),
        pfs_collects_resources: input.pfs_collects_resources ?? false,
        pfs_food_generated_per_day: input.pfs_food_generated_per_day ?? 0,
        pfs_water_generated_per_day: input.pfs_water_generated_per_day ?? 0,
        pfs_can_expedition: input.pfs_can_expedition ?? false,
        pfs_can_transfer: input.pfs_can_transfer ?? false,
        pfs_production_penalty: input.pfs_production_penalty ?? 0,
        pfs_valuable_bonus_pp: input.pfs_valuable_bonus_pp ?? 0,
        pfs_transfer_bonus_pp: input.pfs_transfer_bonus_pp ?? 0,
        pfs_extra_food_chance_pp: input.pfs_extra_food_chance_pp ?? 0,
        pfs_extra_food_min: input.pfs_extra_food_min ?? 0,
        pfs_extra_food_max: input.pfs_extra_food_max ?? 0,
        pfs_healing_food_cost: input.pfs_healing_food_cost ?? 0,
        pfs_healing_amount: input.pfs_healing_amount ?? 0,
        id_camp: input.id_camp ?? null,
        pfs_is_active: input.pfs_is_active ?? true,
      },
      actorUserId: actor.id,
    });

    return mapProfession(profession);
  }

  async updateProfession(
    professionId: number,
    input: ProfessionWriteInput,
    actor: AuthenticatedUser,
  ) {
    ensureCanManageProfessions(actor);

    const existing = await professionsRepository.findProfessionById(professionId);

    if (!existing) {
      throw new AppError(404, "Profession not found.", "PROFESSION_NOT_FOUND");
    }

    if (input.pfs_name && input.pfs_name.trim() !== existing.pfs_name) {
      const nameConflict = await professionsRepository.findProfessionByName(
        input.pfs_name.trim(),
      );

      if (nameConflict) {
        throw new AppError(
          409,
          "A profession with that name already exists.",
          "PROFESSION_NAME_ALREADY_EXISTS",
        );
      }
    }

    const nextCampId =
      input.id_camp !== undefined ? input.id_camp : existing.id_camp;

    if (nextCampId !== null) {
      const camp = await professionsRepository.findCampById(nextCampId);

      if (!camp) {
        throw new AppError(404, "Camp not found.", "PROFESSION_CAMP_NOT_FOUND");
      }
    }

    const nextState = {
      pfs_name: input.pfs_name?.trim() ?? existing.pfs_name,
      pfs_description: input.pfs_description?.trim() ?? existing.pfs_description,
      pfs_collects_resources: input.pfs_collects_resources ?? existing.pfs_collects_resources,
      pfs_food_generated_per_day:
        input.pfs_food_generated_per_day !== undefined
          ? input.pfs_food_generated_per_day
          : Number(existing.pfs_food_generated_per_day),
      pfs_water_generated_per_day:
        input.pfs_water_generated_per_day !== undefined
          ? input.pfs_water_generated_per_day
          : Number(existing.pfs_water_generated_per_day),
      pfs_can_expedition:
        input.pfs_can_expedition ?? existing.pfs_can_expedition,
      pfs_can_transfer: input.pfs_can_transfer ?? existing.pfs_can_transfer,
      pfs_production_penalty:
        input.pfs_production_penalty !== undefined
          ? input.pfs_production_penalty
          : Number(existing.pfs_production_penalty),
      pfs_valuable_bonus_pp:
        input.pfs_valuable_bonus_pp !== undefined
          ? input.pfs_valuable_bonus_pp
          : Number(existing.pfs_valuable_bonus_pp),
      pfs_transfer_bonus_pp:
        input.pfs_transfer_bonus_pp !== undefined
          ? input.pfs_transfer_bonus_pp
          : Number(existing.pfs_transfer_bonus_pp),
      pfs_extra_food_chance_pp:
        input.pfs_extra_food_chance_pp !== undefined
          ? input.pfs_extra_food_chance_pp
          : Number(existing.pfs_extra_food_chance_pp),
      pfs_extra_food_min:
        input.pfs_extra_food_min ?? existing.pfs_extra_food_min,
      pfs_extra_food_max:
        input.pfs_extra_food_max ?? existing.pfs_extra_food_max,
      pfs_healing_food_cost:
        input.pfs_healing_food_cost !== undefined
          ? input.pfs_healing_food_cost
          : Number(existing.pfs_healing_food_cost),
      pfs_healing_amount:
        input.pfs_healing_amount ?? existing.pfs_healing_amount,
      id_camp: nextCampId,
      pfs_is_active: input.pfs_is_active ?? existing.pfs_is_active,
    };

    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(nextState)) {
      const currentValue = existing[key as keyof typeof existing];
      const comparable =
        currentValue instanceof Object && "toFixed" in currentValue
          ? Number(currentValue)
          : currentValue;

      if (comparable !== value) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return mapProfession(existing);
    }

    const updated = await professionsRepository.updateProfession({
      professionId,
      data: updateData,
      previousSnapshot: serializeProfession(existing),
      nextSnapshot: serializeProfession({
        ...existing,
        ...nextState,
      }),
      actorUserId: actor.id,
      campId: existing.id_camp,
    });

    return mapProfession(updated);
  }

  async getProfessionCoverage(
    campId: number,
    actor: AuthenticatedUser,
  ): Promise<ProfessionCoverageResult> {
    if (!isSystemAdministrator(actor) && actor.campId !== campId) {
      throw new AppError(
        403,
        "You can only view coverage for your assigned camp.",
        "PROFESSIONS_COVERAGE_FORBIDDEN_CAMP",
      );
    }

    const camp = await findCampWithPersonsForCoverage(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "PROFESSIONS_CAMP_NOT_FOUND");
    }

    const [outOfCampIds, temporaryIds, allProfessions] = await Promise.all([
      findPersonsOutOfCampForCoverage(campId),
      findTemporarilyAssignedPersonIds(campId),
      findAllActiveProfessionsForCamp(campId),
    ]);

    const professionMap = new Map<
      number,
      {
        profession: ProfessionSummary;
        totalPersons: number;
        activeWorkers: number;
        outOfCamp: number;
        temporarilyAssigned: number;
      }
    >();

    for (const profession of allProfessions) {
      professionMap.set(profession.id_profession, {
        profession: mapProfession(profession),
        totalPersons: 0,
        activeWorkers: 0,
        outOfCamp: 0,
        temporarilyAssigned: 0,
      });
    }

    for (const person of camp.persons) {
      const profId = person.id_profession;
      if (!profId || !person.professions) {
        continue;
      }

      if (!professionMap.has(profId)) {
        professionMap.set(profId, {
          profession: mapProfession(person.professions),
          totalPersons: 0,
          activeWorkers: 0,
          outOfCamp: 0,
          temporarilyAssigned: 0,
        });
      }

      const entry = professionMap.get(profId)!;
      entry.totalPersons++;

      const isOut = outOfCampIds.has(person.id_person);
      const canWork =
        !person.id_person_health || (person.person_health?.phs_can_work ?? true);
      const isTemp = temporaryIds.has(person.id_person);

      if (isOut) {
        entry.outOfCamp++;
      } else if (canWork) {
        entry.activeWorkers++;
      }

      if (isTemp) {
        entry.temporarilyAssigned++;
      }
    }

    const professions: ProfessionCoverageEntry[] = Array.from(
      professionMap.values(),
    ).map((entry) => ({
      ...entry,
      needsCoverage: entry.activeWorkers === 0,
    }));

    professions.sort((a, b) =>
      a.profession.name.localeCompare(b.profession.name),
    );

    return {
      campId,
      campName: camp.cmp_name,
      professions,
      totalNeedingCoverage: professions.filter((entry) => entry.needsCoverage).length,
    };
  }

  async temporaryReassignment(
    input: TemporaryReassignmentInput,
    actor: AuthenticatedUser,
  ): Promise<ReassignmentResult> {
    ensureCanManageProfessions(actor);

    const targetProfession = await professionsRepository.findProfessionById(
      input.targetProfessionId,
    );

    if (!targetProfession) {
      throw new AppError(
        404,
        "Target profession not found.",
        "PROFESSIONS_TARGET_NOT_FOUND",
      );
    }

    if (!targetProfession.pfs_is_active) {
      throw new AppError(
        400,
        "Target profession is not active.",
        "PROFESSIONS_TARGET_INACTIVE",
      );
    }

    const campId = actor.campId;

    const [persons, outOfCampIds, workableInTarget] = await Promise.all([
      findPersonsForReassignment(input.personIds, campId),
      findPersonsOutOfCampForCoverage(campId),
      countWorkablePersonsInProfession(input.targetProfessionId, campId),
    ]);

    const foundIds = new Set<number>();
    for (const p of persons) foundIds.add(p.id_person);

    const reassigned: ReassignmentResult["reassigned"] = [];
    const skipped: ReassignmentResult["skipped"] = [];
    const warnings: string[] = [];

    for (const personId of input.personIds) {
      if (!foundIds.has(personId)) {
        skipped.push({ personId, reason: "Person not found in your camp." });
      }
    }

    if (workableInTarget > 0) {
      warnings.push(
        `Target profession already has ${workableInTarget} active worker(s). Reassignment may not be necessary.`,
      );
    }

    const changes: Parameters<typeof applyBulkProfessionChange>[0]["changes"] = [];

    for (const person of persons) {
      if (
        person.prn_admission_status !== "accepted" ||
        !person.prn_is_active
      ) {
        skipped.push({
          personId: person.id_person,
          reason: "Person is not active or not accepted.",
        });
        continue;
      }

      const canWork =
        !person.id_person_health || (person.person_health?.phs_can_work ?? true);

      if (!canWork) {
        skipped.push({
          personId: person.id_person,
          reason: "Person cannot work due to current health status.",
        });
        continue;
      }

      if (outOfCampIds.has(person.id_person)) {
        skipped.push({
          personId: person.id_person,
          reason: "Person is currently out of camp (expedition or transfer).",
        });
        continue;
      }

      if (person.id_profession === input.targetProfessionId) {
        skipped.push({
          personId: person.id_person,
          reason: "Person already belongs to the target profession.",
        });
        continue;
      }

      if (!person.id_profession || !person.professions) {
        skipped.push({
          personId: person.id_person,
          reason: "Person does not have a current profession.",
        });
        continue;
      }

      changes.push({
        personId: person.id_person,
        oldProfessionId: person.id_profession,
        newProfessionId: input.targetProfessionId,
        isTemporary: true,
        notes: input.notes?.trim() ?? "Temporary profession reassignment.",
      });

      reassigned.push({
        personId: person.id_person,
        fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
        previousProfessionId: person.id_profession,
        previousProfessionName: person.professions.pfs_name,
        newProfessionId: input.targetProfessionId,
        newProfessionName: targetProfession.pfs_name,
        isTemporary: true,
      });
    }

    if (changes.length > 0) {
      await applyBulkProfessionChange({
        campId,
        actorUserId: actor.id,
        changes,
      });
    }

    return { reassigned, skipped, warnings };
  }

  async revertReassignment(
    input: RevertReassignmentInput,
    actor: AuthenticatedUser,
  ): Promise<ReassignmentResult> {
    ensureCanManageProfessions(actor);

    const campId = actor.campId;
    const persons = await findPersonsForReassignment(input.personIds, campId);

    const foundIds = new Set<number>();
    for (const p of persons) foundIds.add(p.id_person);

    const reassigned: ReassignmentResult["reassigned"] = [];
    const skipped: ReassignmentResult["skipped"] = [];

    for (const personId of input.personIds) {
      if (!foundIds.has(personId)) {
        skipped.push({ personId, reason: "Person not found in your camp." });
      }
    }

    const changes: Parameters<typeof applyBulkProfessionChange>[0]["changes"] = [];

    for (const person of persons) {
      if (!person.id_profession || !person.professions) {
        skipped.push({
          personId: person.id_person,
          reason: "Person does not have a current profession.",
        });
        continue;
      }

      const lastTempRecord = await findLastTemporaryRecord(person.id_person);

      if (!lastTempRecord) {
        skipped.push({
          personId: person.id_person,
          reason: "No temporary reassignment record found for this person.",
        });
        continue;
      }

      const tempNewValue = lastTempRecord.prr_new_value as Record<string, unknown> | null;
      const tempProfessionId = tempNewValue?.id_profession as number | undefined;

      if (tempProfessionId !== person.id_profession) {
        skipped.push({
          personId: person.id_person,
          reason:
            "Person's current profession does not match their last temporary assignment. They may have been manually reassigned.",
        });
        continue;
      }

      const oldValue = lastTempRecord.prr_old_value as Record<string, unknown> | null;
      const originalProfessionId = oldValue?.id_profession as number | undefined;

      if (!originalProfessionId) {
        skipped.push({
          personId: person.id_person,
          reason: "Could not determine original profession from audit record.",
        });
        continue;
      }

      const originalProfession = await professionsRepository.findProfessionById(
        originalProfessionId,
      );

      if (!originalProfession) {
        skipped.push({
          personId: person.id_person,
          reason: `Original profession #${originalProfessionId} no longer exists.`,
        });
        continue;
      }

      if (!originalProfession.pfs_is_active) {
        skipped.push({
          personId: person.id_person,
          reason: `Original profession '${originalProfession.pfs_name}' is no longer active.`,
        });
        continue;
      }

      changes.push({
        personId: person.id_person,
        oldProfessionId: person.id_profession,
        newProfessionId: originalProfessionId,
        isTemporary: false,
        notes: input.notes?.trim() ?? "Reverted to original profession.",
      });

      reassigned.push({
        personId: person.id_person,
        fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
        previousProfessionId: person.id_profession,
        previousProfessionName: person.professions.pfs_name,
        newProfessionId: originalProfessionId,
        newProfessionName: originalProfession.pfs_name,
        isTemporary: false,
      });
    }

    if (changes.length > 0) {
      await applyBulkProfessionChange({
        campId,
        actorUserId: actor.id,
        changes,
      });
    }

    return { reassigned, skipped, warnings: [] };
  }
}

export const professionsService = new ProfessionsService();
