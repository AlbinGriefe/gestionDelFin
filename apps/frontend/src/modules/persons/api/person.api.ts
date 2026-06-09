import { httpClient } from '../../../shared/api/httpClient';
import type {
    PersonListFilters,
    PersonWriteInput,
    PersonsCatalogs,
    PersonDetail,
    PersonList,
} from "../types/persons.types";

async function loadCatalogs() {
    return httpClient<PersonsCatalogs>("/persons/catalogs");
}

async function listPersons(filters?: PersonListFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.campId) params.append("campId", String(filters.campId));
    if (filters?.professionId) params.append("professionId", String(filters.professionId));
    if (filters?.healthId) params.append("healthId", String(filters.healthId));
    if (filters?.accepted !== undefined) params.append("accepted", String(filters.accepted));
    if (filters?.admissionStatus) params.append("admissionStatus", filters.admissionStatus);
    if (filters?.active !== undefined) params.append("active", String(filters.active));

    return httpClient<PersonList>(`/persons?${params.toString()}`);
}

async function getPersonById(personId: number) {
    return httpClient<PersonDetail>(`/persons/${personId}`);
}

async function createPerson(data: PersonWriteInput) {
    return httpClient<PersonDetail>("/persons", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

async function updatePerson(personId: number, data: PersonWriteInput) {
    return httpClient<PersonDetail>(`/persons/${personId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    })
}

export const personsApi = {
    loadCatalogs,
    listPersons,
    getPersonById,
    createPerson,
    updatePerson,
}
