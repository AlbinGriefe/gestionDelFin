import { httpClient } from '../../../shared/api/httpClient';
import type {
    ProfessionListFilters,
    ProfessionWriteInput,
    ProfessionList,
    ProfessionSummary,
    ProfessionCoverageResult,
    TemporaryReassignmentInput,
    ReassignmentResult,
    RevertReassignmentInput,
} from "../types/professions.types";


async function listProfessions(filters?: ProfessionListFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.campId) params.append("campId", String(filters.campId));
    if (filters?.collectsResources !== undefined) params.append("collectsResources", String(filters.collectsResources));
    if (filters?.active !== undefined) params.append("active", String(filters.active));

    return httpClient<ProfessionList>(`/professions?${params.toString()}`);
}

async function getProfessionById(professionId: number) {
    return httpClient<ProfessionSummary>(`/professions/${professionId}`);
}

async function createProfession(data: ProfessionWriteInput) {
    return httpClient<ProfessionSummary>("/professions", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

async function getProfessionCoverage(campId: number) {
    return httpClient<ProfessionCoverageResult>(`/professions/coverage?campId=${campId}`)
}

async function updateProfession(professionId: number, data: ProfessionWriteInput) {
    return httpClient<ProfessionSummary>(`/professions/${professionId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    })
}

async function createTemporaryReassignment(data: TemporaryReassignmentInput) {
    return httpClient<ReassignmentResult>(`/professions/temporary-reassignment`, {
        method: "POST",
        body: JSON.stringify(data),
    })
}

async function revertTemporaryReassignment(data: RevertReassignmentInput) {
    return httpClient<ReassignmentResult>(`/professions/revert-reassignment`, {
        method: "POST",
        body: JSON.stringify(data),
    })
}

export const professionsApi = {
    listProfessions,
    getProfessionById,
    createProfession,
    updateProfession,
    getProfessionCoverage,
    createTemporaryReassignment,
    revertTemporaryReassignment,
}
