import prisma, { Prisma } from "../../lib/prisma.js";
import type { CampAuditEventInput, CampListFilters } from "./camps.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

const campSummaryInclude = {
  _count: {
    select: {
      persons: true,
      users: true,
      professions: true,
      storage: true,
      expeditions: true,
      transfers_transfers_id_origin_campTocamps: true,
      transfers_transfers_id_destiny_campTocamps: true,
    },
  },
  persons: {
    where: {
      prn_is_active: true,
    },
    select: {
      id_person: true,
      prn_is_accepted: true,
    },
  },
  users: {
    where: {
      usr_is_active: true,
    },
    select: {
      id_user: true,
    },
  },
} satisfies Prisma.campsInclude;

const campDetailInclude = {
  ...campSummaryInclude,
  user_sessions: {
    where: {
      uss_is_expired: false,
      uss_expired_session: {
        gt: new Date(),
      },
    },
    select: {
      id_user_session: true,
    },
  },
  storage: {
    select: {
      id_storage: true,
      stg_quantity: true,
      stg_min_quantity: true,
    },
  },
  expeditions: {
    select: {
      id_expedition: true,
      exe_state: true,
    },
  },
  transfers_transfers_id_origin_campTocamps: {
    select: {
      id_transfer: true,
      tfs_state: true,
    },
  },
  transfers_transfers_id_destiny_campTocamps: {
    select: {
      id_transfer: true,
      tfs_state: true,
    },
  },
  users: {
    take: 5,
    orderBy: {
      usr_updated_at: "desc",
    },
    select: {
      id_user: true,
      usr_username: true,
      usr_is_active: true,
      roles: {
        select: {
          rls_name: true,
        },
      },
    },
  },
} satisfies Prisma.campsInclude;

export type CampSummaryRecord = Prisma.campsGetPayload<{
  include: typeof campSummaryInclude;
}>;

export type CampDetailRecord = Prisma.campsGetPayload<{
  include: typeof campDetailInclude;
}>;

export class CampsRepository {
  async listCamps(input: {
    where: Prisma.campsWhereInput;
    filters: CampListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.camps.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [{ cmp_name: "asc" }],
        include: campSummaryInclude,
      }),
      prisma.camps.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: {
        id_camp: campId,
      },
      include: campDetailInclude,
    });
  }

  async findCampByName(name: string) {
    return prisma.camps.findUnique({
      where: {
        cmp_name: name,
      },
    });
  }

  async listCampEvents(campId: number) {
    return prisma.events.findMany({
      where: {
        id_camp: campId,
        evt_entity: "camps",
        evt_entity_id: campId,
      },
      orderBy: {
        evt_created_at: "desc",
      },
      take: 10,
    });
  }

  async createCamp(input: {
    data: Prisma.campsUncheckedCreateInput;
    auditEvents: CampAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const camp = await tx.camps.create({
        data: input.data,
      });

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: camp.id_camp,
            evt_entity: "camps",
            evt_entity_id: camp.id_camp,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.camps.findUniqueOrThrow({
        where: {
          id_camp: camp.id_camp,
        },
        include: campDetailInclude,
      });
    });
  }

  async updateCamp(input: {
    campId: number;
    data: Prisma.campsUncheckedUpdateInput;
    auditEvents: CampAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      if (Object.keys(input.data).length > 0) {
        await tx.camps.update({
          where: {
            id_camp: input.campId,
          },
          data: input.data,
        });
      }

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: input.campId,
            evt_entity: "camps",
            evt_entity_id: input.campId,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.camps.findUniqueOrThrow({
        where: {
          id_camp: input.campId,
        },
        include: campDetailInclude,
      });
    });
  }
}

export const campsRepository = new CampsRepository();
