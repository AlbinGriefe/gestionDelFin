import { useEffect, useState } from "react";
import { useCamps } from "../context/useCamps";
import CampRow from "./CampRow";
import styles from "./CampsList.module.css";
import type { CampSummary } from "../types/camps.types";

interface CampsListProps {
    onEdit: (camp: CampSummary) => void;
}

type StatusFilter = "" | "active" | "inactive" | "destroyed" | "abandoned";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "", label: "Todos" },
    { value: "active", label: "Activo" },
    { value: "inactive", label: "Inactivo" },
    { value: "destroyed", label: "Destruido" },
    { value: "abandoned", label: "Abandonado" },
];

export default function CampsList({ onEdit }: CampsListProps) {
    const { camps, loading, loadCamps, pagination, filters, setFilters } = useCamps();
    const [search, setSearch] = useState(filters.search ?? "");

    useEffect(() => {
        loadCamps();
    }, [loadCamps]);

    const handlePage = (page: number) => {
        setFilters({ ...filters, page });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1, search: search.trim() || undefined });
    };

    const handleStatus = (status: StatusFilter) => {
        setFilters({ ...filters, page: 1, status: status || undefined });
    };

    if (loading) return <p className={styles.empty}>Cargando campamentos...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar campamento..."
                    />
                    <button type="submit" className={styles.searchBtn}>Buscar</button>
                </form>
                <div className={styles.statusFilters}>
                    {STATUS_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.statusBtn} ${(filters.status ?? "") === opt.value ? styles.statusBtnActive : ""}`}
                            onClick={() => handleStatus(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {camps.length === 0 ? (
                <p className={styles.empty}>No hay campamentos disponibles.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Ubicación</th>
                                    <th>Estado</th>
                                    <th>Ocupación</th>
                                    <th>Personas</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {camps.map(camp => (
                                    <CampRow key={camp.id} camp={camp} onEdit={onEdit} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} campamentos
                            </span>
                            <div className={styles.paginationControls}>
                                <button className={styles.pageBtn} onClick={() => handlePage(1)} disabled={pagination.page === 1}>«</button>
                                <button className={styles.pageBtn} onClick={() => handlePage(pagination.page - 1)} disabled={pagination.page === 1}>‹</button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
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
                                <button className={styles.pageBtn} onClick={() => handlePage(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>›</button>
                                <button className={styles.pageBtn} onClick={() => handlePage(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}>»</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
