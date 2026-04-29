import { useState, useCallback, useEffect } from "react";
import { EventsContext } from "./events.context";
import { eventsApi } from "../api/event.api";

import type {
    EventSummary,
    EventsList,
    EventListFilters,
} from "../types/events.types";

export function EventsProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [pagination, setPagination] = useState<EventsList["pagination"] | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<EventsList["appliedFilters"] | null>(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<EventListFilters>({
        page: 1,
        pageSize: 20,
    });

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await eventsApi.listEvents(filters);
            setEvents(data.items);
            setPagination(data.pagination);
            setAppliedFilters(data.appliedFilters);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const getEventById = async (eventId: number): Promise<EventSummary> => {
        return eventsApi.getEventById(eventId);
    };

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    return (
        <EventsContext.Provider
            value={{
                events,
                filters,
                appliedFilters,
                pagination,
                loading,
                setFilters,
                loadEvents,
                getEventById,
            }}
        >
            {children}
        </EventsContext.Provider>
    );
}