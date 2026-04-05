import type { camps_cmp_status } from "../../generated/prisma/client.js";
import { Prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  campsRepository,
  type CampDetailRecord,
  type CampSummaryRecord,
} from "./camps.repository.js";
import type {
  CampAuditEventInput,
  CampDetail,
  CampListFilters,
  CampSummary,
  CampWriteInput,
} from "./camps.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLocaleLowerCase() === "administrador sistema";
}

function serializeCampState(input: {
  cmp_name: string;
  cmp_location: string;
  cmp_latitude: number | null;
  cmp_longitude: number | null;
  cmp_max_capacity: number;
  cmp_status: camps_cmp_status;
}) {
  return {
    cmp_name: input.cmp_name,
    cmp_location: input.cmp_location,
    cmp_latitude: input.cmp_latitude,
    cmp_longitude: input.cmp_longitude,
    cmp_max_capacity: input.cmp_max_capacity,
    cmp_status: input.cmp_status,
  };
}

function toNullableNumber(value: Prisma.Decimal | number | string | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  return Number(value);
}

function countAcceptedPersons(record: { persons: Array<{ prn_is_accepted: boolean }> }) {
  return record.persons.filter((person) => person.prn_is_accepted).length;
}

function calculateUtilizationRate(activePersons: number, capacity: number) {
  if (capacity <= 0) {
    return 0;
  }

  return Number(((activePersons / capacity) * 100).toFixed(2));
}

function mapCampSummary(record: CampSummaryRecord): CampSummary {
  const activePersons = record.persons.length;
  const availableSpots = Math.max(0, record.cmp_max_capacity - activePersons);

  return {
    id: record.id_camp,
    name: record.cmp_name,
    location: record.cmp_location,
    latitude: toNullableNumber(record.cmp_latitude),
    longitude: toNullableNumber(record.cmp_longitude),
    maxCapacity: record.cmp_max_capacity,
    status: record.cmp_status,
    occupancy: {
      activePersons,
      utilizationRate: calculateUtilizationRate(
        activePersons,
        record.cmp_max_capacity,
      ),
      availableSpots,
    },
    counts: {
      activeUsers: record.users.length,
      professions: record._count.professions,
      storageItems: record._count.storage,
      expeditions: record._count.expeditions,
      outgoingTransfers: record._count.transfers_transfers_id_origin_campTocamps,
      incomingTransfers: record._count.transfers_transfers_id_destiny_campTocamps,
    },
    createdAt: record.cmp_created_at.toISOString(),
    updatedAt: record.cmp_updated_at.toISOString(),
  };
}

function mapCampDetail(
  record: CampDetailRecord,
  recentEvents: Awaited<ReturnType<typeof campsRepository.listCampEvents>>,
): CampDetail {
  const summary = mapCampSummary(record);
  const inventoryQuantityTotal = record.storage.reduce(
    (total, item) => total + Number(item.stg_quantity),
    0,
  );
  const inventoryBelowMinimumCount = record.storage.filter(
    (item) => Number(item.stg_quantity) < Number(item.stg_min_quantity),
  ).length;
  const activeExpeditions = record.expeditions.filter((expedition) =>
    ["planned", "in_progress"].includes(expedition.exe_state),
  ).length;
  const pendingTransfers = [
    ...record.transfers_transfers_id_origin_campTocamps,
    ...record.transfers_transfers_id_destiny_campTocamps,
  ].filter((transfer) =>
    ["pending", "accepted", "scheduled", "in_transit"].includes(
      transfer.tfs_state,
    ),
  ).length;

  return {
    ...summary,
    metrics: {
      acceptedPersons: countAcceptedPersons(record),
      activeSessions: record.user_sessions.length,
      inventoryQuantityTotal: Number(inventoryQuantityTotal.toFixed(2)),
      inventoryBelowMinimumCount,
      activeExpeditions,
      pendingTransfers,
    },
    recentUsers: record.users.map((user) => ({
      id: user.id_user,
      username: user.usr_username,
      roleName: user.roles.rls_name,
      isActive: user.usr_is_active,
    })),
    recentEvents: recentEvents.map((event) => ({
      id: event.id_event,
      action: event.evt_action,
      description: event.evt_description,
      createdAt: event.evt_created_at.toISOString(),
      actorUserId: event.id_user,
      oldValue: event.evt_old_value,
      newValue: event.evt_new_value,
    })),
  };
}

function validateStatusTransition(input: {
  currentStatus: camps_cmp_status;
  nextStatus: camps_cmp_status;
  activePersons: number;
  activeUsers: number;
}) {
  if (input.currentStatus === input.nextStatus) {
    return;
  }

  if (
    ["destroyed", "abandoned"].includes(input.nextStatus) &&
    (input.activePersons > 0 || input.activeUsers > 0)
  ) {
    throw new AppError(
      400,
      "A camp cannot be marked as destroyed or abandoned while it still has active people or active users assigned.",
      "CAMP_STATUS_TRANSITION_BLOCKED",
    );
  }
}

export class CampsService {
  async listCamps(filters: CampListFilters, actor: AuthenticatedUser) {
    const search = filters.search?.trim();
    const where = {
      ...(filters.status ? { cmp_status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { cmp_name: { contains: search } },
              { cmp_location: { contains: search } },
            ],
          }
        : {}),
      ...(!isSystemAdministrator(actor) ? { id_camp: actor.campId } : {}),
    };

    const result = await campsRepository.listCamps({
      where,
      filters,
    });

    return {
      items: result.items.map(mapCampSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        search,
      },
    };
  }

  async getCampById(campId: number, actor: AuthenticatedUser) {
    const camp = await campsRepository.findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "CAMP_NOT_FOUND");
    }

    if (!isSystemAdministrator(actor) && actor.campId !== campId) {
      throw new AppError(
        403,
        "You can only access your assigned camp.",
        "CAMP_FORBIDDEN_SCOPE",
      );
    }

    const recentEvents = await campsRepository.listCampEvents(campId);
    return mapCampDetail(camp, recentEvents);
  }

  async createCamp(input: CampWriteInput, actor: AuthenticatedUser) {
    const name = input.cmp_name?.trim();
    const location = input.cmp_location?.trim();

    if (!name) {
      throw new AppError(400, "Camp name is required.", "CAMP_NAME_REQUIRED");
    }

    if (!location) {
      throw new AppError(
        400,
        "Camp location is required.",
        "CAMP_LOCATION_REQUIRED",
      );
    }

    const existingCamp = await campsRepository.findCampByName(name);

    if (existingCamp) {
      throw new AppError(
        409,
        "A camp with that name already exists.",
        "CAMP_NAME_ALREADY_EXISTS",
      );
    }

    const campData = {
      cmp_name: name,
      cmp_location: location,
      cmp_latitude:
        input.cmp_latitude === undefined || input.cmp_latitude === null
          ? null
          : Number(input.cmp_latitude),
      cmp_longitude:
        input.cmp_longitude === undefined || input.cmp_longitude === null
          ? null
          : Number(input.cmp_longitude),
      cmp_max_capacity: input.cmp_max_capacity ?? 0,
      cmp_status: input.cmp_status ?? "active",
    };

    const createdCamp = await campsRepository.createCamp({
      data: campData,
      auditEvents: [
        {
          action: "created",
          actorUserId: actor.id,
          description: "Camp created.",
          newValue: serializeCampState(campData),
        },
      ],
    });

    const recentEvents = await campsRepository.listCampEvents(createdCamp.id_camp);
    return mapCampDetail(createdCamp, recentEvents);
  }

  async updateCamp(campId: number, input: CampWriteInput, actor: AuthenticatedUser) {
    const existingCamp = await campsRepository.findCampById(campId);

    if (!existingCamp) {
      throw new AppError(404, "Camp not found.", "CAMP_NOT_FOUND");
    }

    const nextState = {
      cmp_name: input.cmp_name?.trim() ?? existingCamp.cmp_name,
      cmp_location: input.cmp_location?.trim() ?? existingCamp.cmp_location,
      cmp_latitude:
        input.cmp_latitude !== undefined
          ? input.cmp_latitude === null
            ? null
            : Number(input.cmp_latitude)
          : toNullableNumber(existingCamp.cmp_latitude),
      cmp_longitude:
        input.cmp_longitude !== undefined
          ? input.cmp_longitude === null
            ? null
            : Number(input.cmp_longitude)
          : toNullableNumber(existingCamp.cmp_longitude),
      cmp_max_capacity:
        input.cmp_max_capacity ?? existingCamp.cmp_max_capacity,
      cmp_status: input.cmp_status ?? existingCamp.cmp_status,
    };

    const existingCampWithName = await campsRepository.findCampByName(
      nextState.cmp_name,
    );

    if (existingCampWithName && existingCampWithName.id_camp !== campId) {
      throw new AppError(
        409,
        "A camp with that name already exists.",
        "CAMP_NAME_ALREADY_EXISTS",
      );
    }

    const activePersons = existingCamp.persons.length;
    const activeUsers = existingCamp.users.length;

    if (nextState.cmp_max_capacity < activePersons) {
      throw new AppError(
        400,
        "Camp capacity cannot be lower than the current number of active people.",
        "CAMP_CAPACITY_TOO_LOW",
      );
    }

    validateStatusTransition({
      currentStatus: existingCamp.cmp_status,
      nextStatus: nextState.cmp_status,
      activePersons,
      activeUsers,
    });

    const updateData: Record<string, unknown> = {};
    const currentState = {
      cmp_name: existingCamp.cmp_name,
      cmp_location: existingCamp.cmp_location,
      cmp_latitude: toNullableNumber(existingCamp.cmp_latitude),
      cmp_longitude: toNullableNumber(existingCamp.cmp_longitude),
      cmp_max_capacity: existingCamp.cmp_max_capacity,
      cmp_status: existingCamp.cmp_status,
    };

    for (const [key, value] of Object.entries(nextState)) {
      if (currentState[key as keyof typeof currentState] !== value) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      const recentEvents = await campsRepository.listCampEvents(campId);
      return mapCampDetail(existingCamp, recentEvents);
    }

    const auditEvents: CampAuditEventInput[] = [
      {
        action: "updated",
        actorUserId: actor.id,
        description: "Camp updated.",
        oldValue: serializeCampState(currentState),
        newValue: serializeCampState(nextState),
      },
    ];

    if (existingCamp.cmp_status !== nextState.cmp_status) {
      auditEvents.push({
        action: "status_changed",
        actorUserId: actor.id,
        description: "Camp status changed.",
        oldValue: {
          cmp_status: existingCamp.cmp_status,
        },
        newValue: {
          cmp_status: nextState.cmp_status,
        },
      });
    }

    const updatedCamp = await campsRepository.updateCamp({
      campId,
      data: updateData,
      auditEvents,
    });

    const recentEvents = await campsRepository.listCampEvents(campId);
    return mapCampDetail(updatedCamp, recentEvents);
  }
}

export const campsService = new CampsService();
