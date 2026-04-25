export type InventoryListFilters = {
    page: number;
    pageSize: number;
    campId?: number;
    resourceTypeId?: number;
    search?: string;
    belowMinimum?: boolean;
    priorityOnly?: boolean;
    rationableOnly?: boolean;
}

export type InventoryAdjustmentInput = {
    id_camp?: number;
    id_resource: number;
    mode: "set" | "delta";
    quantity: number;
    reason: string;
}

export type InventoryThresholdsInput = {
    stg_min_quantity?: number;
    stg_max_quantity?: number | null;
}

export type InventoryCatalogs = {
    camps: Array<{
        id: number;
        name: string;
        status: string;
    }>;
    resourceTypes: Array<{
        id: number;
        name: string;
        description: string | null;
        isPriority: boolean;
    }>;
    resources: Array<{
        id: number;
        name: string;
        unit: string;
        isActive: boolean;
        isRationable: boolean;
        typeId: number;
        typeName: string;
    }>;
}

export interface InventorySummary {
    storageId: number;
    camp: {
        id: number;
        name: string;
    };
    resource: {
        id: number;
        name: string;
        unit: string;
        isRationable: boolean;
        isActive: boolean;
        type: {
            id: number;
            name: string;
            isPriority: boolean;
        };
    };
    quantity: number;
    minQuantity: number;
    maxQuantity: number | null;
    isBelowMinimum: boolean;
    lastUpdatedAt: string;
}

export interface InventoryDetail extends InventorySummary {
    recentRecords: Array<{
        id: number;
        previousQuantity: number;
        newQuantity: number;
        reason: string;
        isBelowMinimum: boolean;
        recordedAt: string;
        user: {
            id: number;
            username: string;
        } | null;
    }>;
    recentMovements: Array<{
        id: number;
        type: string;
        quantity: number;
        reason: string;
        movementDate: string;
        user: {
            id: number;
            username: string;
        } | null;
        person: {
            id: number;
            fullName: string;
        } | null;
    }>;
}

export type InventoryList = {
    items: InventorySummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: InventoryListFilters;
}