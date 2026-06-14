import prisma, { Prisma } from "../../lib/prisma.js";
import type {
  InventoryListFilters,
  InventoryThresholdsInput,
} from "./inventory.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

const inventorySummaryInclude = {
  camps: true,
  resources: {
    include: {
      resource_types: true,
    },
  },
} satisfies Prisma.storageInclude;

const inventoryDetailInclude = {
  ...inventorySummaryInclude,
  storage_records: {
    take: 10,
    orderBy: {
      str_recorded_at: "desc",
    },
    include: {
      users: {
        select: {
          id_user: true,
          usr_username: true,
        },
      },
    },
  },
} satisfies Prisma.storageInclude;

export type InventorySummaryRecord = Prisma.storageGetPayload<{
  include: typeof inventorySummaryInclude;
}>;

export type InventoryDetailRecord = Prisma.storageGetPayload<{
  include: typeof inventoryDetailInclude;
}>;

export class InventoryRepository {
  async listCatalogs(input: { campId?: number }) {
    const [camps, resourceTypes, resources] = await prisma.$transaction([
      prisma.camps.findMany({
        where: input.campId ? { id_camp: input.campId } : undefined,
        orderBy: {
          cmp_name: "asc",
        },
      }),
      prisma.resource_types.findMany({
        orderBy: [{ rst_is_priority: "desc" }, { rst_name: "asc" }],
      }),
      prisma.resources.findMany({
        where: {
          rss_is_active: true,
        },
        orderBy: {
          rss_name: "asc",
        },
        include: {
          resource_types: true,
        },
      }),
    ]);

    return {
      camps,
      resourceTypes,
      resources,
    };
  }

  async listInventory(input: {
    where: Prisma.storageWhereInput;
    filters: InventoryListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const take = input.filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.storage.findMany({
        where: input.where,
        skip,
        take,
        orderBy: [
          { camps: { cmp_name: "asc" } },
          { resources: { rss_name: "asc" } },
        ],
        include: inventorySummaryInclude,
      }),
      prisma.storage.count({
        where: input.where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  async listInventorySnapshot(where: Prisma.storageWhereInput) {
    return prisma.storage.findMany({
      where,
      orderBy: [
        { camps: { cmp_name: "asc" } },
        { resources: { rss_name: "asc" } },
      ],
      include: inventorySummaryInclude,
    });
  }

  async findStorageById(storageId: number) {
    return prisma.storage.findUnique({
      where: {
        id_storage: storageId,
      },
      include: inventoryDetailInclude,
    });
  }

  async findStorageByCampResource(campId: number, resourceId: number) {
    return prisma.storage.findFirst({
      where: {
        id_camp: campId,
        id_resource: resourceId,
      },
      include: inventoryDetailInclude,
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: {
        id_camp: campId,
      },
    });
  }

  async findResourceById(resourceId: number) {
    return prisma.resources.findUnique({
      where: {
        id_resource: resourceId,
      },
      include: {
        resource_types: true,
      },
    });
  }

  async listResourceMovements(input: { campId: number; resourceId: number }) {
    return prisma.resources_movements.findMany({
      where: {
        id_camp: input.campId,
        id_resource: input.resourceId,
      },
      orderBy: {
        rsm_movement_date: "desc",
      },
      take: 10,
      include: {
        users: {
          select: {
            id_user: true,
            usr_username: true,
          },
        },
        persons: {
          select: {
            id_person: true,
            prn_name: true,
            prn_lastname: true,
          },
        },
      },
    });
  }

  async applyInventoryAdjustment(input: {
    campId: number;
    resourceId: number;
    reason: string;
    newQuantity: number;
    delta: number;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingStorage = await tx.storage.findFirst({
        where: {
          id_camp: input.campId,
          id_resource: input.resourceId,
        },
      });

      const now = new Date();
      const previousQuantity = existingStorage
        ? Number(existingStorage.stg_quantity)
        : 0;

      const storage = existingStorage
        ? await tx.storage.update({
            where: {
              id_storage: existingStorage.id_storage,
            },
            data: {
              stg_quantity: input.newQuantity,
              stg_last_updated_at: now,
            },
          })
        : await tx.storage.create({
            data: {
              id_camp: input.campId,
              id_resource: input.resourceId,
              stg_quantity: input.newQuantity,
              stg_min_quantity: 0,
              stg_max_quantity: null,
              stg_last_updated_at: now,
            },
          });

      const isBelowMinimum =
        input.newQuantity < Number(storage.stg_min_quantity);

      await tx.storage_records.create({
        data: {
          id_storage: storage.id_storage,
          id_user: input.actorUserId,
          str_previous_quantity: previousQuantity,
          str_new_quantity: input.newQuantity,
          str_reason: input.reason,
          str_is_below_minimum: isBelowMinimum,
          str_recorded_at: now,
        },
      });

      await tx.resources_movements.create({
        data: {
          id_resource: input.resourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          rsm_type: "adjustment",
          rsm_quantity: input.delta,
          rsm_reason_for_movement: input.reason,
          rsm_reference_type: "manual",
          rsm_movement_date: now,
        },
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: input.campId,
          evt_entity: "storage",
          evt_entity_id: storage.id_storage,
          evt_action: "adjustment",
          evt_old_value: toPrismaJsonValue({ quantity: previousQuantity }),
          evt_new_value: toPrismaJsonValue({ quantity: input.newQuantity }),
          evt_description: input.reason,
        },
      });

      return tx.storage.findUniqueOrThrow({
        where: {
          id_storage: storage.id_storage,
        },
        include: inventoryDetailInclude,
      });
    });
  }

  async updateInventoryThresholds(input: {
    storageId: number;
    thresholds: InventoryThresholdsInput;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const storage = await tx.storage.update({
        where: {
          id_storage: input.storageId,
        },
        data: {
          ...(input.thresholds.stg_min_quantity !== undefined
            ? { stg_min_quantity: input.thresholds.stg_min_quantity }
            : {}),
          ...(input.thresholds.stg_max_quantity !== undefined
            ? { stg_max_quantity: input.thresholds.stg_max_quantity }
            : {}),
          stg_last_updated_at: new Date(),
        },
        include: inventoryDetailInclude,
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: storage.id_camp,
          evt_entity: "storage",
          evt_entity_id: storage.id_storage,
          evt_action: "thresholds_updated",
          evt_new_value: toPrismaJsonValue({
            stg_min_quantity: Number(storage.stg_min_quantity),
            stg_max_quantity:
              storage.stg_max_quantity !== null
                ? Number(storage.stg_max_quantity)
                : null,
          }),
          evt_description: "Inventory thresholds updated.",
        },
      });

      return storage;
    });
  }
}

export const inventoryRepository = new InventoryRepository();
