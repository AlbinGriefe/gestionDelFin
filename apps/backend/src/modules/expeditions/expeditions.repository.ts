import prisma, { Prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  ExpeditionAuditEventInput,
  ExpeditionCatalogFilters,
  ExpeditionCreateInput,
  ExpeditionListFilters,
  ExpeditionStateUpdateInput,
} from "./expeditions.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function calculateExtraDays(input: {
  leavingDate: Date;
  arrivingDate: Date;
  estimatedDays: number;
}) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diffMilliseconds = input.arrivingDate.getTime() - input.leavingDate.getTime();
  const elapsedDays = Math.max(0, Math.ceil(diffMilliseconds / millisecondsPerDay));

  return Math.max(0, elapsedDays - input.estimatedDays);
}

const expeditionSummaryInclude = {
  camps: true,
  users: {
    select: {
      id_user: true,
      usr_username: true,
    },
  },
  _count: {
    select: {
      expedition_records: true,
    },
  },
} satisfies Prisma.expeditionsInclude;

const expeditionDetailInclude = {
  ...expeditionSummaryInclude,
  expedition_records: {
    include: {
      persons: {
        select: {
          id_person: true,
          prn_name: true,
          prn_lastname: true,
          id_camp: true,
        },
      },
      resources: {
        select: {
          id_resource: true,
          rss_name: true,
          rss_unit: true,
          rss_is_active: true,
        },
      },
    },
  },
} satisfies Prisma.expeditionsInclude;

export type ExpeditionSummaryRecord = Prisma.expeditionsGetPayload<{
  include: typeof expeditionSummaryInclude;
}>;

export type ExpeditionDetailRecord = Prisma.expeditionsGetPayload<{
  include: typeof expeditionDetailInclude;
}>;

export class ExpeditionsRepository {
  async listCatalogs(input: ExpeditionCatalogFilters) {
    const [camps, persons, resources] = await prisma.$transaction([
      prisma.camps.findMany({
        where: input.campId
          ? {
              id_camp: input.campId,
              cmp_status: "active",
            }
          : {
              cmp_status: "active",
            },
        orderBy: {
          cmp_name: "asc",
        },
      }),
      prisma.persons.findMany({
        where: input.campId
          ? {
              id_camp: input.campId,
              prn_is_active: true,
              prn_is_accepted: true,
            }
          : {
              id_person: -1,
            },
        orderBy: [{ prn_lastname: "asc" }, { prn_name: "asc" }],
      }),
      prisma.resources.findMany({
        where: {
          rss_is_active: true,
        },
        orderBy: {
          rss_name: "asc",
        },
      }),
    ]);

    return {
      camps,
      persons,
      resources,
    };
  }

  async listExpeditions(input: {
    where: Prisma.expeditionsWhereInput;
    filters: ExpeditionListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.expeditions.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [{ exs_leaving_date: "desc" }, { exe_created_at: "desc" }],
        include: expeditionSummaryInclude,
      }),
      prisma.expeditions.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async findExpeditionById(expeditionId: number) {
    return prisma.expeditions.findUnique({
      where: {
        id_expedition: expeditionId,
      },
      include: expeditionDetailInclude,
    });
  }

  async listExpeditionEvents(expeditionId: number) {
    return prisma.events.findMany({
      where: {
        evt_entity: "expeditions",
        evt_entity_id: expeditionId,
      },
      orderBy: {
        evt_created_at: "desc",
      },
      take: 10,
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: {
        id_camp: campId,
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
    });
  }

  async findResourcesByIds(resourceIds: number[]) {
    return prisma.resources.findMany({
      where: {
        id_resource: {
          in: resourceIds,
        },
      },
    });
  }

  async createExpedition(input: {
    data: {
      id_camp: number;
      id_created_by_user: number;
      exs_name: string;
      exs_leaving_date: Date;
      exs_estimated_days: number;
      exe_notes: string | null;
    };
    members: ExpeditionCreateInput["members"];
    auditEvents: ExpeditionAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const expedition = await tx.expeditions.create({
        data: input.data,
      });

      for (const member of input.members) {
        await tx.expedition_records.create({
          data: {
            id_expedition: expedition.id_expedition,
            id_person: member.id_person,
            id_resource: member.id_resource ?? null,
            exr_role_in_expedition: member.roleInExpedition ?? null,
            exr_rations_assigned: member.rationsAssigned ?? 0,
            exr_notes: member.notes ?? null,
          },
        });
      }

      for (const event of input.auditEvents) {
        await tx.events.create({
          data: {
            id_user: event.actorUserId ?? null,
            id_camp: input.data.id_camp,
            evt_entity: "expeditions",
            evt_entity_id: expedition.id_expedition,
            evt_action: event.action,
            evt_old_value: toPrismaJsonValue(event.oldValue),
            evt_new_value: toPrismaJsonValue(event.newValue),
            evt_description: event.description ?? null,
          },
        });
      }

      return tx.expeditions.findUniqueOrThrow({
        where: {
          id_expedition: expedition.id_expedition,
        },
        include: expeditionDetailInclude,
      });
    });
  }

  async updateExpeditionState(input: {
    expeditionId: number;
    nextState: ExpeditionStateUpdateInput["nextState"];
    exe_resources_used?: number;
    exe_resources_returned?: number;
    arrivingDate?: Date | null;
    members?: ExpeditionStateUpdateInput["members"];
    notes?: string | null;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const expedition = await tx.expeditions.findUniqueOrThrow({
        where: {
          id_expedition: input.expeditionId,
        },
        include: expeditionDetailInclude,
      });

      const now = new Date();
      const updateData: Prisma.expeditionsUncheckedUpdateInput = {
        exe_state: input.nextState,
        ...(input.notes !== undefined ? { exe_notes: input.notes } : {}),
        ...(input.exe_resources_used !== undefined
          ? { exe_resources_used: input.exe_resources_used }
          : {}),
      };

      if (input.nextState === "in_progress") {
        await tx.expedition_records.updateMany({
          where: {
            id_expedition: expedition.id_expedition,
          },
          data: {
            exr_departure_confirmed: true,
          },
        });
      }

      if (input.nextState === "returned") {
        const arrivingDate = input.arrivingDate ?? now;
        const memberUpdates = new Map(
          (input.members ?? []).map((member) => [member.id_person, member]),
        );

        let totalReturned = 0;

        for (const record of expedition.expedition_records) {
          const memberUpdate = memberUpdates.get(record.id_person);
          const nextResourcesFound = Number(
            (
              memberUpdate?.resourcesFound ?? Number(record.exr_resources_found)
            ).toFixed(2),
          );

          if (nextResourcesFound > 0 && record.id_resource === null) {
            throw new AppError(
              400,
              `Expedition member ${record.id_person} does not have a resource assigned for return registration.`,
              "EXPEDITION_MEMBER_RESOURCE_REQUIRED",
            );
          }

          const nextNotes =
            memberUpdate?.notes !== undefined
              ? memberUpdate.notes ?? null
              : record.exr_notes;

          await tx.expedition_records.update({
            where: {
              id_expedition_record: record.id_expedition_record,
            },
            data: {
              exr_resources_found: nextResourcesFound,
              exr_return_confirmed: true,
              exr_notes: nextNotes,
            },
          });

          totalReturned += nextResourcesFound;

          if (nextResourcesFound > 0 && record.id_resource !== null) {
            await this.adjustStorageForExpeditionReturn(tx, {
              campId: expedition.id_camp,
              expeditionId: expedition.id_expedition,
              expeditionName: expedition.exs_name,
              resourceId: record.id_resource,
              personId: record.id_person,
              quantity: nextResourcesFound,
              actorUserId: input.actorUserId,
            });
          }
        }

        updateData.exs_arriving_date = arrivingDate;
        updateData.exs_extra_days = calculateExtraDays({
          leavingDate: expedition.exs_leaving_date,
          arrivingDate,
          estimatedDays: expedition.exs_estimated_days,
        });
        updateData.exe_resources_returned =
          input.exe_resources_returned ?? Number(totalReturned.toFixed(2));
      }

      if (input.nextState === "failed") {
        const arrivingDate = input.arrivingDate ?? now;
        updateData.exs_arriving_date = arrivingDate;
        updateData.exs_extra_days = calculateExtraDays({
          leavingDate: expedition.exs_leaving_date,
          arrivingDate,
          estimatedDays: expedition.exs_estimated_days,
        });
        updateData.exe_resources_returned = input.exe_resources_returned ?? 0;
      }

      await tx.expeditions.update({
        where: {
          id_expedition: expedition.id_expedition,
        },
        data: updateData,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: expedition.id_camp,
          evt_entity: "expeditions",
          evt_entity_id: expedition.id_expedition,
          evt_action: "state_changed",
          evt_old_value: toPrismaJsonValue({
            exe_state: expedition.exe_state,
          }),
          evt_new_value: toPrismaJsonValue({
            exe_state: input.nextState,
            exs_arriving_date:
              updateData.exs_arriving_date instanceof Date
                ? updateData.exs_arriving_date.toISOString()
                : updateData.exs_arriving_date ?? null,
            exe_resources_used:
              input.exe_resources_used ?? Number(expedition.exe_resources_used),
            exe_resources_returned:
              updateData.exe_resources_returned ?? Number(expedition.exe_resources_returned),
          }),
          evt_description: `Expedition state changed from ${expedition.exe_state} to ${input.nextState}.`,
        },
      });

      return tx.expeditions.findUniqueOrThrow({
        where: {
          id_expedition: expedition.id_expedition,
        },
        include: expeditionDetailInclude,
      });
    });
  }

  private async adjustStorageForExpeditionReturn(
    tx: Prisma.TransactionClient,
    input: {
      campId: number;
      expeditionId: number;
      expeditionName: string;
      resourceId: number;
      personId: number;
      quantity: number;
      actorUserId: number;
    },
  ) {
    const storage = await tx.storage.findFirst({
      where: {
        id_camp: input.campId,
        id_resource: input.resourceId,
      },
    });

    const previousQuantity = storage ? Number(storage.stg_quantity) : 0;
    const nextQuantity = Number((previousQuantity + input.quantity).toFixed(2));
    const now = new Date();

    const targetStorage = storage
      ? await tx.storage.update({
          where: {
            id_storage: storage.id_storage,
          },
          data: {
            stg_quantity: nextQuantity,
            stg_last_updated_at: now,
          },
        })
      : await tx.storage.create({
          data: {
            id_camp: input.campId,
            id_resource: input.resourceId,
            stg_quantity: nextQuantity,
            stg_min_quantity: 0,
            stg_max_quantity: null,
            stg_last_updated_at: now,
          },
        });

    const isBelowMinimum = nextQuantity < Number(targetStorage.stg_min_quantity);
    const reason = `Expedition #${input.expeditionId} (${input.expeditionName}) returned resources.`;

    await tx.storage_records.create({
      data: {
        id_storage: targetStorage.id_storage,
        id_user: input.actorUserId,
        str_previous_quantity: previousQuantity,
        str_new_quantity: nextQuantity,
        str_reason: reason,
        str_is_below_minimum: isBelowMinimum,
        str_recorded_at: now,
      },
    });

    await tx.resources_movements.create({
      data: {
        id_resource: input.resourceId,
        id_camp: input.campId,
        id_user: input.actorUserId,
        id_person: input.personId,
        rsm_type: "expedition_return",
        rsm_quantity: input.quantity,
        rsm_reason_for_movement: reason,
        rsm_reference_type: "expedition",
        id_reference: input.expeditionId,
        rsm_movement_date: now,
      },
    });
  }
}

export const expeditionsRepository = new ExpeditionsRepository();
