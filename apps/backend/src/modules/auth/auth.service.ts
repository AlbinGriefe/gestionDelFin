import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import { env } from "../../lib/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { addMinutes, getServerNow } from "../../shared/helpers/server-time.js";
import type {
  AuthTokenPayload,
  AuthenticatedUser,
  LoginInput,
  LoginResult,
  PublicUserProfile,
  SessionConfig,
} from "./auth.types.js";
import { authRepository, type AuthUserRecord } from "./auth.repository.js";

function buildPublicUserProfile(user: AuthUserRecord): PublicUserProfile {
  return {
    id: user.id_user,
    username: user.usr_username,
    email: user.usr_email,
    roleName: user.roles.rls_name,
    campId: user.id_camp,
    campName: user.camps.cmp_name,
    personId: user.id_person,
  };
}

async function verifyPassword(rawPassword: string, storedPassword: string) {
  const matchesHash = await bcrypt
    .compare(rawPassword, storedPassword)
    .catch(() => false);

  if (matchesHash) {
    return true;
  }

  if (env.ALLOW_INSECURE_PLAINTEXT_PASSWORDS) {
    return rawPassword === storedPassword;
  }

  return false;
}

function signAccessToken(input: {
  userId: number;
  username: string;
  roleName: string;
  campId: number;
  sessionId: string;
}) {
  return jwt.sign(
    {
      sid: input.sessionId,
      roleName: input.roleName,
      campId: input.campId,
      username: input.username,
    },
    env.JWT_SECRET,
    {
      subject: String(input.userId),
      expiresIn: `${env.JWT_EXPIRES_IN_HOURS}h`,
    },
  );
}

function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string") {
      throw new AppError(401, "Invalid authentication token.", "INVALID_TOKEN");
    }

    if (!decoded.sub || typeof decoded.sub !== "string" || !decoded.sid) {
      throw new AppError(401, "Invalid authentication token.", "INVALID_TOKEN");
    }

    return decoded as AuthTokenPayload;

  } catch (error) {
    throw new AppError(401, "Invalid or expired token.", "INVALID_TOKEN");
  }
}

export class AuthService {
  async getSessionConfig(): Promise<SessionConfig> {
    return {
      serverTime: getServerNow().toISOString(),
      sessionTimeoutMinutes: await authRepository.getSessionTimeoutMinutes(),
    };
  }

  async login(input: LoginInput, ipAddress: string): Promise<LoginResult> {
    const user = await authRepository.findUserByIdentity(input.identity);

    if (!user) {
      throw new AppError(401, "Invalid credentials.", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.usr_password,
    );

    if (!passwordMatches) {
      throw new AppError(401, "Invalid credentials.", "INVALID_CREDENTIALS");
    }

    const sessionTimeoutMinutes =
      await authRepository.getSessionTimeoutMinutes();
    const sessionId = randomUUID();
    const now = getServerNow();
    const expiresAt = addMinutes(now, sessionTimeoutMinutes);

    await authRepository.createSession({
      userId: user.id_user,
      campId: user.id_camp,
      sessionToken: sessionId,
      ipAddress,
      expiresAt,
    });
    await authRepository.updateUserLastLogin(user.id_user, now);

    const accessToken = signAccessToken({
      userId: user.id_user,
      username: user.usr_username,
      roleName: user.roles.rls_name,
      campId: user.id_camp,
      sessionId,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresInHours: env.JWT_EXPIRES_IN_HOURS,
      sessionTimeoutMinutes,
      serverTime: now.toISOString(),
      user: buildPublicUserProfile(user),
    };
  }

  async resolveAuthenticatedUser(token: string): Promise<AuthenticatedUser> {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      throw new AppError(401, "Invalid authentication token.", "INVALID_TOKEN");
    }

    const session = await authRepository.findSessionByToken(payload.sid);

    if (!session) {
      throw new AppError(401, "Session not found.", "SESSION_NOT_FOUND");
    }

    const now = getServerNow();

    if (session.uss_is_expired || session.uss_expired_session <= now) {
      if (!session.uss_is_expired) {
        await authRepository.expireSessionById(
          session.id_user_session,
          "timeout",
        );
      }

      throw new AppError(
        401,
        "Session expired due to inactivity.",
        "SESSION_EXPIRED",
      );
    }

    const user = await authRepository.findUserById(userId);

    if (!user || !user.usr_is_active) {
      throw new AppError(401, "User is not active.", "USER_INACTIVE");
    }

    const sessionTimeoutMinutes =
      await authRepository.getSessionTimeoutMinutes();
    const nextExpiry = addMinutes(now, sessionTimeoutMinutes);

    await authRepository.touchSession(session.id_user_session, nextExpiry);

    return {
      ...buildPublicUserProfile(user),
      sessionId: payload.sid,
      sessionExpiresAt: nextExpiry.toISOString(),
      sessionTimeoutMinutes,
    };
  }

  async logout(sessionId: string) {
    await authRepository.expireSessionByToken(sessionId);

    return {
      serverTime: getServerNow().toISOString(),
      message: "Session closed successfully.",
    };
  }
}

export const authService = new AuthService();
