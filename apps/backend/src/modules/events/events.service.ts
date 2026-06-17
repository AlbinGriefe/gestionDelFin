import { AppError } from "../../shared/errors/app-error.js";
import { canAccessCamp, isSuperAdminRole } from "../../shared/auth/roles.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { eventsRepository } from "./events.repository.js";
import type { EventListFilters, EventSummary } from "./events.types.js";

function mapEvent(record: {
  id_event: number;
  evt_entity: string;
  evt_entity_id: number | null;
  evt_action: string;
  evt_description: string | null;
  evt_old_value: unknown;
  evt_new_value: unknown;
  id_camp: number | null;
  id_user: number | null;
  evt_created_at: Date;
}): EventSummary {
  return {
    id: record.id_event,
    entity: record.evt_entity,
    entityId: record.evt_entity_id,
    action: record.evt_action,
    description: record.evt_description,
    oldValue: record.evt_old_value,
    newValue: record.evt_new_value,
    campId: record.id_camp,
    userId: record.id_user,
    createdAt: record.evt_created_at.toISOString(),
  };
}

export class EventsService {
  async listEvents(filters: EventListFilters, actor: AuthenticatedUser) {
    const resolvedCampId = isSuperAdminRole(actor.roleName)
      ? filters.campId
      : (filters.campId ?? actor.campId);

    if (resolvedCampId && !canAccessCamp(actor, resolvedCampId)) {
      throw new AppError(
        403,
        "You can only access events from your assigned camp.",
        "EVENT_FORBIDDEN_CAMP_SCOPE",
      );
    }

    const result = await eventsRepository.listEvents({
      ...filters,
      campId: resolvedCampId,
    });

    return {
      items: result.items.map(mapEvent),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        campId: resolvedCampId,
      },
    };
  }

  async getEventById(
    eventId: number,
    actor: AuthenticatedUser,
  ): Promise<EventSummary> {
    const event = await eventsRepository.findEventById(eventId);

    if (!event) {
      throw new AppError(404, "Event not found.", "EVENT_NOT_FOUND");
    }

    if (event.id_camp !== null && !canAccessCamp(actor, event.id_camp)) {
      throw new AppError(
        403,
        "You can only access events from your assigned camp.",
        "EVENT_FORBIDDEN_CAMP_SCOPE",
      );
    }

    return mapEvent(event);
  }
}

export const eventsService = new EventsService();
