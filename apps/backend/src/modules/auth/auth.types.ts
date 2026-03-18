import type { JwtPayload } from "jsonwebtoken";

export interface LoginInput {
  identity: string;
  password: string;
}

export interface PublicUserProfile {
  id: number;
  username: string;
  email: string | null;
  roleName: string;
  campId: number;
  campName: string;
  personId: number | null;
}

export interface AuthenticatedUser extends PublicUserProfile {
  sessionId: string;
  sessionExpiresAt: string;
  sessionTimeoutMinutes: number;
}

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresInHours: number;
  sessionTimeoutMinutes: number;
  serverTime: string;
  user: PublicUserProfile;
}

export interface SessionConfig {
  serverTime: string;
  sessionTimeoutMinutes: number;
}

export interface AuthTokenPayload extends JwtPayload {
  sid: string;
  sub: string;
  roleName: string;
  campId: number;
  username: string;
}
