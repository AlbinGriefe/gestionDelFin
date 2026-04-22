import { createContext } from "react";
import type { UserSummary, UserList, UserListFilters, UserWriteInput, UserDetail, UsersCatalogs } from "../types/user.types";

export interface UsersContextType {
    users: UserSummary[];
    catalogs: UsersCatalogs | null;
    pagination: UserList["pagination"] | null;
    loading: boolean;
    filters: UserListFilters;
    setFilters: (filters: UserListFilters) => void;
    loadUsers: () => Promise<void>;
    loadCatalogs: () => Promise<void>;
    getUserById: (userId: number) => Promise<UserDetail>;
    createUser: (data: UserWriteInput) => Promise<UserDetail>;
    updateUser: (userId: number, data: UserWriteInput) => Promise<UserDetail>;
}

export const UsersContext = createContext<UsersContextType | null>(null);