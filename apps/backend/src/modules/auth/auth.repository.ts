import prisma, { Prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";

export const authUserInclude = {
  camps: true,
  persons: true,
  roles: true,
} satisfies Prisma.usersInclude;

export type AuthUserRecord = Prisma.usersGetPayload<{
  include: typeof authUserInclude;
}>;

type SignOutReason = "manual" | "timeout" | "forced" | "camp_change" | "security";

export class AuthRepository {
  async findUserByIdentity(identity: string) {
    return prisma.users.findFirst({
      where: {
        usr_is_active: true,
        OR: [{ usr_username: identity }, { usr_email: identity }],
      },
      include: authUserInclude,
    });
  }

  async findUserById(userId: number) {
    return prisma.users.findUnique({
      where: { id_user: userId },
      include: authUserInclude,
    });
  }

  async createSession(input: {
    userId: number;
    campId: number;
    sessionToken: string;
    ipAddress: string;
    expiresAt: Date;
  }) {
    const now = new Date();

    return prisma.user_sessions.create({
      data: {
        id_user: input.userId,
        id_camp: input.campId,
        uss_token: input.sessionToken,
        uss_ip: input.ipAddress,
        uss_login: now,
        uss_last_update: now,
        uss_expired_session: input.expiresAt,
        uss_is_expired: false,
      },
    });
  }

  async findSessionByToken(sessionToken: string) {
    return prisma.user_sessions.findUnique({
      where: { uss_token: sessionToken },
    });
  }

  async touchSession(sessionId: number, nextExpiry: Date) {
    return prisma.user_sessions.update({
      where: { id_user_session: sessionId },
      data: {
        uss_last_update: new Date(),
        uss_expired_session: nextExpiry,
        uss_is_expired: false,
      },
    });
  }

  async expireSessionByToken(sessionToken: string) {
    return prisma.user_sessions.updateMany({
      where: {
        uss_token: sessionToken,
        uss_is_expired: false,
      },
      data: {
        uss_is_expired: true,
        uss_last_update: new Date(),
        uss_expired_session: new Date(),
        uss_sign_out_reason: "manual",
      },
    });
  }

  async expireSessionById(sessionId: number, reason: SignOutReason) {
    return prisma.user_sessions.update({
      where: { id_user_session: sessionId },
      data: {
        uss_is_expired: true,
        uss_last_update: new Date(),
        uss_expired_session: new Date(),
        uss_sign_out_reason: reason,
      },
    });
  }

  async getSessionTimeoutMinutes() {
    const setting = await prisma.system_settings.findUnique({
      where: { sts_key: "session_timeout_minutes" },
    });

    const configuredTimeout = Number(setting?.sts_value);

    if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
      return configuredTimeout;
    }

    return env.SESSION_TIMEOUT_MINUTES;
  }
}

export const authRepository = new AuthRepository();
