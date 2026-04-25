type expeditions_exe_state =
    "planned"
    | "in_progress"
    | "returned"
    | "failed"
    | "cancelled"

export type ExpeditionListFilters = {
    page: number;
    pageSize: number;
    campId?: number;
    state?: expeditions_exe_state;
    search?: string;
}

export type ExpeditionCatalogFilters = {
    campId?: number;
}

export type ExpeditionMemberInput = {
    id_person: number;
    id_resource?: number | null;
    roleInExpedition?: string | null;
    rationsAssigned?: number;
    notes?: string | null;
}

export type ExpeditionCreateInput = {
    id_camp?: number;
    exs_name: string;
    exs_leaving_date: Date;
    exs_estimated_days?: number;
    exe_notes?: string | null;
    members: ExpeditionMemberInput[];
}

export type ExpeditionReturnMemberInput = {
    id_person: number;
    resourcesFound?: number;
    notes?: string | null;
}

export type ExpeditionStateUpdateInput = {
    nextState: "in_progress" | "returned" | "failed" | "cancelled";
    exe_resources_used?: number;
    exe_resources_returned?: number;
    exs_arriving_date?: Date | null;
    members?: ExpeditionReturnMemberInput[];
    notes?: string | null;
}

export type ExpeditionCatalogs = {
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
        isActive: boolean;
        campId: number | null;
    }>;
}

export interface ExpeditionSummary {
    id: number;
    name: string;
    state: expeditions_exe_state;
    camp: {
        id: number;
        name: string;
    };
    createdBy: {
        id: number;
        username: string;
    };
    leavingDate: string;
    arrivingDate: string | null;
    estimatedDays: number;
    extraDays: number;
    resourcesUsed: number;
    resourcesReturned: number;
    notes: string | null;
    createdAt: string;
    membersCount: number;
}

export interface ExpeditionDetail extends ExpeditionSummary {
    members: Array<{
        id: number;
        personId: number;
        fullName: string;
        resourceId: number | null;
        resourceName: string | null;
        roleInExpedition: string | null;
        rationsAssigned: number;
        resourcesFound: number;
        departureConfirmed: boolean;
        returnConfirmed: boolean;
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

export type ExpeditionsList = {
    items: ExpeditionSummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: ExpeditionListFilters;
}