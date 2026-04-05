import prisma, { Prisma } from "../../lib/prisma.js";
import type { ProfessionListFilters, ProfessionWriteInput } from "./professions.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export class ProfessionsRepository {
  async listProfessions(input: {
    where: Prisma.professionsWhereInput;
    filters: ProfessionListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.professions.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [{ pfs_name: "asc" }],
      }),
      prisma.professions.count({
        where: input.where,
      }),
    ]);

    return { items, total };
  }

  async findProfessionById(professionId: number) {
    return prisma.professions.findUnique({
      where: { id_profession: professionId },
    });
  }

  async findProfessionByName(name: string) {
    return prisma.professions.findUnique({
      where: { pfs_name: name },
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: { id_camp: campId },
    });
  }

  async createProfession(input: {
    data: Prisma.professionsUncheckedCreateInput;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const profession = await tx.professions.create({
        data: input.data,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: typeof input.data.id_camp === "number" ? input.data.id_camp : null,
          evt_entity: "professions",
          evt_entity_id: profession.id_profession,
          evt_action: "created",
          evt_new_value: toPrismaJsonValue({
            pfs_name: profession.pfs_name,
            pfs_description: profession.pfs_description,
            pfs_collects_resources: profession.pfs_collects_resources,
            pfs_food_generated_per_day: Number(profession.pfs_food_generated_per_day),
            pfs_water_generated_per_day: Number(profession.pfs_water_generated_per_day),
            id_camp: profession.id_camp,
            pfs_is_active: profession.pfs_is_active,
          }),
          evt_description: `Profession created: ${profession.pfs_name}.`,
        },
      });

      return profession;
    });
  }

  async updateProfession(input: {
    professionId: number;
    data: Prisma.professionsUncheckedUpdateInput;
    previousSnapshot: unknown;
    nextSnapshot: unknown;
    actorUserId: number;
    campId: number | null;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const profession = await tx.professions.update({
        where: { id_profession: input.professionId },
        data: input.data,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: input.campId,
          evt_entity: "professions",
          evt_entity_id: profession.id_profession,
          evt_action: "updated",
          evt_old_value: toPrismaJsonValue(input.previousSnapshot),
          evt_new_value: toPrismaJsonValue(input.nextSnapshot),
          evt_description: `Profession updated: ${profession.pfs_name}.`,
        },
      });

      return profession;
    });
  }
}

export const professionsRepository = new ProfessionsRepository();
