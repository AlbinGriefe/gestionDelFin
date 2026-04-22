import { httpClient } from '../../../shared/api/httpClient';
import type { UsersCatalogs, UserDetail, UserWriteInput, UserList, UserListFilters } from '../types/user.types';

async function loadCatalogs() {
    return httpClient<UsersCatalogs>("/users/catalogs");
}

async function listUsers(filters?: UserListFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.campId) params.append("campId", String(filters.campId));
    if (filters?.roleId) params.append("roleId", String(filters.roleId));
    if (filters?.personId) params.append("personId", String(filters.personId));
    if (filters?.active !== undefined) params.append("active", String(filters.active));

    return httpClient<UserList>(`/users?${params.toString()}`);
}

async function getUserById(userId: number) {
    return httpClient<UserDetail>(`/users/${userId}`);
}

async function createUser(data: UserWriteInput) {
    return httpClient<UserDetail>("/users", {
        method: "POST",
        body: JSON.stringify(data),
    })
}

async function updateUser(userId: number, data: UserWriteInput) {
    return httpClient<UserDetail>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    })
}

export const usersApi = {
    loadCatalogs,
    listUsers,
    getUserById,
    createUser,
    updateUser,
}