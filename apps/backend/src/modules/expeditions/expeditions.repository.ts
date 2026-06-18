import prisma, { Prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { applyPersonProgression } from "../persons/person-progression.service.js";
import type {
  ExpeditionAuditEventInput,
  ExpeditionCatalogFilters,
  ExpeditionCreateInput,
  ExpeditionListFilters,
  ExpeditionMissionOutcome,
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
  const diffMilliseconds =
    input.arrivingDate.getTime() - input.leavingDate.getTime();
  const elapsedDays = Math.max(
    0,
    Math.ceil(diffMilliseconds / millisecondsPerDay),
  );

  return Math.max(0, elapsedDays - input.estimatedDays);
}

const expeditionSummaryInclude = {
  camps: {
    include: {
      camp_operational_rules: true,
    },
  },
  exploration_zones: true,
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
        include: {
          professions: true,
          person_stats: true,
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
    const [camps, persons, resources, explorationZones] =
      await prisma.$transaction([
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
                prn_admission_status: "accepted",
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
        prisma.exploration_zones.findMany({
          where: input.campId
            ? {
                id_camp: input.campId,
                exz_is_active: true,
              }
            : {
                id_exploration_zone: -1,
              },
          orderBy: {
            exz_name: "asc",
          },
        }),
      ]);

    return {
      camps,
      persons,
      resources,
      explorationZones,
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

  async findExplorationZoneById(zoneId: number) {
    return prisma.exploration_zones.findUnique({
      where: {
        id_exploration_zone: zoneId,
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
      id_exploration_zone: number | null;
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
    }, {
      timeout: 30_000,
      maxWait: 15_000,
    });
  }

  async updateExpeditionState(input: {
    expeditionId: number;
    nextState: ExpeditionStateUpdateInput["nextState"];
    exe_resources_used?: number;
    exe_resources_returned?: number;
    arrivingDate?: Date | null;
    members?: ExpeditionStateUpdateInput["members"];
    missionOutcome?: ExpeditionMissionOutcome;
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
        const rationsUsed = await this.deductExpeditionRations(tx, {
          expedition,
          actorUserId: input.actorUserId,
        });
        updateData.exe_resources_used = rationsUsed;

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
              ? (memberUpdate.notes ?? null)
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

          if (record.persons.professions?.pfs_can_expedition) {
            await applyPersonProgression(tx, {
              personId: record.id_person,
              sourceType: "expedition",
              referenceKey: `expedition:${expedition.id_expedition}`,
              actorUserId: input.actorUserId,
            });
          }
        }

        const foodResource = await this.findFoodResource(tx);
        for (const reward of input.missionOutcome?.hunterRewards ?? []) {
          if (reward.quantity <= 0 || !foodResource) continue;

          await this.adjustStorageForExpeditionReturn(tx, {
            campId: expedition.id_camp,
            expeditionId: expedition.id_expedition,
            expeditionName: expedition.exs_name,
            resourceId: foodResource.id_resource,
            personId: reward.personId,
            quantity: reward.quantity,
            actorUserId: input.actorUserId,
          });
          totalReturned += reward.quantity;
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
                : (updateData.exs_arriving_date ?? null),
            exe_resources_used:
              input.exe_resources_used ?? Number(expedition.exe_resources_used),
            exe_resources_returned:
              updateData.exe_resources_returned ??
              Number(expedition.exe_resources_returned),
          }),
          evt_description: `Expedition state changed from ${expedition.exe_state} to ${input.nextState}.`,
        },
      });

      if (input.missionOutcome?.resolvedState === "failed") {
        await tx.narrative_events.create({
          data: {
            id_camp: expedition.id_camp,
            id_user: input.actorUserId,
            nre_type: input.missionOutcome.failureEventType ?? "zombie_attack",
            nre_status: "applied",
            nre_source_type: "expedition",
            nre_reference_id: expedition.id_expedition,
            nre_probability: input.missionOutcome.probability,
            nre_roll: input.missionOutcome.roll,
            nre_participants: expedition.expedition_records.map((record) => ({
              personId: record.id_person,
              profession: record.persons.professions?.pfs_name ?? null,
            })),
            nre_effects: {
              resolvedState: "failed",
              resourcesReturned: 0,
              zoneId: expedition.id_exploration_zone,
            },
            nre_description:
              input.missionOutcome.failureEventType === "traveler_loss"
                ? "The expedition failed after losing contact with its travelers."
                : "The expedition failed after a zombie attack.",
          },
        });
      }

      const successfulHunterRewards =
        input.missionOutcome?.hunterRewards.filter(
          (reward) => reward.quantity > 0,
        ) ?? [];
      if (
        input.missionOutcome?.resolvedState === "returned" &&
        (input.missionOutcome.valuableTriggered ||
          successfulHunterRewards.length > 0)
      ) {
        await tx.narrative_events.create({
          data: {
            id_camp: expedition.id_camp,
            id_user: input.actorUserId,
            nre_type: "valuable_resources",
            nre_status: "applied",
            nre_source_type: "expedition",
            nre_reference_id: expedition.id_expedition,
            nre_probability: input.missionOutcome.valuableTriggered
              ? input.missionOutcome.valuableProbability
              : Math.max(
                  ...successfulHunterRewards.map(
                    (reward) => reward.probability,
                  ),
                ),
            nre_roll: input.missionOutcome.valuableTriggered
              ? input.missionOutcome.valuableRoll
              : Math.min(
                  ...successfulHunterRewards.map((reward) => reward.roll),
                ),
            nre_participants: expedition.expedition_records.map((record) => ({
              personId: record.id_person,
              profession: record.persons.professions?.pfs_name ?? null,
            })),
            nre_effects: {
              valuableResources: input.missionOutcome.valuableTriggered,
              hunterFoodRewards: successfulHunterRewards,
              resourcesReturned: Number(
                updateData.exe_resources_returned ??
                  expedition.exe_resources_returned,
              ),
              zoneId: expedition.id_exploration_zone,
            },
            nre_description:
              "The expedition returned with an exceptional resource discovery.",
          },
        });
      }

      return tx.expeditions.findUniqueOrThrow({
        where: {
          id_expedition: expedition.id_expedition,
        },
        include: expeditionDetailInclude,
      });
    }, {
      timeout: 30_000,
      maxWait: 15_000,
    });
  }

  private async findFoodResource(tx: Prisma.TransactionClient) {
    const resources = await tx.resources.findMany({
      where: {
        rss_is_active: true,
      },
      orderBy: {
        id_resource: "asc",
      },
    });
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    return (
      resources.find((resource) => {
        const name = normalize(resource.rss_name);
        return (
          name.includes("comida") ||
          name.includes("food") ||
          name.includes("aliment")
        );
      }) ?? null
    );
  }

  private async deductExpeditionRations(
    tx: Prisma.TransactionClient,
    input: {
      expedition: ExpeditionDetailRecord;
      actorUserId: number;
    },
  ) {
    const rationLines = input.expedition.expedition_records
      .map((record) => ({
        personId: record.id_person,
        quantity: Number(record.exr_rations_assigned),
      }))
      .filter((record) => record.quantity > 0);
    const total = Number(
      rationLines.reduce((sum, record) => sum + record.quantity, 0).toFixed(2),
    );

    if (total === 0) {
      return 0;
    }

    const foodResource = await this.findFoodResource(tx);
    if (!foodResource) {
      throw new AppError(
        409,
        "Food resource is not configured for expedition rations.",
        "EXPEDITION_FOOD_RESOURCE_MISSING",
      );
    }

    const storage = await tx.storage.findUnique({
      where: {
        id_camp_id_resource: {
          id_camp: input.expedition.id_camp,
          id_resource: foodResource.id_resource,
        },
      },
    });
    const previousQuantity = Number(storage?.stg_quantity ?? 0);

    if (!storage || previousQuantity < total) {
      throw new AppError(
        409,
        "There is not enough food to start the expedition.",
        "EXPEDITION_INSUFFICIENT_RATIONS",
      );
    }

    const nextQuantity = Number((previousQuantity - total).toFixed(2));
    const now = new Date();
    await tx.storage.update({
      where: { id_storage: storage.id_storage },
      data: {
        stg_quantity: nextQuantity,
        stg_last_updated_at: now,
      },
    });
    await tx.storage_records.create({
      data: {
        id_storage: storage.id_storage,
        id_user: input.actorUserId,
        str_previous_quantity: previousQuantity,
        str_new_quantity: nextQuantity,
        str_reason: `Rations for expedition #${input.expedition.id_expedition}.`,
        str_is_below_minimum: nextQuantity < Number(storage.stg_min_quantity),
        str_recorded_at: now,
      },
    });

    for (const ration of rationLines) {
      await tx.resources_movements.create({
        data: {
          id_resource: foodResource.id_resource,
          id_camp: input.expedition.id_camp,
          id_user: input.actorUserId,
          id_person: ration.personId,
          rsm_type: "expedition_out",
          rsm_quantity: -ration.quantity,
          rsm_reason_for_movement: `Rations for expedition #${input.expedition.id_expedition}.`,
          rsm_reference_type: "expedition",
          id_reference: input.expedition.id_expedition,
          rsm_movement_date: now,
        },
      });
    }

    return total;
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

    const isBelowMinimum =
      nextQuantity < Number(targetStorage.stg_min_quantity);
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
