import { createContext } from "react";
import type {
    SessionListFilters,
    SessionList,
    SessionRevokeInput,
    SessionSummary
} from "../types/sessions.types";

export interface SessionsContextType {
    sessions: SessionSummary[];
    pagination: SessionList["pagination"] | null;
    filters: SessionListFilters;
    appliedFilters: SessionList["appliedFilters"] | null;
    loading: boolean;
    setFilters: (filters: SessionListFilters) => void;
    getSessionById: (sessionId: number) => Promise<SessionSummary>;
    getCurrentSession: () => Promise<SessionSummary>;
    revokeSession: (sessionId: number, data: SessionRevokeInput) => Promise<SessionSummary>;
    loadSessions: () => Promise<void>;
}

export const SessionsContext = createContext<SessionsContextType | null>(null);