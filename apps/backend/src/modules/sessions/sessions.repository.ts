import prisma, { Prisma } from "../../lib/prisma.js";
import type { user_sessions_uss_sign_out_reason } from "../../generated/prisma/client.js";
import type { SessionListFilters } from "./sessions.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

const sessionInclude = {
  camps: true,
  users: {
    include: {
      roles: true,
    },
  },
} satisfies Prisma.user_sessionsInclude;

export type SessionRecord = Prisma.user_sessionsGetPayload<{
  include: typeof sessionInclude;
}>;

export class SessionsRepository {
  async listSessions(input: {
    where: Prisma.user_sessionsWhereInput;
    filters: SessionListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.user_sessions.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [{ uss_is_expired: "asc" }, { uss_last_update: "desc" }],
        include: sessionInclude,
      }),
      prisma.user_sessions.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findSessionById(sessionId: number) {
    return prisma.user_sessions.findUnique({
      where: {
        id_user_session: sessionId,
      },
      include: sessionInclude,
    });
  }

  async findSessionByToken(sessionToken: string) {
    return prisma.user_sessions.findUnique({
      where: {
        uss_token: sessionToken,
      },
      include: sessionInclude,
    });
  }

  async revokeSession(input: {
    sessionId: number;
    reason: user_sessions_uss_sign_out_reason;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.user_sessions.findUniqueOrThrow({
        where: {
          id_user_session: input.sessionId,
        },
        include: sessionInclude,
      });

      const now = new Date();
      const updatedSession = await tx.user_sessions.update({
        where: {
          id_user_session: input.sessionId,
        },
        data: {
          uss_is_expired: true,
          uss_last_update: now,
          uss_expired_session: now,
          uss_sign_out_reason: input.reason,
        },
        include: sessionInclude,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: session.id_camp,
          evt_entity: "user_sessions",
          evt_entity_id: session.id_user_session,
          evt_action: "revoked",
          evt_old_value: toPrismaJsonValue({
            uss_is_expired: session.uss_is_expired,
            uss_sign_out_reason: session.uss_sign_out_reason,
          }),
          evt_new_value: toPrismaJsonValue({
            uss_is_expired: true,
            uss_sign_out_reason: input.reason,
          }),
          evt_description: `Session revoked for user ${session.users.usr_username}.`,
        },
      });

      return updatedSession;
    });
  }
}

export const sessionsRepository = new SessionsRepository();
