import type { user_sessions_uss_sign_out_reason } from "../../generated/prisma/client.js";

export interface SessionListFilters {
  page: number;
  pageSize: number;
  userId?: number;
  campId?: number;
  active?: boolean;
  reason?: user_sessions_uss_sign_out_reason;
  search?: string;
}

export interface SessionRevokeInput {
  reason?: "manual" | "forced" | "security";
}

export interface SessionSummary {
  id: number;
  user: {
    id: number;
    username: string;
    email: string | null;
    roleName: string;
  };
  camp: {
    id: number;
    name: string;
  };
  ipAddress: string;
  loginAt: string;
  lastUpdateAt: string;
  expiresAt: string;
  isExpired: boolean;
  signOutReason: user_sessions_uss_sign_out_reason;
  isCurrent: boolean;
}
