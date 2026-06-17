import type { user_sessions_uss_sign_out_reason } from "../../generated/prisma/client.js";

export interface UserListFilters {
  page: number;
  pageSize: number;
  search?: string;
  campId?: number;
  roleId?: number;
  personId?: number;
  active?: boolean;
}

export interface UserWriteInput {
  id_person?: number | null;
  id_role?: number;
  id_camp?: number;
  campIds?: number[];
  usr_username?: string;
  usr_email?: string | null;
  usr_password?: string;
  usr_is_active?: boolean;
}

export interface UsersCatalogs {
  camps: Array<{
    id: number;
    name: string;
    location: string;
    status: string;
  }>;
  roles: Array<{
    id: number;
    name: string;
    description: string;
    isSystemRole: boolean;
  }>;
  persons: Array<{
    id: number;
    fullName: string;
    campId: number;
    campName: string;
    documentNumber: string | null;
    linkedUsersCount: number;
  }>;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  camp: {
    id: number;
    name: string;
  };
  assignedCamps: Array<{
    id: number;
    name: string;
  }>;
  role: {
    id: number;
    name: string;
    description: string;
  };
  person: {
    id: number;
    fullName: string;
    documentNumber: string | null;
    isAccepted: boolean;
    isActive: boolean;
  } | null;
  activeSessionsCount: number;
}

export interface UserDetail extends UserSummary {
  recentSessions: Array<{
    id: number;
    ipAddress: string;
    loginAt: string;
    lastUpdateAt: string;
    expiresAt: string;
    campId: number;
  }>;
  recentEvents: Array<{
    id: number;
    action: string;
    description: string | null;
    createdAt: string;
    oldValue: unknown;
    newValue: unknown;
    actorUserId: number | null;
  }>;
}

export interface UserAuditEventInput {
  action: string;
  description?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  actorUserId?: number | null;
}

export interface SessionInvalidationPlan {
  shouldInvalidate: boolean;
  reason: user_sessions_uss_sign_out_reason;
}
