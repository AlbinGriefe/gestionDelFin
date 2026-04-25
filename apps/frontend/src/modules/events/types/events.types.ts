export interface EventListFilters {
    page: number;
    pageSize: number;
    campId?: number;
    entity?: string;
    entityId?: number;
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface EventSummary {
    id: number;
    entity: string;
    entityId: number | null;
    action: string;
    description: string | null;
    oldValue: unknown;
    newValue: unknown;
    campId: number | null;
    userId: number | null;
    createdAt: string;
}

export type EventsList = {
    items: EventSummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: EventListFilters;
}