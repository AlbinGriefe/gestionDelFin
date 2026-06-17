import prisma, { Prisma } from "../../lib/prisma.js";
import type {
  SessionInvalidationPlan,
  UserAuditEventInput,
  UserListFilters,
} from "./users.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function buildActiveSessionsFilter() {
  return {
    uss_is_expired: false,
    uss_expired_session: {
      gt: new Date(),
    },
  };
}

const userSummaryInclude = {
  camps: true,
  roles: true,
  user_camp_memberships: {
    where: {
      ucm_is_active: true,
    },
    include: {
      camps: true,
    },
  },
  persons: {
    select: {
      id_person: true,
      prn_name: true,
      prn_lastname: true,
      prn_document_number: true,
      prn_admission_status: true,
      prn_is_active: true,
    },
  },
  user_sessions: {
    where: buildActiveSessionsFilter(),
    select: {
      id_user_session: true,
    },
  },
} satisfies Prisma.usersInclude;

const userDetailInclude = {
  ...userSummaryInclude,
  user_sessions: {
    where: buildActiveSessionsFilter(),
    take: 5,
    orderBy: {
      uss_last_update: "desc",
    },
    select: {
      id_user_session: true,
      uss_ip: true,
      uss_login: true,
      uss_last_update: true,
      uss_expired_session: true,
      id_camp: true,
    },
  },
} satisfies Prisma.usersInclude;

export type UserSummaryRecord = Prisma.usersGetPayload<{
  include: typeof userSummaryInclude;
}>;

export type UserDetailRecord = Prisma.usersGetPayload<{
  include: typeof userDetailInclude;
}>;

export class UsersRepository {
  async listCatalogs() {
    const [camps, roles, persons] = await prisma.$transaction([
      prisma.camps.findMany({
        where: {
          cmp_status: "active",
        },
        orderBy: {
          cmp_name: "asc",
        },
      }),
      prisma.roles.findMany({
        orderBy: {
          rls_name: "asc",
        },
      }),
      prisma.persons.findMany({
        where: {
          prn_is_active: true,
          prn_admission_status: "accepted",
          camps: {
            cmp_status: "active",
          },
        },
        orderBy: [{ prn_lastname: "asc" }, { prn_name: "asc" }],
        include: {
          camps: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
    ]);

    return {
      camps,
      roles,
      persons,
    };
  }

  async listUsers(input: {
    where: Prisma.usersWhereInput;
    filters: UserListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.users.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [{ usr_username: "asc" }],
        include: userSummaryInclude,
      }),
      prisma.users.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findUserById(userId: number) {
    return prisma.users.findUnique({
      where: {
        id_user: userId,
      },
      include: userDetailInclude,
    });
  }

  async findUserByUsername(username: string) {
    return prisma.users.findUnique({
      where: {
        usr_username: username,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.users.findUnique({
      where: {
        usr_email: email,
      },
    });
  }

  async findUserByPersonId(personId: number) {
    return prisma.users.findFirst({
      where: {
        id_person: personId,
      },
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: {
        id_camp: campId,
      },
    });
  }

  async findCampsByIds(campIds: number[]) {
    return prisma.camps.findMany({
      where: {
        id_camp: {
          in: campIds,
        },
      },
    });
  }

  async listActiveCamps() {
    return prisma.camps.findMany({
      where: {
        cmp_status: "active",
      },
      orderBy: {
        cmp_name: "asc",
      },
    });
  }

  async findRoleById(roleId: number) {
    return prisma.roles.findUnique({
      where: {
        id_role: roleId,
      },
    });
  }

  async findPersonById(personId: number) {
    return prisma.persons.findUnique({
      where: {
        id_person: personId,
      },
      include: {
        camps: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async listUserEvents(userId: number) {
    return prisma.events.findMany({
      where: {
        evt_entity: "users",
        evt_entity_id: userId,
      },
      orderBy: {
        evt_created_at: "desc",
      },
      take: 10,
    });
  }

  async createUser(input: {
    data: Prisma.usersUncheckedCreateInput;
    membershipCampIds: number[];
    auditEvents: UserAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: input.data,
      });

      for (const campId of input.membershipCampIds) {
        await tx.user_camp_memberships.upsert({
          where: {
            id_user_id_camp: {
              id_user: user.id_user,
              id_camp: campId,
            },
          },
          create: {
            id_user: user.id_user,
            id_camp: campId,
            ucm_is_active: true,
          },
          update: {
            ucm_is_active: true,
          },
        });
      }

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: input.data.id_camp,
            evt_entity: "users",
            evt_entity_id: user.id_user,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.users.findUniqueOrThrow({
        where: {
          id_user: user.id_user,
        },
        include: userDetailInclude,
      });
    });
  }

  async updateUser(input: {
    userId: number;
    currentCampId: number;
    data: Prisma.usersUncheckedUpdateInput;
    membershipCampIds?: number[];
    invalidateSessions?: SessionInvalidationPlan;
    auditEvents: UserAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      if (Object.keys(input.data).length > 0) {
        await tx.users.update({
          where: {
            id_user: input.userId,
          },
          data: input.data,
        });
      }

      if (input.invalidateSessions?.shouldInvalidate) {
        await tx.user_sessions.updateMany({
          where: {
            id_user: input.userId,
            uss_is_expired: false,
          },
          data: {
            uss_is_expired: true,
            uss_last_update: new Date(),
            uss_expired_session: new Date(),
            uss_sign_out_reason: input.invalidateSessions.reason,
          },
        });
      }

      if (input.membershipCampIds) {
        await tx.user_camp_memberships.updateMany({
          where: {
            id_user: input.userId,
            id_camp: {
              notIn: input.membershipCampIds,
            },
          },
          data: {
            ucm_is_active: false,
          },
        });

        for (const campId of input.membershipCampIds) {
          await tx.user_camp_memberships.upsert({
            where: {
              id_user_id_camp: {
                id_user: input.userId,
                id_camp: campId,
              },
            },
            create: {
              id_user: input.userId,
              id_camp: campId,
              ucm_is_active: true,
            },
            update: {
              ucm_is_active: true,
            },
          });
        }
      }

      const resolvedCampId =
        typeof input.data.id_camp === "number"
          ? input.data.id_camp
          : input.currentCampId;

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: resolvedCampId,
            evt_entity: "users",
            evt_entity_id: input.userId,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.users.findUniqueOrThrow({
        where: {
          id_user: input.userId,
        },
        include: userDetailInclude,
      });
    });
  }

  async touchUserLastLogin(userId: number, loggedAt: Date) {
    return prisma.users.update({
      where: {
        id_user: userId,
      },
      data: {
        usr_last_login_at: loggedAt,
      },
    });
  }
}

export const usersRepository = new UsersRepository();
