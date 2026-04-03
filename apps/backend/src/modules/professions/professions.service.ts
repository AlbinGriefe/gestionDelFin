import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { professionsRepository } from "./professions.repository.js";
import type {
  ProfessionListFilters,
  ProfessionSummary,
  ProfessionWriteInput,
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
  id_camp: number | null;
  pfs_is_active: boolean;
}) {
  return {
    pfs_name: profession.pfs_name,
    pfs_description: profession.pfs_description,
    pfs_collects_resources: profession.pfs_collects_resources,
    pfs_food_generated_per_day: Number(profession.pfs_food_generated_per_day),
    pfs_water_generated_per_day: Number(profession.pfs_water_generated_per_day),
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
}

export const professionsService = new ProfessionsService();
