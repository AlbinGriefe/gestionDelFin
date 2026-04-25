import type {
    ExpeditionListFilters,
    ExpeditionCatalogFilters,
    ExpeditionCreateInput,
    ExpeditionStateUpdateInput,
    ExpeditionCatalogs,
    ExpeditionDetail,
    ExpeditionsList,

} from "../types/expeditions.types";

import { httpClient } from "../../../shared/api/httpClient";

async function loadCatalogs(filters: ExpeditionCatalogFilters) {
    const params = new URLSearchParams();

    if (filters?.campId) params.append("campId", String(filters.campId));

    return httpClient<ExpeditionCatalogs>(`/expeditions/catalogs?${params.toString()}`);
}

async function listExpeditions(filters: ExpeditionListFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.state) params.append("state", filters.state);
    if (filters?.campId) params.append("campId", String(filters.campId));

    return httpClient<ExpeditionsList>(`/expeditions?${params.toString()}`);
}

async function getExpeditionById(expeditionId: number) {
    return httpClient<ExpeditionDetail>(`/expeditions/${expeditionId}`);
}

async function createExpedition(data: ExpeditionCreateInput) {
    return httpClient<ExpeditionDetail>("/expeditions", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

async function updateExpeditionState(expeditionId: number, data: ExpeditionStateUpdateInput) {
    return httpClient<ExpeditionDetail>(`/expeditions/${expeditionId}/state`, {
        method: "PATCH",
        body: JSON.stringify(data),
    })
}

export const expeditionApi = {

    loadCatalogs,
    listExpeditions,
    getExpeditionById,
    createExpedition,
    updateExpeditionState,
}