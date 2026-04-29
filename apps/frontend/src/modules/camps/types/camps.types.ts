type camps_cmp_status = "active" | "destroyed" | "abandoned" | "inactive"

export type CampListFilters = {
    page: number;
    pageSize: number;
    search?: string;
    status?: camps_cmp_status;
}

export type CampWriteInput = {
    cmp_name?: string;
    cmp_location?: string;
    cmp_latitude?: string | number | null;
    cmp_longitude?: string | number | null;
    cmp_max_capacity?: number;
    cmp_status?: camps_cmp_status;
}

export interface CampSummary {
    id: number;
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    maxCapacity: number;
    status: camps_cmp_status;
    occupancy: {
        activePersons: number;
        utilizationRate: number;
        availableSpots: number;
    };
    counts: {
        activeUsers: number;
        professions: number;
        storageItems: number;
        expeditions: number;
        outgoingTransfers: number;
        incomingTransfers: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CampDetail extends CampSummary {
    metrics: {
        acceptedPersons: number;
        activeSessions: number;
        inventoryQuantityTotal: number;
        inventoryBelowMinimumCount: number;
        activeExpeditions: number;
        pendingTransfers: number;
    };
    recentUsers: Array<{
        id: number;
        username: string;
        roleName: string;
        isActive: boolean;
    }>;
    recentEvents: Array<{
        id: number;
        action: string;
        description: string | null;
        createdAt: string;
        actorUserId: number | null;
        oldValue: unknown;
        newValue: unknown;
    }>;
}

export type CampList = {
    items: CampSummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: CampListFilters;
};