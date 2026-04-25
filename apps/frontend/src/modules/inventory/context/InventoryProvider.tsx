import { useState, useCallback, useEffect } from "react";
import { InventoryContext } from "./inventory.context";
import { inventoryApi } from "../api/inventory.api";

import type {
    InventorySummary,
    InventoryList,
    InventoryListFilters,
    InventoryCatalogs,
    InventoryDetail,
    InventoryAdjustmentInput,
    InventoryThresholdsInput,
} from "../types/inventory.types";

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [inventories, setInventories] = useState<InventorySummary[]>([]);
    const [pagination, setPagination] = useState<InventoryList["pagination"] | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<InventoryList["appliedFilters"] | null>(null);
    const [catalogs, setCatalogs] = useState<InventoryCatalogs | null>(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<InventoryListFilters>({
        page: 1,
        pageSize: 20,
    });

    const loadInventories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await inventoryApi.listInventories(filters);
            setInventories(data.items);
            setPagination(data.pagination);
            setAppliedFilters(data.appliedFilters);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadCatalogs = useCallback(async () => {
        const data = await inventoryApi.loadCatalogs();
        setCatalogs(data);
    }, []);

    const getInventoryById = async (inventoryId: number): Promise<InventoryDetail> => {
        return inventoryApi.getInventoryById(inventoryId);
    };

    const inventoryAdjustments = async (
        data: InventoryAdjustmentInput
    ): Promise<InventoryDetail> => {
        const result = await inventoryApi.inventoryAdjustments(data);


        await loadInventories();

        return result;
    };

    const inventoryThresholds = async (
        inventoryId: number,
        data: InventoryThresholdsInput
    ): Promise<InventoryDetail> => {
        const result = await inventoryApi.inventoryThresholds(inventoryId, data);

        await loadInventories();

        return result;
    };

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    return (
        <InventoryContext.Provider
            value={{
                inventories,
                pagination,
                loading,
                filters,
                appliedFilters,
                catalogs,
                setFilters,
                loadInventories,
                loadCatalogs,
                getInventoryById,
                inventoryAdjustments,
                inventoryThresholds,
            }}
        >
            {children}
        </InventoryContext.Provider>
    );
}