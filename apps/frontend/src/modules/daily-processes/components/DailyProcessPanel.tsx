import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { dailyProcessesApi } from "../api/daily-processes.api";
import { useAuth } from "../../auth/context/useAuth";
import ProductionExceptionForm from "./ProductionExceptionForm";
import type { DailyProcessRunResult, DailyProcessStatus } from "../types/daily-processes.types";
import styles from "./DailyProcessPanel.module.css";

const AUTHORIZED_ROLES = ["administrador sistema", "gestion recursos"];

function normalizeRole(role: string) {
    return role.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function canRunProcess(roleName: string) {
    const norm = normalizeRole(roleName);
    return AUTHORIZED_ROLES.some(r => norm.includes(normalizeRole(r).split(" ")[0]));
}

const fmtFull = (iso: string) =>
    new Date(iso).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" });

export default function DailyProcessPanel() {
    const { user } = useAuth();
    const [status, setStatus] = useState<DailyProcessStatus | null>(null);
    const [result, setResult] = useState<DailyProcessRunResult | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [running, setRunning] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [exceptionOpen, setExceptionOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const authorized = user ? canRunProcess(user.roleName) : false;

    const loadStatus = useCallback(async () => {
        if (!user) return;
        try {
            const data = await dailyProcessesApi.getDailyProcessesStatus(user.campId);
            setStatus(data);
            if (data.ranToday && data.summary) {
                setResult(data.summary as unknown as DailyProcessRunResult);
            }
        } catch {
            
        } finally {
            setLoadingStatus(false);
        }
    }, [user]);

    useEffect(() => { loadStatus(); }, [loadStatus]);

    const handleRun = async () => {
        if (!user) return;
        setRunning(true);
        try {
            const data = await dailyProcessesApi.runDailyProcesses({ campId: user.campId });
            setResult(data);
            setStatus(prev => prev ? { ...prev, ranToday: true, lastRunAt: data.runAt } : prev);
            setResultsOpen(true);
            if (data.alreadyRunToday) {
                toast.info("El proceso ya había sido ejecutado hoy. Mostrando resultados guardados.");
            } else {
                toast.success("Proceso diario ejecutado correctamente");
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            toast.error(`No se pudo ejecutar: ${msg}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <div className={styles.panel}>
                <div className={styles.panelHeader} onClick={() => setCollapsed(p => !p)}>
                    <div className={styles.panelTitle}>
                        <span className={styles.panelIcon}>⚙</span>
                        <span>Proceso del día</span>
                        {!loadingStatus && (
                            <span className={status?.ranToday ? styles.statusDone : styles.statusPending}>
                                {status?.ranToday ? "Ejecutado" : "Pendiente"}
                            </span>
                        )}
                    </div>
                    <span className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ""}`}>▼</span>
                </div>

                {!collapsed && (
                    <div className={styles.panelBody}>
                        {loadingStatus ? (
                            <p className={styles.loading}>Verificando estado...</p>
                        ) : (
                            <>
                                <div className={styles.statusRow}>
                                    {status?.ranToday ? (
                                        <p className={styles.statusText}>
                                            Ejecutado el {status.lastRunAt ? fmtFull(status.lastRunAt) : "hoy"}.
                                            Producción y raciones ya fueron procesadas.
                                        </p>
                                    ) : (
                                        <p className={styles.statusText}>
                                            El proceso del día aún no ha sido ejecutado para{" "}
                                            <strong>{user?.campName}</strong>.
                                            Al ejecutarlo se calculará la producción de todos los
                                            trabajadores y se distribuirán las raciones.
                                        </p>
                                    )}
                                </div>

                                <div className={styles.actions}>
                                    {authorized && (
                                        <button
                                            className={status?.ranToday ? styles.btnSecondary : styles.btnRun}
                                            onClick={handleRun}
                                            disabled={running}
                                        >
                                            {running
                                                ? "Ejecutando..."
                                                : status?.ranToday
                                                    ? "Ver resultado del día"
                                                    : "Ejecutar proceso del día"
                                            }
                                        </button>
                                    )}
                                    {authorized && (
                                        <button
                                            className={styles.btnException}
                                            onClick={() => setExceptionOpen(true)}
                                        >
                                            Registrar excepción de producción
                                        </button>
                                    )}
                                </div>

                                {result && resultsOpen && (
                                    <div className={styles.results}>
                                        <div className={styles.resultsHeader}>
                                            <span className={styles.resultsTitle}>
                                                Resultado del proceso — {result.campName}
                                            </span>
                                            <button
                                                className={styles.closeResults}
                                                onClick={() => setResultsOpen(false)}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className={styles.totalsGrid}>
                                            <div className={styles.totalCard}>
                                                <span className={styles.totalValue}>
                                                    {result.production.totals.foodProduced}
                                                </span>
                                                <span className={styles.totalLabel}>Alimento producido</span>
                                            </div>
                                            <div className={styles.totalCard}>
                                                <span className={styles.totalValue}>
                                                    {result.production.totals.waterProduced}
                                                </span>
                                                <span className={styles.totalLabel}>Agua producida</span>
                                            </div>
                                            <div className={styles.totalCard}>
                                                <span className={styles.totalValue}>
                                                    {result.production.totals.personsProcessed}
                                                </span>
                                                <span className={styles.totalLabel}>Personas trabajaron</span>
                                            </div>
                                            <div className={styles.totalCard}>
                                                <span className={styles.totalValue}>
                                                    {result.production.totals.personsSkipped}
                                                </span>
                                                <span className={styles.totalLabel}>Personas sin trabajo</span>
                                            </div>
                                        </div>

                                        {result.rations.rations.length > 0 && (
                                            <>
                                                <p className={styles.subLabel}>Raciones distribuidas</p>
                                                <table className={styles.rationTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>Recurso</th>
                                                            <th>Ración / persona</th>
                                                            <th>Total consumido</th>
                                                            <th>Stock final</th>
                                                            <th>Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.rations.rations.map(r => (
                                                            <tr key={r.resourceId}>
                                                                <td>{r.resourceName}</td>
                                                                <td>{r.rationPerPerson}</td>
                                                                <td>{r.totalConsumed}</td>
                                                                <td>{r.stockAfter}</td>
                                                                <td>
                                                                    {r.isBelowMinimum
                                                                        ? <span className={styles.badgeCritical}>Bajo mínimo</span>
                                                                        : <span className={styles.badgeOk}>OK</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {exceptionOpen && (
                <ProductionExceptionForm onClose={() => setExceptionOpen(false)} />
            )}
        </>
    );
}
