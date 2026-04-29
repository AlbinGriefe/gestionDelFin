import { httpClient } from '../../../shared/api/httpClient';
import type { CampListFilters, CampWriteInput, CampDetail, CampList } from '../types/camps.types';

async function listCamps(filters?: CampListFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);

    return httpClient<CampList>(`/camps?${params.toString()}`);
}

async function getCampById(campId: number) {
    return httpClient<CampDetail>(`/camps/${campId}`);
}

async function createCamp(data: CampWriteInput) {
    return httpClient<CampDetail>("/camps", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

async function updateCamp(campId: number, data: CampWriteInput) {
    return httpClient<CampDetail>(`/camps/${campId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    })
}

export const campsApi = {
    listCamps,
    getCampById,
    createCamp,
    updateCamp,
}