import { AppError } from "../../shared/errors/app-error.js";
import { canAccessCamp, isSuperAdminRole } from "../../shared/auth/roles.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  inventoryRepository,
  type InventoryDetailRecord,
  type InventorySummaryRecord,
} from "./inventory.repository.js";
import type {
  InventoryAdjustmentInput,
  InventoryCatalogs,
  InventoryDetail,
  InventoryListFilters,
  InventorySummary,
  InventoryThresholdsInput,
} from "./inventory.types.js";

function ensureCampScope(actor: AuthenticatedUser, targetCampId: number) {
  if (canAccessCamp(actor, targetCampId)) {
    return;
  }

  throw new AppError(
    403,
    "You can only access inventory from your assigned camp.",
    "INVENTORY_FORBIDDEN_CAMP_SCOPE",
  );
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function mapInventorySummary(record: InventorySummaryRecord): InventorySummary {
  const quantity = Number(record.stg_quantity);
  const minQuantity = Number(record.stg_min_quantity);
  const maxQuantity =
    record.stg_max_quantity === null ? null : Number(record.stg_max_quantity);

  return {
    storageId: record.id_storage,
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
    },
    resource: {
      id: record.resources.id_resource,
      name: record.resources.rss_name,
      unit: record.resources.rss_unit,
      isRationable: record.resources.rss_is_rationable,
      isActive: record.resources.rss_is_active,
      type: {
        id: record.resources.resource_types.id_resource_type,
        name: record.resources.resource_types.rst_name,
        isPriority: record.resources.resource_types.rst_is_priority,
      },
    },
    quantity,
    minQuantity,
    maxQuantity,
    isBelowMinimum: quantity < minQuantity,
    lastUpdatedAt: record.stg_last_updated_at.toISOString(),
  };
}

function mapInventoryDetail(
  record: InventoryDetailRecord,
  recentMovements: Awaited<
    ReturnType<typeof inventoryRepository.listResourceMovements>
  >,
): InventoryDetail {
  const summary = mapInventorySummary(record);

  return {
    ...summary,
    recentRecords: record.storage_records.map((storageRecord) => ({
      id: storageRecord.id_storage_record,
      previousQuantity: Number(storageRecord.str_previous_quantity),
      newQuantity: Number(storageRecord.str_new_quantity),
      reason: storageRecord.str_reason,
      isBelowMinimum: storageRecord.str_is_below_minimum,
      recordedAt: storageRecord.str_recorded_at.toISOString(),
      user: storageRecord.users
        ? {
            id: storageRecord.users.id_user,
            username: storageRecord.users.usr_username,
          }
        : null,
    })),
    recentMovements: recentMovements.map((movement) => ({
      id: movement.id_resource_movement,
      type: movement.rsm_type,
      quantity: Number(movement.rsm_quantity),
      reason: movement.rsm_reason_for_movement,
      movementDate: movement.rsm_movement_date.toISOString(),
      user: movement.users
        ? {
            id: movement.users.id_user,
            username: movement.users.usr_username,
          }
        : null,
      person: movement.persons
        ? {
            id: movement.persons.id_person,
            fullName: buildFullName(
              movement.persons.prn_name,
              movement.persons.prn_lastname,
            ),
          }
        : null,
    })),
  };
}

export class InventoryService {
  async getCatalogs(actor: AuthenticatedUser): Promise<InventoryCatalogs> {
    const accessibleCampIds = actor.availableCamps.map((camp) => camp.id);
    const result = await inventoryRepository.listCatalogs({
      campIds: isSuperAdminRole(actor.roleName)
        ? undefined
        : accessibleCampIds.length
          ? accessibleCampIds
          : [actor.campId],
    });

    return {
      camps: result.camps.map((camp) => ({
        id: camp.id_camp,
        name: camp.cmp_name,
        status: camp.cmp_status,
      })),
      resourceTypes: result.resourceTypes.map((resourceType) => ({
        id: resourceType.id_resource_type,
        name: resourceType.rst_name,
        description: resourceType.rst_description,
        isPriority: resourceType.rst_is_priority,
      })),
      resources: result.resources.map((resource) => ({
        id: resource.id_resource,
        name: resource.rss_name,
        unit: resource.rss_unit,
        isActive: resource.rss_is_active,
        isRationable: resource.rss_is_rationable,
        typeId: resource.resource_types.id_resource_type,
        typeName: resource.resource_types.rst_name,
      })),
    };
  }

  async listInventory(filters: InventoryListFilters, actor: AuthenticatedUser) {
    if (filters.campId) {
      ensureCampScope(actor, filters.campId);
    }

    const resolvedCampId =
      filters.campId ??
      (isSuperAdminRole(actor.roleName) ? undefined : actor.campId);
    const search = filters.search?.trim();

    const where = {
      ...(resolvedCampId ? { id_camp: resolvedCampId } : {}),
      ...(filters.resourceTypeId
        ? { resources: { is: { id_resource_type: filters.resourceTypeId } } }
        : {}),
      ...(filters.priorityOnly
        ? {
            resources: {
              is: {
                resource_types: {
                  is: {
                    rst_is_priority: true,
                  },
                },
              },
            },
          }
        : {}),
      ...(filters.rationableOnly
        ? { resources: { is: { rss_is_rationable: true } } }
        : {}),
      ...(search
        ? {
            OR: [
              { resources: { is: { rss_name: { contains: search } } } },
              { camps: { is: { cmp_name: { contains: search } } } },
            ],
          }
        : {}),
    };

    if (filters.belowMinimum) {
      const snapshot = await inventoryRepository.listInventorySnapshot(where);
      const filteredItems = snapshot
        .map(mapInventorySummary)
        .filter((item) => item.isBelowMinimum);
      const startIndex = (filters.page - 1) * filters.pageSize;
      const paginatedItems = filteredItems.slice(
        startIndex,
        startIndex + filters.pageSize,
      );

      return {
        items: paginatedItems,
        pagination: {
          page: filters.page,
          pageSize: filters.pageSize,
          totalItems: filteredItems.length,
          totalPages: Math.max(
            1,
            Math.ceil(filteredItems.length / filters.pageSize),
          ),
        },
        appliedFilters: {
          ...filters,
          campId: resolvedCampId,
          search,
        },
        alerts: {
          belowMinimumCount: filteredItems.length,
        },
      };
    }

    const result = await inventoryRepository.listInventory({
      where,
      filters,
    });

    const items = result.items.map(mapInventorySummary);

    return {
      items,
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
      alerts: {
        belowMinimumCount: items.filter((item) => item.isBelowMinimum).length,
      },
    };
  }

  async getInventoryByStorageId(storageId: number, actor: AuthenticatedUser) {
    const storage = await inventoryRepository.findStorageById(storageId);

    if (!storage) {
      throw new AppError(
        404,
        "Inventory item not found.",
        "INVENTORY_ITEM_NOT_FOUND",
      );
    }

    ensureCampScope(actor, storage.id_camp);

    const recentMovements = await inventoryRepository.listResourceMovements({
      campId: storage.id_camp,
      resourceId: storage.id_resource,
    });

    return mapInventoryDetail(storage, recentMovements);
  }

  async applyAdjustment(
    input: InventoryAdjustmentInput,
    actor: AuthenticatedUser,
  ) {
    const resolvedCampId = input.id_camp ?? actor.campId;
    ensureCampScope(actor, resolvedCampId);

    const camp = await inventoryRepository.findCampById(resolvedCampId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "INVENTORY_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "Inventory can only be adjusted for active camps.",
        "INVENTORY_INVALID_CAMP_STATUS",
      );
    }

    const resource = await inventoryRepository.findResourceById(
      input.id_resource,
    );

    if (!resource) {
      throw new AppError(
        404,
        "Resource not found.",
        "INVENTORY_RESOURCE_NOT_FOUND",
      );
    }

    if (!resource.rss_is_active) {
      throw new AppError(
        400,
        "Inactive resources cannot be adjusted.",
        "INVENTORY_RESOURCE_INACTIVE",
      );
    }

    const existingStorage = await inventoryRepository.findStorageByCampResource(
      resolvedCampId,
      input.id_resource,
    );
    const previousQuantity = existingStorage
      ? Number(existingStorage.stg_quantity)
      : 0;
    const nextQuantity =
      input.mode === "set" ? input.quantity : previousQuantity + input.quantity;

    if (nextQuantity < 0) {
      throw new AppError(
        400,
        "Inventory quantity cannot become negative.",
        "INVENTORY_NEGATIVE_RESULT",
      );
    }

    const updatedStorage = await inventoryRepository.applyInventoryAdjustment({
      campId: resolvedCampId,
      resourceId: input.id_resource,
      reason: input.reason.trim(),
      newQuantity: Number(nextQuantity.toFixed(2)),
      delta: Number((nextQuantity - previousQuantity).toFixed(2)),
      actorUserId: actor.id,
    });

    const recentMovements = await inventoryRepository.listResourceMovements({
      campId: resolvedCampId,
      resourceId: input.id_resource,
    });

    return mapInventoryDetail(updatedStorage, recentMovements);
  }

  async updateThresholds(
    storageId: number,
    input: InventoryThresholdsInput,
    actor: AuthenticatedUser,
  ) {
    const storage = await inventoryRepository.findStorageById(storageId);

    if (!storage) {
      throw new AppError(
        404,
        "Inventory item not found.",
        "INVENTORY_ITEM_NOT_FOUND",
      );
    }

    ensureCampScope(actor, storage.id_camp);

    const nextMin =
      input.stg_min_quantity !== undefined
        ? input.stg_min_quantity
        : Number(storage.stg_min_quantity);
    const nextMax =
      input.stg_max_quantity !== undefined
        ? input.stg_max_quantity
        : toNumber(storage.stg_max_quantity);

    if (nextMax !== null && nextMax < nextMin) {
      throw new AppError(
        400,
        "Maximum quantity cannot be lower than minimum quantity.",
        "INVENTORY_INVALID_THRESHOLDS",
      );
    }

    const updatedStorage = await inventoryRepository.updateInventoryThresholds({
      storageId,
      actorUserId: actor.id,
      thresholds: {
        ...(input.stg_min_quantity !== undefined
          ? { stg_min_quantity: Number(input.stg_min_quantity.toFixed(2)) }
          : {}),
        ...(input.stg_max_quantity !== undefined
          ? {
              stg_max_quantity:
                input.stg_max_quantity === null
                  ? null
                  : Number(input.stg_max_quantity.toFixed(2)),
            }
          : {}),
      },
    });

    const recentMovements = await inventoryRepository.listResourceMovements({
      campId: updatedStorage.id_camp,
      resourceId: updatedStorage.id_resource,
    });

    return mapInventoryDetail(updatedStorage, recentMovements);
  }
}

export const inventoryService = new InventoryService();
