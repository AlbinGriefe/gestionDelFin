import { useState } from "react";
import { useExpeditions } from "../context/useExpeditions";
import ExpeditionRow from "./ExpeditionRow";
import styles from "./ExpeditionsList.module.css";
import type { ExpeditionSummary } from "../types/expeditions.types";

interface ExpeditionsListProps {
    onManage: (expedition: ExpeditionSummary) => void;
}

type StateFilter = "" | "planned" | "in_progress" | "returned" | "failed" | "cancelled";

const STATE_FILTER_OPTIONS: { value: StateFilter; label: string }[] = [
    { value: "", label: "Todas" },
    { value: "planned", label: "Planeadas" },
    { value: "in_progress", label: "En curso" },
    { value: "returned", label: "Regresadas" },
    { value: "failed", label: "Fallidas" },
    { value: "cancelled", label: "Canceladas" },
];

export default function ExpeditionsList({ onManage }: ExpeditionsListProps) {
    const { expeditions, loading, pagination, expeditionsFilters, setExpeditionsFilters } =
        useExpeditions();
    const [search, setSearch] = useState(expeditionsFilters.search ?? "");

    const handlePage = (page: number) => {
        setExpeditionsFilters({ ...expeditionsFilters, page });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setExpeditionsFilters({ ...expeditionsFilters, page: 1, search: search.trim() || undefined });
    };

    const handleState = (state: StateFilter) => {
        setExpeditionsFilters({
            ...expeditionsFilters,
            page: 1,
            state: state || undefined,
        });
    };

    if (loading) return <p className={styles.empty}>Cargando expediciones...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar expedición..."
                    />
                    <button type="submit" className={styles.searchBtn}>Buscar</button>
                </form>
                <div className={styles.statusFilters}>
                    {STATE_FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.statusBtn} ${(expeditionsFilters.state ?? "") === opt.value ? styles.statusBtnActive : ""}`}
                            onClick={() => handleState(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {expeditions.length === 0 ? (
                <p className={styles.empty}>No hay expediciones disponibles.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Salida</th>
                                    <th>Días est.</th>
                                    <th>Integrantes</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expeditions.map(expedition => (
                                    <ExpeditionRow
                                        key={expedition.id}
                                        expedition={expedition}
                                        onManage={onManage}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} expediciones
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
