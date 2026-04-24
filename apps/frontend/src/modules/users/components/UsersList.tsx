import { useEffect } from "react";
import { useUsers } from "../context/useUsers";
import UserRow from "./UserRow";
import styles from "./UsersList.module.css";
import type { UserSummary } from "../types/user.types";

interface UsersListProps {
    onEdit: (user: UserSummary) => void;
}

export default function UsersList({ onEdit }: UsersListProps) {
    const { users, loading, loadUsers, pagination, filters, setFilters } = useUsers();

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handlePage = (page: number) => {
        setFilters({ ...filters, page });
    };

    if (loading) return <p className={styles.empty}>Cargando usuarios...</p>;
    if (users.length === 0) return <p className={styles.empty}>No hay usuarios disponibles.</p>;

    return (
        <div>
            <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Sesiones activas</th>
                            <th>Creado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <UserRow key={user.id} user={user} onEdit={onEdit} />
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                        Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} usuarios
                    </span>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePage(1)}
                            disabled={pagination.page === 1}
                        >
                            «
                        </button>
                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePage(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            ‹
                        </button>

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(p =>
                                p === 1 ||
                                p === pagination.totalPages ||
                                Math.abs(p - pagination.page) <= 1
                            )
                            .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`${styles.pageBtn} ${p === pagination.page ? styles.pageBtnActive : ""}`}
                                        onClick={() => handlePage(p as number)}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            ›
                        </button>
                        <button
                            className={styles.pageBtn}
                            onClick={() => handlePage(pagination.totalPages)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}