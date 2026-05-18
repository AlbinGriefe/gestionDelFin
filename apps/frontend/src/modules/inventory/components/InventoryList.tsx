import { useState } from "react";
import { useInventory } from "../context/useInventory";
import InventoryRow from "./InventoryRow";
import type { InventorySummary } from "../types/inventory.types";
import styles from "./InventoryList.module.css";

interface InventoryListProps {
    onAdjust: (item: InventorySummary) => void;
    onThresholds: (item: InventorySummary) => void;
}

export default function InventoryList({ onAdjust, onThresholds }: InventoryListProps) {
    const { inventories, loading, pagination, filters, setFilters, catalogs } = useInventory();
    const [search, setSearch] = useState(filters.search ?? "");

    const handlePage = (page: number) => setFilters({ ...filters, page });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1, search: search.trim() || undefined });
    };

    const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFilters({ ...filters, page: 1, resourceTypeId: val ? Number(val) : undefined });
    };

    const toggleBelowMin = () => {
        setFilters({ ...filters, page: 1, belowMinimum: filters.belowMinimum ? undefined : true });
    };

    const togglePriority = () => {
        setFilters({ ...filters, page: 1, priorityOnly: filters.priorityOnly ? undefined : true });
    };

    const belowMinCount = inventories.filter(i => i.isBelowMinimum).length;

    if (loading) return <p className={styles.empty}>Cargando inventario...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar recurso o campamento..."
                    />
                    <button type="submit" className={styles.searchBtn}>Buscar</button>
                </form>

                <select
                    className={styles.selectFilter}
                    value={filters.resourceTypeId ?? ""}
                    onChange={handleTypeFilter}
                >
                    <option value="">Todos los tipos</option>
                    {catalogs?.resourceTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                </select>

                <div className={styles.pillGroup}>
                    <button
                        type="button"
                        className={`${styles.pill} ${filters.belowMinimum ? styles.pillDanger : ""}`}
                        onClick={toggleBelowMin}
                    >
                        {filters.belowMinimum ? "✕ " : ""}Bajo mínimo
                        {belowMinCount > 0 && !filters.belowMinimum && (
                            <span className={styles.alertCount}>{belowMinCount}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`${styles.pill} ${filters.priorityOnly ? styles.pillActive : ""}`}
                        onClick={togglePriority}
                    >
                        {filters.priorityOnly ? "✕ " : ""}Solo prioritarios
                    </button>
                </div>
            </div>

            {inventories.length === 0 ? (
                <p className={styles.empty}>No hay recursos que coincidan con los filtros.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Recurso</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Estado</th>
                                    <th>Mín / Máx</th>
                                    <th>Actualizado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventories.map(item => (
                                    <InventoryRow
                                        key={item.storageId}
                                        item={item}
                                        onAdjust={onAdjust}
                                        onThresholds={onThresholds}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} recursos
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
