import { createContext } from "react";
import type { EventListFilters, EventsList, EventSummary } from "../types/events.types";

export interface EventsContextType {
    events: EventSummary[];
    filters: EventListFilters;
    appliedFilters: EventsList["appliedFilters"] | null;
    pagination: EventsList["pagination"] | null;
    loading: boolean;
    loadEvents: () => Promise<void>
    getEventById: (eventId: number) => Promise<EventSummary>;
    setFilters: (filters: EventListFilters) => void;
}

export const EventsContext = createContext<EventsContextType | null>(null);