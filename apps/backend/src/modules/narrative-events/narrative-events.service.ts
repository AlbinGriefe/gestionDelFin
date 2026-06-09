import prisma from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type {
  narrative_events_nre_status,
  narrative_events_nre_type,
} from "../../generated/prisma/client.js";

function isAdmin(actor: AuthenticatedUser) {
  return actor.roleName.trim().toLowerCase() === "administrador sistema";
}

function mapEvent(record: Awaited<ReturnType<typeof findEvent>>) {
  if (!record) return null;
  return {
    id: record.id_narrative_event,
    camp: { id: record.camps.id_camp, name: record.camps.cmp_name },
    type: record.nre_type,
    status: record.nre_status,
    sourceType: record.nre_source_type,
    referenceId: record.nre_reference_id,
    probability: record.nre_probability
      ? Number(record.nre_probability)
      : null,
    roll: record.nre_roll ? Number(record.nre_roll) : null,
    participants: record.nre_participants,
    effects: record.nre_effects,
    description: record.nre_description,
    createdAt: record.nre_created_at.toISOString(),
  };
}

function findEvent(eventId: number) {
  return prisma.narrative_events.findUnique({
    where: { id_narrative_event: eventId },
    include: { camps: true },
  });
}

export class NarrativeEventsService {
  async list(
    input: {
      page: number;
      pageSize: number;
      campId?: number;
      type?: narrative_events_nre_type;
      status?: narrative_events_nre_status;
    },
    actor: AuthenticatedUser,
  ) {
    const campId = isAdmin(actor) ? input.campId : actor.campId;
    const where = {
      ...(campId ? { id_camp: campId } : {}),
      ...(input.type ? { nre_type: input.type } : {}),
      ...(input.status ? { nre_status: input.status } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.narrative_events.findMany({
        where,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { nre_created_at: "desc" },
        include: { camps: true },
      }),
      prisma.narrative_events.count({ where }),
    ]);
    return {
      items: items.map((item) => mapEvent(item)!),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      },
    };
  }

  async getById(eventId: number, actor: AuthenticatedUser) {
    const event = await findEvent(eventId);
    if (!event) {
      throw new AppError(
        404,
        "Narrative event not found.",
        "NARRATIVE_EVENT_NOT_FOUND",
      );
    }
    if (!isAdmin(actor) && event.id_camp !== actor.campId) {
      throw new AppError(
        403,
        "Narrative event is outside your camp.",
        "NARRATIVE_EVENT_FORBIDDEN",
      );
    }
    return mapEvent(event);
  }
}

export const narrativeEventsService = new NarrativeEventsService();
