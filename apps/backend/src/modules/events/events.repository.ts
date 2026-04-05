import prisma, { Prisma } from "../../lib/prisma.js";
import type { EventListFilters } from "./events.types.js";

export class EventsRepository {
  async listEvents(filters: EventListFilters) {
    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    const where: Prisma.eventsWhereInput = {
      ...(filters.campId !== undefined ? { id_camp: filters.campId } : {}),
      ...(filters.entity !== undefined ? { evt_entity: filters.entity } : {}),
      ...(filters.entityId !== undefined
        ? { evt_entity_id: filters.entityId }
        : {}),
      ...(filters.userId !== undefined ? { id_user: filters.userId } : {}),
      ...(filters.dateFrom !== undefined || filters.dateTo !== undefined
        ? {
            evt_created_at: {
              ...(filters.dateFrom !== undefined
                ? { gte: filters.dateFrom }
                : {}),
              ...(filters.dateTo !== undefined ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.events.findMany({
        where,
        skip,
        take,
        orderBy: { evt_created_at: "desc" },
      }),
      prisma.events.count({ where }),
    ]);

    return { items, total };
  }

  async findEventById(eventId: number) {
    return prisma.events.findUnique({
      where: { id_event: eventId },
    });
  }
}

export const eventsRepository = new EventsRepository();
