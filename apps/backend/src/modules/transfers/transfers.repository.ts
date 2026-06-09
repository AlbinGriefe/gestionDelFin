import prisma, { Prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { applyPersonProgression } from "../persons/person-progression.service.js";
import type {
  TransferAuditEventInput,
  TransferCatalogFilters,
  TransferCreateInput,
  TransferListFilters,
  TransferMissionOutcome,
  TransferStateUpdateInput,
} from "./transfers.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

const transferSummaryInclude = {
  camps_transfers_id_origin_campTocamps: {
    include: {
      camp_operational_rules: true,
    },
  },
  camps_transfers_id_destiny_campTocamps: true,
  users_transfers_id_requested_by_userTousers: {
    select: {
      id_user: true,
      usr_username: true,
    },
  },
  _count: {
    select: {
      application_admission_person: true,
      application_admission_resources: true,
    },
  },
} satisfies Prisma.transfersInclude;

const transferDetailInclude = {
  ...transferSummaryInclude,
  users_transfers_id_accepted_by_userTousers: {
    select: {
      id_user: true,
      usr_username: true,
    },
  },
  users_transfers_id_approved_origin_by_userTousers: {
    select: {
      id_user: true,
      usr_username: true,
    },
  },
  users_transfers_id_approved_destiny_by_userTousers: {
    select: {
      id_user: true,
      usr_username: true,
    },
  },
  application_admission_person: {
    include: {
      persons: {
        include: {
          professions: true,
          person_stats: true,
        },
      },
    },
  },
  application_admission_resources: {
    include: {
      resources: {
        select: {
          id_resource: true,
          rss_name: true,
          rss_unit: true,
        },
      },
    },
  },
} satisfies Prisma.transfersInclude;

export type TransferSummaryRecord = Prisma.transfersGetPayload<{
  include: typeof transferSummaryInclude;
}>;

export type TransferDetailRecord = Prisma.transfersGetPayload<{
  include: typeof transferDetailInclude;
}>;

export class TransfersRepository {
  async listCatalogs(input: TransferCatalogFilters) {
    const [camps, persons, resources] = await prisma.$transaction([
      prisma.camps.findMany({
        where: {
          cmp_status: "active",
        },
        orderBy: {
          cmp_name: "asc",
        },
      }),
      prisma.persons.findMany({
        where: input.originCampId
          ? {
              id_camp: input.originCampId,
              prn_is_active: true,
              prn_admission_status: "accepted",
            }
          : {
              prn_is_active: false,
            },
        orderBy: [{ prn_lastname: "asc" }, { prn_name: "asc" }],
      }),
      prisma.storage.findMany({
        where: input.originCampId
          ? {
              id_camp: input.originCampId,
              stg_quantity: {
                gt: 0,
              },
              resources: {
                rss_is_active: true,
              },
            }
          : {
              id_camp: -1,
            },
        orderBy: {
          resources: {
            rss_name: "asc",
          },
        },
        include: {
          resources: {
            include: {
              resource_types: true,
            },
          },
        },
      }),
    ]);

    return {
      camps,
      persons,
      resources,
    };
  }

  async listTransfers(input: {
    where: Prisma.transfersWhereInput;
    filters: TransferListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.transfers.findMany({
        where: input.where,
        skip,
        take,
        orderBy: {
          tfs_requested_date: "desc",
        },
        include: transferSummaryInclude,
      }),
      prisma.transfers.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findTransferById(transferId: number) {
    return prisma.transfers.findUnique({
      where: {
        id_transfer: transferId,
      },
      include: transferDetailInclude,
    });
  }

  async listTransferEvents(transferId: number) {
    return prisma.events.findMany({
      where: {
        evt_entity: "transfers",
        evt_entity_id: transferId,
      },
      orderBy: {
        evt_created_at: "desc",
      },
      take: 10,
    });
  }

  async findCampsByIds(campIds: number[]) {
    return prisma.camps.findMany({
      where: {
        id_camp: {
          in: campIds,
        },
      },
    });
  }

  async findPersonsByIds(personIds: number[]) {
    return prisma.persons.findMany({
      where: {
        id_person: {
          in: personIds,
        },
      },
      include: {
        professions: true,
      },
    });
  }

  async countAcceptedActivePersons(campId: number) {
    return prisma.persons.count({
      where: {
        id_camp: campId,
        prn_is_active: true,
        prn_admission_status: "accepted",
      },
    });
  }

  async findResourcesByIds(resourceIds: number[]) {
    return prisma.resources.findMany({
      where: {
        id_resource: {
          in: resourceIds,
        },
      },
      include: {
        resource_types: true,
      },
    });
  }

  async createTransfer(input: {
    data: {
      id_origin_camp: number;
      id_destiny_camp: number;
      id_requested_by_user: number;
      tfs_type: TransferCreateInput["tfs_type"];
      tfs_comments: string | null;
    };
    persons: TransferCreateInput["persons"];
    resources: TransferCreateInput["resources"];
    auditEvents: TransferAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfers.create({
        data: input.data,
      });

      for (const person of input.persons ?? []) {
        await tx.application_admission_person.create({
          data: {
            id_transfer: transfer.id_transfer,
            id_person: person.id_person,
            aap_assigned_rations: person.assignedRations ?? 0,
            aap_notes: person.notes ?? null,
          },
        });
      }

      for (const resource of input.resources ?? []) {
        await tx.application_admission_resources.create({
          data: {
            id_transfer: transfer.id_transfer,
            id_resource: resource.id_resource,
            aar_quantity: resource.quantity,
            aar_notes: resource.notes ?? null,
          },
        });
      }

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: input.data.id_origin_camp,
            evt_entity: "transfers",
            evt_entity_id: transfer.id_transfer,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.transfers.findUniqueOrThrow({
        where: {
          id_transfer: transfer.id_transfer,
        },
        include: transferDetailInclude,
      });
    });
  }

  async updateTransferState(input: {
    transferId: number;
    nextState: TransferStateUpdateInput["nextState"];
    missionOutcome?: TransferMissionOutcome;
    comments?: string | null;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transfers.findUniqueOrThrow({
        where: {
          id_transfer: input.transferId,
        },
        include: transferDetailInclude,
      });

      const now = new Date();
      const updateData: Prisma.transfersUncheckedUpdateInput = {
        tfs_state: input.nextState,
        ...(input.comments !== undefined
          ? { tfs_comments: input.comments }
          : {}),
      };

      if (input.nextState === "accepted") {
        updateData.id_accepted_by_user = input.actorUserId;
        updateData.tfs_accepted_request_date = now;
      }

      if (input.nextState === "in_transit") {
        updateData.id_approved_origin_by_user = input.actorUserId;
        updateData.tfs_shipment_date = now;

        for (const resourceLine of transfer.application_admission_resources) {
          await this.adjustStorageForTransfer(tx, {
            campId: transfer.id_origin_camp,
            resourceId: resourceLine.id_resource,
            delta: -Number(resourceLine.aar_quantity),
            reason: `Transfer #${transfer.id_transfer} shipment from ${transfer.camps_transfers_id_origin_campTocamps.cmp_name}.`,
            actorUserId: input.actorUserId,
            transferId: transfer.id_transfer,
            movementType: "transfer_out",
          });
        }

        await tx.application_admission_resources.updateMany({
          where: {
            id_transfer: transfer.id_transfer,
          },
          data: {
            aar_confirmed_leaving: true,
          },
        });

        await tx.application_admission_person.updateMany({
          where: {
            id_transfer: transfer.id_transfer,
          },
          data: {
            aap_departure_confirmed: true,
          },
        });
      }

      if (input.nextState === "delivered") {
        const acceptedAtDestination = await tx.persons.count({
          where: {
            id_camp: transfer.id_destiny_camp,
            prn_is_active: true,
            prn_admission_status: "accepted",
          },
        });
        const incomingPeople = transfer.application_admission_person.length;
        const maximumCapacity =
          transfer.camps_transfers_id_destiny_campTocamps.cmp_max_capacity;
        if (
          maximumCapacity > 0 &&
          acceptedAtDestination + incomingPeople > maximumCapacity
        ) {
          throw new AppError(
            409,
            "The destination camp no longer has enough capacity.",
            "TRANSFER_DESTINATION_CAPACITY_EXCEEDED",
          );
        }

        updateData.id_approved_destiny_by_user = input.actorUserId;
        updateData.tfs_arrival_date = now;

        for (const resourceLine of transfer.application_admission_resources) {
          await this.adjustStorageForTransfer(tx, {
            campId: transfer.id_destiny_camp,
            resourceId: resourceLine.id_resource,
            delta: Number(resourceLine.aar_quantity),
            reason: `Transfer #${transfer.id_transfer} arrival to ${transfer.camps_transfers_id_destiny_campTocamps.cmp_name}.`,
            actorUserId: input.actorUserId,
            transferId: transfer.id_transfer,
            movementType: "transfer_in",
          });
        }

        await tx.application_admission_resources.updateMany({
          where: {
            id_transfer: transfer.id_transfer,
          },
          data: {
            aar_confirmed_arriving: true,
          },
        });

        for (const personLine of transfer.application_admission_person) {
          await tx.persons.update({
            where: {
              id_person: personLine.id_person,
            },
            data: {
              id_camp: transfer.id_destiny_camp,
            },
          });

          await tx.person_records.create({
            data: {
              id_person: personLine.id_person,
              id_user: input.actorUserId,
              prr_event_type: "camp_changed",
              prr_old_value: toPrismaJsonValue({
                id_camp: transfer.id_origin_camp,
              }),
              prr_new_value: toPrismaJsonValue({
                id_camp: transfer.id_destiny_camp,
              }),
              prr_notes: `Moved by transfer #${transfer.id_transfer}.`,
            },
          });

          if (personLine.persons.professions?.pfs_can_transfer) {
            await applyPersonProgression(tx, {
              personId: personLine.id_person,
              sourceType: "transfer",
              referenceKey: `transfer:${transfer.id_transfer}`,
              actorUserId: input.actorUserId,
            });
          }

          const linkedUsers = await tx.users.findMany({
            where: {
              id_person: personLine.id_person,
            },
            select: {
              id_user: true,
            },
          });

          if (linkedUsers.length > 0) {
            const linkedUserIds = linkedUsers.map((user) => user.id_user);

            await tx.users.updateMany({
              where: {
                id_user: {
                  in: linkedUserIds,
                },
              },
              data: {
                id_camp: transfer.id_destiny_camp,
              },
            });

            await tx.user_sessions.updateMany({
              where: {
                id_user: {
                  in: linkedUserIds,
                },
                uss_is_expired: false,
              },
              data: {
                uss_is_expired: true,
                uss_last_update: now,
                uss_expired_session: now,
                uss_sign_out_reason: "camp_change",
              },
            });
          }
        }

        await tx.application_admission_person.updateMany({
          where: {
            id_transfer: transfer.id_transfer,
          },
          data: {
            aap_arrival_confirmed: true,
          },
        });
      }

      if (input.nextState === "returned") {
        updateData.tfs_return_date = now;

        for (const resourceLine of transfer.application_admission_resources) {
          await this.adjustStorageForTransfer(tx, {
            campId: transfer.id_origin_camp,
            resourceId: resourceLine.id_resource,
            delta: Number(resourceLine.aar_quantity),
            reason: `Transfer #${transfer.id_transfer} returned to ${transfer.camps_transfers_id_origin_campTocamps.cmp_name}.`,
            actorUserId: input.actorUserId,
            transferId: transfer.id_transfer,
            movementType: "transfer_in",
          });
        }

        await tx.application_admission_person.updateMany({
          where: {
            id_transfer: transfer.id_transfer,
          },
          data: {
            aap_returned_to_origin: true,
          },
        });
      }

      if (input.nextState === "failed") {
        updateData.tfs_return_date = now;
      }

      await tx.transfers.update({
        where: {
          id_transfer: transfer.id_transfer,
        },
        data: updateData,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: transfer.id_origin_camp,
          evt_entity: "transfers",
          evt_entity_id: transfer.id_transfer,
          evt_action: "state_changed",
          evt_old_value: toPrismaJsonValue({
            tfs_state: transfer.tfs_state,
          }),
          evt_new_value: toPrismaJsonValue({
            tfs_state: input.nextState,
            missionOutcome: input.missionOutcome ?? null,
          }),
          evt_description: `Transfer state changed from ${transfer.tfs_state} to ${input.nextState}.`,
        },
      });

      if (input.missionOutcome?.resolvedState === "failed") {
        await tx.narrative_events.create({
          data: {
            id_camp: transfer.id_origin_camp,
            id_user: input.actorUserId,
            nre_type: input.missionOutcome.failureEventType ?? "zombie_attack",
            nre_status: "applied",
            nre_source_type: "transfer",
            nre_reference_id: transfer.id_transfer,
            nre_probability: input.missionOutcome.probability,
            nre_roll: input.missionOutcome.roll,
            nre_participants: transfer.application_admission_person.map(
              (personLine) => ({
                personId: personLine.id_person,
                profession: personLine.persons.professions?.pfs_name ?? null,
              }),
            ),
            nre_effects: {
              resolvedState: "failed",
              resourcesLost: transfer.application_admission_resources.map(
                (resourceLine) => ({
                  resourceId: resourceLine.id_resource,
                  quantity: Number(resourceLine.aar_quantity),
                }),
              ),
              originCampId: transfer.id_origin_camp,
              destinyCampId: transfer.id_destiny_camp,
            },
            nre_description:
              input.missionOutcome.failureEventType === "traveler_loss"
                ? "The shipment failed after contact with the travelers was lost."
                : "The shipment failed after a zombie attack.",
          },
        });
      }

      return tx.transfers.findUniqueOrThrow({
        where: {
          id_transfer: transfer.id_transfer,
        },
        include: transferDetailInclude,
      });
    });
  }

  private async adjustStorageForTransfer(
    tx: Prisma.TransactionClient,
    input: {
      campId: number;
      resourceId: number;
      delta: number;
      reason: string;
      actorUserId: number;
      transferId: number;
      movementType: "transfer_out" | "transfer_in";
    },
  ) {
    const storage = await tx.storage.findFirst({
      where: {
        id_camp: input.campId,
        id_resource: input.resourceId,
      },
    });

    const previousQuantity = storage ? Number(storage.stg_quantity) : 0;
    const nextQuantity = Number((previousQuantity + input.delta).toFixed(2));

    if (nextQuantity < 0) {
      throw new AppError(
        400,
        `Insufficient stock for resource ${input.resourceId} in camp ${input.campId}.`,
        "TRANSFER_INSUFFICIENT_STOCK",
      );
    }

    const targetStorage = storage
      ? await tx.storage.update({
          where: {
            id_storage: storage.id_storage,
          },
          data: {
            stg_quantity: nextQuantity,
            stg_last_updated_at: new Date(),
          },
        })
      : await tx.storage.create({
          data: {
            id_camp: input.campId,
            id_resource: input.resourceId,
            stg_quantity: nextQuantity,
            stg_min_quantity: 0,
            stg_max_quantity: null,
            stg_last_updated_at: new Date(),
          },
        });

    const isBelowMinimum = nextQuantity < Number(targetStorage.stg_min_quantity);

    await tx.storage_records.create({
      data: {
        id_storage: targetStorage.id_storage,
        id_user: input.actorUserId,
        str_previous_quantity: previousQuantity,
        str_new_quantity: nextQuantity,
        str_reason: input.reason,
        str_is_below_minimum: isBelowMinimum,
      },
    });

    await tx.resources_movements.create({
      data: {
        id_resource: input.resourceId,
        id_camp: input.campId,
        id_user: input.actorUserId,
        rsm_type: input.movementType,
        rsm_quantity: Math.abs(input.delta),
        rsm_reason_for_movement: input.reason,
        rsm_reference_type: "transfer",
        id_reference: input.transferId,
      },
    });
  }
}

export const transfersRepository = new TransfersRepository();
