import type {
  InventoryCatalogs,
  InventoryListFilters,
  InventoryDetail,
  InventoryAdjustmentInput,
  InventoryThresholdsInput,
  InventoryList,
} from "../types/inventory.types";

import { httpClient } from "../../../shared/api/httpClient";

async function loadCatalogs() {
  return httpClient<InventoryCatalogs>("/inventory/catalogs");
}

async function listInventories(filters: InventoryListFilters) {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.campId) params.append("campId", String(filters.campId));
  if (filters?.resourceTypeId)
    params.append("resourceTypeId", String(filters.resourceTypeId));
  if (filters?.priorityOnly)
    params.append("priorityOnly", String(filters.priorityOnly));
  if (filters?.belowMinimum)
    params.append("belowMinimum", String(filters.belowMinimum));
  if (filters?.rationableOnly)
    params.append("rationableOnly", String(filters.rationableOnly));

  return httpClient<InventoryList>(`/inventory?${params.toString()}`);
}

async function getInventoryById(inventoryId: number) {
  return httpClient<InventoryDetail>(`/inventory/${inventoryId}`);
}

async function inventoryAdjustments(data: InventoryAdjustmentInput) {
  return httpClient<InventoryDetail>("/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function inventoryThresholds(
  inventoryId: number,
  data: InventoryThresholdsInput,
) {
  return httpClient<InventoryDetail>(`/inventory/${inventoryId}/thresholds`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export const inventoryApi = {
  loadCatalogs,
  listInventories,
  getInventoryById,
  inventoryAdjustments,
  inventoryThresholds,
};
