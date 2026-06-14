import type {
  SessionListFilters,
  SessionList,
  SessionRevokeInput,
  SessionSummary,
} from "../types/sessions.types";

import { httpClient } from "../../../shared/api/httpClient";

async function listSessions(filters: SessionListFilters) {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.campId) params.append("campId", String(filters.campId));
  if (filters?.active) params.append("active", String(filters.active));
  if (filters?.reason) params.append("reason", filters.reason);
  if (filters?.userId) params.append("userId", String(filters.userId));

  return httpClient<SessionList>(`/sessions?${params.toString()}`);
}

async function getSessionById(sessionId: number) {
  return httpClient<SessionSummary>(`/sessions/${sessionId}`);
}

async function getCurrentSession() {
  return httpClient<SessionSummary>("/sessions/current");
}

async function revokeSession(sessionId: number, data: SessionRevokeInput) {
  return httpClient<SessionSummary>(`/sessions/${sessionId}/revoke`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export const sessionsApi = {
  listSessions,
  getSessionById,
  getCurrentSession,
  revokeSession,
};
