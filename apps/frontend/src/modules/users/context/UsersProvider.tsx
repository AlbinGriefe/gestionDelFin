import { useState, useCallback } from "react";
import { UsersContext } from "./users.context";
import { usersApi } from "../api/users.api";
import type {
  UserSummary,
  UserList,
  UserListFilters,
  UserWriteInput,
  UserDetail,
  UsersCatalogs,
} from "../types/user.types";

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pagination, setPagination] = useState<UserList["pagination"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UserListFilters>({
    page: 1,
    pageSize: 20,
  });
  const [catalogs, setCatalogs] = useState<UsersCatalogs | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.listUsers(filters);
      setUsers(data.items);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCatalogs = useCallback(async () => {
    const data = await usersApi.loadCatalogs();
    setCatalogs(data);
  }, []);

  const getUserById = async (userId: number): Promise<UserDetail> => {
    return usersApi.getUserById(userId);
  };

  const createUser = async (data: UserWriteInput): Promise<UserDetail> => {
    const created = await usersApi.createUser(data);
    await loadUsers();
    return created;
  };

  const updateUser = async (
    userId: number,
    data: UserWriteInput,
  ): Promise<UserDetail> => {
    const updated = await usersApi.updateUser(userId, data);
    await loadUsers();
    return updated;
  };

  return (
    <UsersContext.Provider
      value={{
        users,
        pagination,
        loading,
        filters,
        catalogs,
        setFilters,
        loadUsers,
        loadCatalogs,
        getUserById,
        createUser,
        updateUser,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}
