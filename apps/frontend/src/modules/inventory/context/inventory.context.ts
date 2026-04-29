import { createContext } from "react";
import type {
    InventoryCatalogs,
    InventoryListFilters,
    InventoryDetail,
    InventoryAdjustmentInput,
    InventoryThresholdsInput,
    InventoryList,
    InventorySummary,
} from "../types/inventory.types";

export interface InventoryContextType {
    inventories: InventorySummary[];
    pagination: InventoryList["pagination"] | null;
    loading: boolean;
    filters: InventoryListFilters;
    appliedFilters: InventoryList["appliedFilters"] | null;
    catalogs: InventoryCatalogs | null;
    setFilters: (filters: InventoryListFilters) => void;
    loadInventories: () => Promise<void>;
    loadCatalogs: () => Promise<void>;
    getInventoryById: (inventoryId: number) => Promise<InventoryDetail>;
    inventoryAdjustments: (data: InventoryAdjustmentInput) => Promise<InventoryDetail>;
    inventoryThresholds: (inventoryId: number, data: InventoryThresholdsInput) => Promise<InventoryDetail>;
}

export const InventoryContext = createContext<InventoryContextType | null>(null);