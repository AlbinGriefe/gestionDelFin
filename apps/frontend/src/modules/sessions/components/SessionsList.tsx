import { useEffect } from "react";
import { useSessions } from "../context/useSessions";
import SessionRow from "./SessionRow";
import styles from "./SessionsList.module.css";
import type { SessionSummary } from "../types/sessions.types";

interface SessionsListProps {
    onRevoke: (session: SessionSummary) => void;
}

type ActiveFilter = "" | "active";

const ACTIVE_FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
    { value: "", label: "Todas" },
    { value: "active", label: "Activas" },
];

const REASON_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Todos los motivos" },
    { value: "manual", label: "Manual" },
    { value: "timeout", label: "Inactividad" },
    { value: "forced", label: "Forzado" },
    { value: "camp_change", label: "Cambio de campamento" },
    { value: "security", label: "Seguridad" },
];

export default function SessionsList({ onRevoke }: SessionsListProps) {
    const { sessions, loading, loadSessions, pagination, filters, setFilters } =
        useSessions();

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handlePage = (page: number) => {
        setFilters({ ...filters, page });
    };

    const handleActive = (value: ActiveFilter) => {
        setFilters({ ...filters, page: 1, active: value === "active" ? true : undefined });
    };

    const handleReason = (reason: string) => {
        setFilters({
            ...filters,
            page: 1,
            reason: (reason || undefined) as SessionSummary["signOutReason"] | undefined,
        });
    };

    const activeValue: ActiveFilter = filters.active ? "active" : "";

    if (loading) return <p className={styles.empty}>Cargando sesiones...</p>;

    return (
        <div>
            <div className={styles.filterBar}>
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
                </div>
                <select
                    className={styles.reasonSelect}
                    value={filters.reason ?? ""}
                    onChange={e => handleReason(e.target.value)}
                >
                    {REASON_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {sessions.length === 0 ? (
                <p className={styles.empty}>No hay sesiones disponibles.</p>
            ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Campamento</th>
                                    <th>IP</th>
                                    <th>Inicio</th>
                                    <th>Expira</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map(session => (
                                    <SessionRow
                                        key={session.id}
                                        session={session}
                                        onRevoke={onRevoke}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span className={styles.paginationInfo}>
                                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} sesiones
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
