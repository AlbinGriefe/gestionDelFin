import { useEffect, useState } from "react";
import { useProfessions } from "../context/useProfessions";
import ProfessionRow from "./ProfessionRow";
import styles from "./ProfessionsList.module.css";
import type { ProfessionSummary } from "../types/professions.types";

interface ProfessionsListProps {
    onEdit: (profession: ProfessionSummary) => void;
}

type ActiveFilter = "" | "active" | "inactive";

const ACTIVE_FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
    { value: "", label: "Todas" },
    { value: "active", label: "Activas" },
    { value: "inactive", label: "Inactivas" },
];

export default function ProfessionsList({ onEdit }: ProfessionsListProps) {
    const { professions, loading, loadProfessions, pagination, filters, setFilters } =
        useProfessions();
    const [search, setSearch] = useState(filters.search ?? "");

    useEffect(() => {
        loadProfessions();
    }, [loadProfessions]);

    const handlePage = (page: number) => {
        setFilters({ ...filters, page });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1, search: search.trim() || undefined });
    };

    const handleActive = (value: ActiveFilter) => {
        setFilters({
            ...filters,
            page: 1,
            active: value === "" ? undefined : value === "active",
        });
    };

    const handleToggleCollects = () => {
        setFilters({
            ...filters,
            page: 1,
            collectsResources: filters.collectsResources ? undefined : true,
        });
    };

    const activeValue: ActiveFilter =
        filters.active === undefined ? "" : filters.active ? "active" : "inactive";

    if (loading) return <p className={styles.empty}>Cargando profesiones...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar profesión..."
                    />
                    <button type="submit" className={styles.searchBtn}>Buscar</button>
                </form>
                <div className={styles.statusFilters}>
                    {ACTIVE_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.statusBtn} ${activeValue === opt.value ? styles.statusBtnActive : ""}`}
                            onClick={() => handleActive(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`${styles.statusBtn} ${filters.collectsResources ? styles.statusBtnActive : ""}`}
                        onClick={handleToggleCollects}
                    >
                        Recolectan recursos
                    </button>
                </div>
            </div>

            {professions.length === 0 ? (
                <p className={styles.empty}>No hay profesiones disponibles.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Recolecta</th>
                                    <th>Comida/día</th>
                                    <th>Agua/día</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {professions.map(profession => (
                                    <ProfessionRow
                                        key={profession.id}
                                        profession={profession}
                                        onEdit={onEdit}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} profesiones
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
