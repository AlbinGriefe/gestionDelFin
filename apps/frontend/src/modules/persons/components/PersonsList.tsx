import { useState } from "react";
import { usePersons } from "../context/usePersons";
import PersonRow from "./PersonRow";
import styles from "./PersonsList.module.css";
import type { PersonSummary } from "../types/persons.types";

interface PersonsListProps {
    onEdit: (person: PersonSummary) => void;
}

const ACCEPTED_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "true", label: "Aceptados" },
    { value: "false", label: "Pendientes" },
];

const ACTIVE_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "true", label: "Activos" },
    { value: "false", label: "Inactivos" },
];

export default function PersonsList({ onEdit }: PersonsListProps) {
    const { persons, loading, pagination, filters, setFilters, catalogs } = usePersons();
    const [search, setSearch] = useState(filters.search ?? "");

    const handlePage = (page: number) => setFilters({ ...filters, page });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1, search: search.trim() || undefined });
    };

    const handleProfession = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFilters({ ...filters, page: 1, professionId: val ? Number(val) : undefined });
    };

    const handleHealth = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFilters({ ...filters, page: 1, healthId: val ? Number(val) : undefined });
    };

    const handleAccepted = (val: string) => {
        setFilters({ ...filters, page: 1, accepted: val === "" ? undefined : val === "true" });
    };

    const handleActive = (val: string) => {
        setFilters({ ...filters, page: 1, active: val === "" ? undefined : val === "true" });
    };

    const currentAccepted = filters.accepted === undefined ? "" : String(filters.accepted);
    const currentActive = filters.active === undefined ? "" : String(filters.active);

    if (loading) return <p className={styles.empty}>Cargando personas...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o documento..."
                    />
                    <button type="submit" className={styles.searchBtn}>Buscar</button>
                </form>

                <select
                    className={styles.selectFilter}
                    value={filters.professionId ?? ""}
                    onChange={handleProfession}
                >
                    <option value="">Todas las profesiones</option>
                    {catalogs?.professions.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select
                    className={styles.selectFilter}
                    value={filters.healthId ?? ""}
                    onChange={handleHealth}
                >
                    <option value="">Todos los estados de salud</option>
                    {catalogs?.healthStatuses.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                </select>

                <div className={styles.pillGroup}>
                    {ACCEPTED_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.pill} ${currentAccepted === opt.value ? styles.pillActive : ""}`}
                            onClick={() => handleAccepted(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className={styles.pillGroup}>
                    {ACTIVE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.pill} ${currentActive === opt.value ? styles.pillActive : ""}`}
                            onClick={() => handleActive(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {persons.length === 0 ? (
                <p className={styles.empty}>No hay personas que coincidan con los filtros.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Documento</th>
                                    <th>Profesión</th>
                                    <th>Salud</th>
                                    <th>Admisión</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {persons.map(person => (
                                    <PersonRow key={person.id} person={person} onEdit={onEdit} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} personas
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
