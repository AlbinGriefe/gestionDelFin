import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  sessionsRepository,
  type SessionRecord,
} from "./sessions.repository.js";
import type {
  SessionListFilters,
  SessionRevokeInput,
  SessionSummary,
} from "./sessions.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLocaleLowerCase() === "administrador sistema";
}

function mapSession(
  record: SessionRecord,
  currentSessionToken: string,
): SessionSummary {
  return {
    id: record.id_user_session,
    user: {
      id: record.users.id_user,
      username: record.users.usr_username,
      email: record.users.usr_email,
      roleName: record.users.roles.rls_name,
    },
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
    },
    ipAddress: record.uss_ip,
    loginAt: record.uss_login.toISOString(),
    lastUpdateAt: record.uss_last_update.toISOString(),
    expiresAt: record.uss_expired_session.toISOString(),
    isExpired: record.uss_is_expired,
    signOutReason: record.uss_sign_out_reason,
    isCurrent: record.uss_token === currentSessionToken,
  };
}

function ensureSessionVisibility(
  actor: AuthenticatedUser,
  session: SessionRecord,
) {
  if (isSystemAdministrator(actor)) {
    return;
  }

  if (session.id_user !== actor.id) {
    throw new AppError(
      403,
      "You can only access your own sessions.",
      "SESSIONS_FORBIDDEN_SCOPE",
    );
  }
}

export class SessionsService {
  async listSessions(filters: SessionListFilters, actor: AuthenticatedUser) {
    const search = filters.search?.trim();
    const where = {
      ...(isSystemAdministrator(actor)
        ? {
            ...(filters.userId ? { id_user: filters.userId } : {}),
            ...(filters.campId ? { id_camp: filters.campId } : {}),
          }
        : {
            id_user: actor.id,
          }),
      ...(filters.active !== undefined
        ? { uss_is_expired: !filters.active }
        : {}),
      ...(filters.reason ? { uss_sign_out_reason: filters.reason } : {}),
      ...(search
        ? {
            OR: [
              { uss_ip: { contains: search } },
              {
                users: {
                  is: {
                    usr_username: { contains: search },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const result = await sessionsRepository.listSessions({
      where,
      filters,
    });

    return {
      items: result.items.map((session) =>
        mapSession(session, actor.sessionId),
      ),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        userId: isSystemAdministrator(actor) ? filters.userId : actor.id,
        campId: isSystemAdministrator(actor) ? filters.campId : undefined,
        search,
      },
    };
  }

  async getCurrentSession(actor: AuthenticatedUser) {
    const session = await sessionsRepository.findSessionByToken(
      actor.sessionId,
    );

    if (!session) {
      throw new AppError(404, "Session not found.", "SESSION_NOT_FOUND");
    }

    return mapSession(session, actor.sessionId);
  }

  async getSessionById(sessionId: number, actor: AuthenticatedUser) {
    const session = await sessionsRepository.findSessionById(sessionId);

    if (!session) {
      throw new AppError(404, "Session not found.", "SESSION_NOT_FOUND");
    }

    ensureSessionVisibility(actor, session);
    return mapSession(session, actor.sessionId);
  }

  async revokeSession(
    sessionId: number,
    input: SessionRevokeInput,
    actor: AuthenticatedUser,
  ) {
    const session = await sessionsRepository.findSessionById(sessionId);

    if (!session) {
      throw new AppError(404, "Session not found.", "SESSION_NOT_FOUND");
    }

    ensureSessionVisibility(actor, session);

    if (session.uss_is_expired) {
      return mapSession(session, actor.sessionId);
    }

    const reason = isSystemAdministrator(actor)
      ? (input.reason ?? "forced")
      : "manual";

    if (
      !isSystemAdministrator(actor) &&
      input.reason &&
      input.reason !== "manual"
    ) {
      throw new AppError(
        403,
        "You can only manually revoke your own sessions.",
        "SESSIONS_INVALID_REVOKE_REASON",
      );
    }

    const updatedSession = await sessionsRepository.revokeSession({
      sessionId,
      reason,
      actorUserId: actor.id,
    });

    return mapSession(updatedSession, actor.sessionId);
  }
}

export const sessionsService = new SessionsService();
