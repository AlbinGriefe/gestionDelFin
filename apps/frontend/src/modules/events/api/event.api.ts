import type {
  EventListFilters,
  EventsList,
  EventSummary,
} from "../types/events.types";
import { httpClient } from "../../../shared/api/httpClient";

async function listEvents(filters: EventListFilters) {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.dateFrom) params.append("dateFrom", String(filters.dateFrom));
  if (filters?.campId) params.append("campId", String(filters.campId));
  if (filters?.dateTo) params.append("dateTo", String(filters.dateTo));
  if (filters?.entity) params.append("entity", String(filters.entity));
  if (filters?.entityId) params.append("entityId", String(filters.entityId));
  if (filters?.userId) params.append("userId", String(filters.userId));

  return httpClient<EventsList>(`/events?${params.toString()}`);
}

async function getEventById(eventId: number) {
  return httpClient<EventSummary>(`/events/${eventId}`);
}

export const eventsApi = {
  listEvents,
  getEventById,
};
