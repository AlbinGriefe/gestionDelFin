import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  calculateMissionProbability,
  rollPercentage,
  rollSucceeds,
} from "../operations/mission-probability.js";
import {
  transfersRepository,
  type TransferDetailRecord,
  type TransferSummaryRecord,
} from "./transfers.repository.js";
import type {
  TransferCatalogFilters,
  TransferCatalogs,
  TransferCreateInput,
  TransferDetail,
  TransferListFilters,
  TransferMissionOutcome,
  TransferSummary,
  TransferStateUpdateInput,
} from "./transfers.types.js";

function normalizeRoleName(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

function isSystemAdministrator(user: AuthenticatedUser) {
  return normalizeRoleName(user.roleName) === "administrador sistema";
}

function canManageTransfers(user: AuthenticatedUser) {
  const normalizedRole = normalizeRoleName(user.roleName);
  return (
    normalizedRole.includes("viaje") ||
    normalizedRole.includes("comunic") ||
    (normalizedRole.includes("gestion") && normalizedRole.includes("recurso"))
  );
}

function ensureTransferManager(user: AuthenticatedUser) {
  if (!canManageTransfers(user)) {
    throw new AppError(
      403,
      "You do not have permission to manage transfers.",
      "TRANSFERS_FORBIDDEN_ROLE",
    );
  }
}

function ensureCampScope(user: AuthenticatedUser, campId: number) {
  if (isSystemAdministrator(user)) {
    return;
  }

  if (user.campId !== campId) {
    throw new AppError(
      403,
      "You can only access transfers that involve your assigned camp.",
      "TRANSFERS_FORBIDDEN_CAMP_SCOPE",
    );
  }
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function buildTransferOutcome(
  transfer: TransferDetailRecord,
): TransferMissionOutcome {
  const participants = transfer.application_admission_person;
  const luckValues = participants.flatMap((participant) =>
    participant.persons.person_stats
      ? [participant.persons.person_stats.pst_luck]
      : [],
  );
  const professionBonusPoints = participants.reduce(
    (total, participant) =>
      total +
      Number(participant.persons.professions?.pfs_transfer_bonus_pp ?? 0),
    0,
  );
  const calculation = calculateMissionProbability({
    baseProbability: Number(
      transfer.camps_transfers_id_origin_campTocamps.camp_operational_rules
        ?.cor_transfer_success ?? 75,
    ),
    luckValues,
    professionBonusPoints,
  });
  const roll = rollPercentage();
  const successful = rollSucceeds(calculation.probability, roll);

  return {
    requestedState: "delivered",
    resolvedState: successful ? "delivered" : "failed",
    probability: calculation.probability,
    roll,
    baseProbability: calculation.baseProbability,
    luckBonusPoints: calculation.luckBonusPoints,
    professionBonusPoints: calculation.professionBonusPoints,
    failureEventType: successful
      ? undefined
      : rollPercentage() <= 50
        ? "zombie_attack"
        : "traveler_loss",
  };
}

function mapTransferSummary(record: TransferSummaryRecord): TransferSummary {
  return {
    id: record.id_transfer,
    type: record.tfs_type,
    state: record.tfs_state,
    comments: record.tfs_comments,
    requestedDate: record.tfs_requested_date.toISOString(),
    acceptedRequestDate:
      record.tfs_accepted_request_date?.toISOString() ?? null,
    shipmentDate: record.tfs_shipment_date?.toISOString() ?? null,
    arrivalDate: record.tfs_arrival_date?.toISOString() ?? null,
    returnDate: record.tfs_return_date?.toISOString() ?? null,
    originCamp: {
      id: record.camps_transfers_id_origin_campTocamps.id_camp,
      name: record.camps_transfers_id_origin_campTocamps.cmp_name,
    },
    destinyCamp: {
      id: record.camps_transfers_id_destiny_campTocamps.id_camp,
      name: record.camps_transfers_id_destiny_campTocamps.cmp_name,
    },
    requestedBy: {
      id: record.users_transfers_id_requested_by_userTousers.id_user,
      username: record.users_transfers_id_requested_by_userTousers.usr_username,
    },
    counts: {
      persons: record._count.application_admission_person,
      resources: record._count.application_admission_resources,
    },
  };
}

function mapTransferDetail(
  record: TransferDetailRecord,
  recentEvents: Awaited<
    ReturnType<typeof transfersRepository.listTransferEvents>
  >,
): TransferDetail {
  const summary = mapTransferSummary(record);

  return {
    ...summary,
    acceptedBy: record.users_transfers_id_accepted_by_userTousers
      ? {
          id: record.users_transfers_id_accepted_by_userTousers.id_user,
          username:
            record.users_transfers_id_accepted_by_userTousers.usr_username,
        }
      : null,
    approvedOriginBy: record.users_transfers_id_approved_origin_by_userTousers
      ? {
          id: record.users_transfers_id_approved_origin_by_userTousers.id_user,
          username:
            record.users_transfers_id_approved_origin_by_userTousers
              .usr_username,
        }
      : null,
    approvedDestinyBy: record.users_transfers_id_approved_destiny_by_userTousers
      ? {
          id: record.users_transfers_id_approved_destiny_by_userTousers.id_user,
          username:
            record.users_transfers_id_approved_destiny_by_userTousers
              .usr_username,
        }
      : null,
    persons: record.application_admission_person.map((personLine) => ({
      id: personLine.id_application_admission_person,
      personId: personLine.id_person,
      fullName: buildFullName(
        personLine.persons.prn_name,
        personLine.persons.prn_lastname,
      ),
      assignedRations: Number(personLine.aap_assigned_rations),
      departureConfirmed: personLine.aap_departure_confirmed,
      arrivalConfirmed: personLine.aap_arrival_confirmed,
      returnedToOrigin: personLine.aap_returned_to_origin,
      notes: personLine.aap_notes,
    })),
    resources: record.application_admission_resources.map((resourceLine) => ({
      id: resourceLine.id_application_admission_resource,
      resourceId: resourceLine.id_resource,
      name: resourceLine.resources.rss_name,
      unit: resourceLine.resources.rss_unit,
      quantity: Number(resourceLine.aar_quantity),
      confirmedLeaving: resourceLine.aar_confirmed_leaving,
      confirmedArriving: resourceLine.aar_confirmed_arriving,
      notes: resourceLine.aar_notes,
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

function ensureTransferVisibility(
  actor: AuthenticatedUser,
  transfer: TransferDetailRecord,
) {
  if (isSystemAdministrator(actor)) {
    return;
  }

  if (
    actor.campId !== transfer.id_origin_camp &&
    actor.campId !== transfer.id_destiny_camp
  ) {
    throw new AppError(
      403,
      "You can only access transfers that involve your assigned camp.",
      "TRANSFERS_FORBIDDEN_CAMP_SCOPE",
    );
  }
}

function ensureTransitionAuthority(
  actor: AuthenticatedUser,
  transfer: TransferDetailRecord,
  nextState: TransferStateUpdateInput["nextState"],
) {
  if (isSystemAdministrator(actor)) {
    return;
  }

  const destinyDrivenStates = [
    "accepted",
    "declined",
    "delivered",
    "failed",
    "returned",
    "completed",
  ];
  const originDrivenStates = ["scheduled", "in_transit", "cancelled"];

  if (
    destinyDrivenStates.includes(nextState) &&
    actor.campId !== transfer.id_destiny_camp
  ) {
    throw new AppError(
      403,
      "This state transition must be performed from the destiny camp.",
      "TRANSFERS_INVALID_DESTINY_AUTHORITY",
    );
  }

  if (
    originDrivenStates.includes(nextState) &&
    actor.campId !== transfer.id_origin_camp
  ) {
    throw new AppError(
      403,
      "This state transition must be performed from the origin camp.",
      "TRANSFERS_INVALID_ORIGIN_AUTHORITY",
    );
  }
}

function ensureValidTransition(
  currentState: TransferDetailRecord["tfs_state"],
  nextState: TransferStateUpdateInput["nextState"],
) {
  const allowedTransitions: Record<
    string,
    TransferStateUpdateInput["nextState"][]
  > = {
    pending: ["accepted", "declined", "cancelled"],
    accepted: ["scheduled", "cancelled"],
    scheduled: ["in_transit", "cancelled"],
    in_transit: ["delivered", "failed", "returned"],
    delivered: ["completed"],
    failed: [],
    declined: [],
    returned: [],
    completed: [],
    cancelled: [],
  };

  const nextStates = allowedTransitions[currentState] ?? [];

  if (!nextStates.includes(nextState)) {
    throw new AppError(
      400,
      `Transfer cannot move from ${currentState} to ${nextState}.`,
      "TRANSFERS_INVALID_STATE_TRANSITION",
    );
  }
}

export class TransfersService {
  async getCatalogs(
    filters: TransferCatalogFilters,
    actor: AuthenticatedUser,
  ): Promise<TransferCatalogs> {
    const originCampId =
      filters.originCampId ??
      (isSystemAdministrator(actor) ? undefined : actor.campId);

    if (originCampId) {
      ensureCampScope(actor, originCampId);
    }

    const result = await transfersRepository.listCatalogs({
      originCampId,
    });

    return {
      camps: result.camps.map((camp) => ({
        id: camp.id_camp,
        name: camp.cmp_name,
        status: camp.cmp_status,
      })),
      persons: result.persons.map((person) => ({
        id: person.id_person,
        fullName: buildFullName(person.prn_name, person.prn_lastname),
        documentNumber: person.prn_document_number,
        campId: person.id_camp,
      })),
      resources: result.resources.map((storage) => ({
        id: storage.resources.id_resource,
        name: storage.resources.rss_name,
        unit: storage.resources.rss_unit,
        availableQuantity: Number(storage.stg_quantity),
        campId: storage.id_camp,
        typeId: storage.resources.resource_types.id_resource_type,
        typeName: storage.resources.resource_types.rst_name,
      })),
    };
  }

  async listTransfers(filters: TransferListFilters, actor: AuthenticatedUser) {
    if (filters.campId) {
      ensureCampScope(actor, filters.campId);
    }

    const resolvedCampId =
      filters.campId ??
      (isSystemAdministrator(actor) ? undefined : actor.campId);
    const search = filters.search?.trim();
    const where = {
      ...(filters.state ? { tfs_state: filters.state } : {}),
      ...(filters.type ? { tfs_type: filters.type } : {}),
      ...(resolvedCampId
        ? {
            OR: [
              { id_origin_camp: resolvedCampId },
              { id_destiny_camp: resolvedCampId },
            ],
          }
        : {}),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { tfs_comments: { contains: search } },
                  {
                    camps_transfers_id_origin_campTocamps: {
                      is: {
                        cmp_name: { contains: search },
                      },
                    },
                  },
                  {
                    camps_transfers_id_destiny_campTocamps: {
                      is: {
                        cmp_name: { contains: search },
                      },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    const result = await transfersRepository.listTransfers({
      where,
      filters,
    });

    return {
      items: result.items.map(mapTransferSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        campId: resolvedCampId,
        search,
      },
    };
  }

  async getTransferById(transferId: number, actor: AuthenticatedUser) {
    const transfer = await transfersRepository.findTransferById(transferId);

    if (!transfer) {
      throw new AppError(404, "Transfer not found.", "TRANSFER_NOT_FOUND");
    }

    ensureTransferVisibility(actor, transfer);

    const recentEvents =
      await transfersRepository.listTransferEvents(transferId);
    return mapTransferDetail(transfer, recentEvents);
  }

  async createTransfer(input: TransferCreateInput, actor: AuthenticatedUser) {
    ensureTransferManager(actor);

    const originCampId = input.id_origin_camp ?? actor.campId;
    ensureCampScope(actor, originCampId);

    if (originCampId === input.id_destiny_camp) {
      throw new AppError(
        400,
        "Origin and destiny camps must be different.",
        "TRANSFER_INVALID_CAMPS",
      );
    }

    const camps = await transfersRepository.findCampsByIds([
      originCampId,
      input.id_destiny_camp,
    ]);

    if (camps.length !== 2) {
      throw new AppError(404, "Camp not found.", "TRANSFER_CAMP_NOT_FOUND");
    }

    camps.forEach((camp) => {
      if (camp.cmp_status !== "active") {
        throw new AppError(
          400,
          "Transfers can only be created between active camps.",
          "TRANSFER_INVALID_CAMP_STATUS",
        );
      }
    });

    const personIds = (input.persons ?? []).map((person) => person.id_person);
    const resourceIds = (input.resources ?? []).map(
      (resource) => resource.id_resource,
    );

    if (personIds.length > 0) {
      const destinationCamp = camps.find(
        (camp) => camp.id_camp === input.id_destiny_camp,
      )!;
      const acceptedAtDestination =
        await transfersRepository.countAcceptedActivePersons(
          input.id_destiny_camp,
        );
      if (
        destinationCamp.cmp_max_capacity > 0 &&
        acceptedAtDestination + personIds.length >
          destinationCamp.cmp_max_capacity
      ) {
        throw new AppError(
          409,
          "The destination camp does not have enough capacity.",
          "TRANSFER_DESTINATION_CAPACITY_EXCEEDED",
        );
      }

      const persons = await transfersRepository.findPersonsByIds(personIds);

      if (persons.length !== personIds.length) {
        throw new AppError(
          404,
          "One or more people could not be found.",
          "TRANSFER_PERSON_NOT_FOUND",
        );
      }

      persons.forEach((person) => {
        if (
          !person.prn_is_active ||
          person.prn_admission_status !== "accepted"
        ) {
          throw new AppError(
            400,
            "Transferred people must be active and accepted.",
            "TRANSFER_PERSON_NOT_ELIGIBLE",
          );
        }

        if (person.id_camp !== originCampId) {
          throw new AppError(
            400,
            "All transferred people must belong to the origin camp.",
            "TRANSFER_PERSON_CAMP_MISMATCH",
          );
        }
      });
    }

    if (resourceIds.length > 0) {
      const resources =
        await transfersRepository.findResourcesByIds(resourceIds);

      if (resources.length !== resourceIds.length) {
        throw new AppError(
          404,
          "One or more resources could not be found.",
          "TRANSFER_RESOURCE_NOT_FOUND",
        );
      }

      resources.forEach((resource) => {
        if (!resource.rss_is_active) {
          throw new AppError(
            400,
            "Transferred resources must be active.",
            "TRANSFER_RESOURCE_INACTIVE",
          );
        }
      });
    }

    const createdTransfer = await transfersRepository.createTransfer({
      data: {
        id_origin_camp: originCampId,
        id_destiny_camp: input.id_destiny_camp,
        id_requested_by_user: actor.id,
        tfs_type: input.tfs_type,
        tfs_comments: input.tfs_comments ?? null,
      },
      persons: input.persons ?? [],
      resources: input.resources ?? [],
      auditEvents: [
        {
          action: "created",
          actorUserId: actor.id,
          description: "Transfer request created.",
          newValue: {
            tfs_type: input.tfs_type,
            originCampId,
            destinyCampId: input.id_destiny_camp,
            persons: input.persons ?? [],
            resources: input.resources ?? [],
          },
        },
      ],
    });

    const recentEvents = await transfersRepository.listTransferEvents(
      createdTransfer.id_transfer,
    );
    return mapTransferDetail(createdTransfer, recentEvents);
  }

  async updateTransferState(
    transferId: number,
    input: TransferStateUpdateInput,
    actor: AuthenticatedUser,
  ) {
    ensureTransferManager(actor);

    const transfer = await transfersRepository.findTransferById(transferId);

    if (!transfer) {
      throw new AppError(404, "Transfer not found.", "TRANSFER_NOT_FOUND");
    }

    ensureTransferVisibility(actor, transfer);
    ensureTransitionAuthority(actor, transfer, input.nextState);
    ensureValidTransition(transfer.tfs_state, input.nextState);

    const missionOutcome =
      input.nextState === "delivered"
        ? buildTransferOutcome(transfer)
        : undefined;
    const resolvedState = missionOutcome?.resolvedState ?? input.nextState;

    const updatedTransfer = await transfersRepository.updateTransferState({
      transferId,
      nextState: resolvedState,
      missionOutcome,
      comments: input.comments,
      actorUserId: actor.id,
    });

    const recentEvents =
      await transfersRepository.listTransferEvents(transferId);
    return mapTransferDetail(updatedTransfer, recentEvents);
  }
}

export const transfersService = new TransfersService();
