import prisma, { Prisma } from "../../lib/prisma.js";
import type { ProfessionListFilters } from "./professions.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}


export async function findAllActiveProfessionsForCamp(campId: number) {
  return prisma.professions.findMany({
    where: {
      pfs_is_active: true,
      OR: [{ id_camp: campId }, { id_camp: null }],
    },
    orderBy: { pfs_name: "asc" },
  });
}

export async function countWorkablePersonsInProfession(
  professionId: number,
  campId: number,
) {
  return prisma.persons.count({
    where: {
      id_profession: professionId,
      id_camp: campId,
      prn_admission_status: "accepted",
      prn_is_active: true,
      OR: [{ id_person_health: null }, { person_health: { phs_can_work: true } }],
    },
  });
}

export async function findCampWithPersonsForCoverage(campId: number) {
  return prisma.camps.findUnique({
    where: { id_camp: campId },
    include: {
      persons: {
        where: { prn_is_active: true, prn_admission_status: "accepted" },
        include: {
          professions: true,
          person_health: true,
        },
      },
    },
  });
}

export async function findPersonsOutOfCampForCoverage(campId: number): Promise<Set<number>> {
  const [expeditionPersons, transferPersons] = await prisma.$transaction([
    prisma.expedition_records.findMany({
      where: {
        expeditions: { id_camp: campId, exe_state: { in: ["in_progress"] } },
        exr_departure_confirmed: true,
        exr_return_confirmed: false,
      },
      select: { id_person: true },
    }),
    prisma.application_admission_person.findMany({
      where: {
        transfers: {
          id_origin_camp: campId,
          tfs_state: { in: ["in_transit", "scheduled"] },
        },
        aap_departure_confirmed: true,
        aap_arrival_confirmed: false,
        aap_returned_to_origin: false,
      },
      select: { id_person: true },
    }),
  ]);

  const ids = new Set<number>();
  for (const r of expeditionPersons) ids.add(r.id_person);
  for (const r of transferPersons) ids.add(r.id_person);
  return ids;
}

export async function findTemporarilyAssignedPersonIds(campId: number): Promise<Set<number>> {
  const records = await prisma.person_records.findMany({
    where: {
      persons: {
        id_camp: campId,
        prn_is_active: true,
        prn_admission_status: "accepted",
      },
      prr_event_type: "profession_changed",
    },
    orderBy: { prr_created_at: "desc" },
    select: {
      id_person: true,
      prr_new_value: true,
    },
  });

  const seen = new Set<number>();
  const temporaryIds = new Set<number>();

  for (const r of records) {
    if (seen.has(r.id_person)) continue;
    seen.add(r.id_person);

    const newValue = r.prr_new_value as Record<string, unknown> | null;
    if (newValue?.is_temporary === true) {
      temporaryIds.add(r.id_person);
    }
  }

  return temporaryIds;
}


export async function findPersonsForReassignment(personIds: number[], campId: number) {
  return prisma.persons.findMany({
    where: {
      id_person: { in: personIds },
      id_camp: campId,
    },
    include: {
      professions: true,
      person_health: true,
    },
  });
}

export async function findLastTemporaryRecord(personId: number) {
  const records = await prisma.person_records.findMany({
    where: {
      id_person: personId,
      prr_event_type: "profession_changed",
    },
    orderBy: { prr_created_at: "desc" },
    take: 10,
  });

  for (const r of records) {
    const newValue = r.prr_new_value as Record<string, unknown> | null;
    if (newValue?.is_temporary === true) {
      return r;
    }
  }

  return null;
}

export async function applyBulkProfessionChange(input: {
  campId: number;
  actorUserId: number;
  changes: {
    personId: number;
    oldProfessionId: number;
    newProfessionId: number;
    isTemporary: boolean;
    notes: string | null;
  }[];
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const change of input.changes) {
      await tx.persons.update({
        where: { id_person: change.personId },
        data: { id_profession: change.newProfessionId },
      });

      await tx.person_records.create({
        data: {
          id_person: change.personId,
          id_user: input.actorUserId,
          prr_event_type: "profession_changed",
          prr_notes: change.notes,
          prr_old_value: toPrismaJsonValue({ id_profession: change.oldProfessionId }),
          prr_new_value: toPrismaJsonValue({
            id_profession: change.newProfessionId,
            is_temporary: change.isTemporary,
          }),
        },
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: input.campId,
          evt_entity: "persons",
          evt_entity_id: change.personId,
          evt_action: "profession_changed",
          evt_old_value: toPrismaJsonValue({ id_profession: change.oldProfessionId }),
          evt_new_value: toPrismaJsonValue({
            id_profession: change.newProfessionId,
            is_temporary: change.isTemporary,
          }),
          evt_description: change.notes ?? (change.isTemporary ? "Temporary profession reassignment" : "Profession reverted"),
        },
      });
    }
  });
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
