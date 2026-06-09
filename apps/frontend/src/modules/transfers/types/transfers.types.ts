type transfers_tfs_state =
    "returned"
    | "cancelled"
    | "pending"
    | "accepted"
    | "declined"
    | "scheduled"
    | "in_transit"
    | "delivered"
    | "failed"
    | "completed"

type transfers_tfs_type = "resources" | "people" | "mixed"

export type TransferListFilters = {
    page: number;
    pageSize: number;
    campId?: number;
    state?: transfers_tfs_state;
    type?: transfers_tfs_type;
    search?: string;
}

export type TransferCatalogFilters = {
    originCampId?: number;
}

export type TransferPersonItemInput = {
    id_person: number;
    assignedRations?: number;
    notes?: string | null;
}

export type TransferResourceItemInput = {
    id_resource: number;
    quantity: number;
    notes?: string | null;
}

export type TransferCreateInput = {
    id_origin_camp?: number;
    id_destiny_camp: number;
    tfs_type: transfers_tfs_type;
    tfs_comments?: string | null;
    persons?: TransferPersonItemInput[];
    resources?: TransferResourceItemInput[];
}

export type TransferStateUpdateInput = {
    nextState: transfers_tfs_state;
    comments?: string | null;
}

export type TransferCatalogs = {
    camps: Array<{
        id: number;
        name: string;
        status: string;
    }>;
    persons: Array<{
        id: number;
        fullName: string;
        documentNumber: string | null;
        campId: number;
    }>;
    resources: Array<{
        id: number;
        name: string;
        unit: string;
        availableQuantity: number;
        campId: number;
        typeId: number;
        typeName: string;
    }>;
}

export interface TransferSummary {
    id: number;
    type: transfers_tfs_type;
    state: transfers_tfs_state;
    comments: string | null;
    requestedDate: string;
    acceptedRequestDate: string | null;
    shipmentDate: string | null;
    arrivalDate: string | null;
    returnDate: string | null;
    originCamp: {
        id: number;
        name: string;
    };
    destinyCamp: {
        id: number;
        name: string;
    };
    requestedBy: {
        id: number;
        username: string;
    };
    counts: {
        persons: number;
        resources: number;
    };
}

export interface TransferDetail extends TransferSummary {
    acceptedBy: {
        id: number;
        username: string;
    } | null;
    approvedOriginBy: {
        id: number;
        username: string;
    } | null;
    approvedDestinyBy: {
        id: number;
        username: string;
    } | null;
    persons: Array<{
        id: number;
        personId: number;
        fullName: string;
        assignedRations: number;
        departureConfirmed: boolean;
        arrivalConfirmed: boolean;
        returnedToOrigin: boolean;
        notes: string | null;
    }>;
    resources: Array<{
        id: number;
        resourceId: number;
        name: string;
        unit: string;
        quantity: number;
        confirmedLeaving: boolean;
        confirmedArriving: boolean;
        notes: string | null;
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

export type TransfersList = {
    items: TransferSummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: TransferListFilters;
}
