import { useState, useCallback, useEffect } from "react";
import { SessionsContext } from "./sessions.context";
import { sessionsApi } from "../api/session.api";

import type {
  SessionSummary,
  SessionList,
  SessionListFilters,
  SessionRevokeInput,
} from "../types/sessions.types";

export function SessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [pagination, setPagination] = useState<
    SessionList["pagination"] | null
  >(null);
  const [appliedFilters, setAppliedFilters] = useState<
    SessionList["appliedFilters"] | null
  >(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<SessionListFilters>({
    page: 1,
    pageSize: 20,
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionsApi.listSessions(filters);
      setSessions(data.items);
      setPagination(data.pagination);
      setAppliedFilters(data.appliedFilters);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getSessionById = async (sessionId: number): Promise<SessionSummary> => {
    return sessionsApi.getSessionById(sessionId);
  };

  const getCurrentSession = async (): Promise<SessionSummary> => {
    return sessionsApi.getCurrentSession();
  };

  const revokeSession = async (
    sessionId: number,
    data: SessionRevokeInput,
  ): Promise<SessionSummary> => {
    const result = await sessionsApi.revokeSession(sessionId, data);

    await loadSessions();

    return result;
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        pagination,
        filters,
        appliedFilters,
        loading,
        setFilters,
        loadSessions,
        getSessionById,
        getCurrentSession,
        revokeSession,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}
