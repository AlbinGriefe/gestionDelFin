import { useState } from "react";
import type { ExpeditionSummary } from "../types/expeditions.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./ExpeditionRow.module.css";

const fmt = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATE_LABELS: Record<string, string> = {
    planned: "Planeada",
    in_progress: "En curso",
    returned: "Regresada",
    failed: "Fallida",
    cancelled: "Cancelada",
};

const STATE_STYLES: Record<string, { bg: string; color: string }> = {
    planned: { bg: "#E6F1FB", color: "#185FA5" },
    in_progress: { bg: "#FEF3E2", color: "#7A4500" },
    returned: { bg: "#EAF3DE", color: "#3B6D11" },
    failed: { bg: "#FDECEA", color: "#8B2020" },
    cancelled: { bg: "#F1EFE8", color: "#5F5E5A" },
};

const MANAGEABLE_STATES = ["planned", "in_progress"];

interface ExpeditionRowProps {
    expedition: ExpeditionSummary;
    onManage: (expedition: ExpeditionSummary) => void;
}

export default function ExpeditionRow({ expedition, onManage }: ExpeditionRowProps) {
    const [isOpen, setIsOpen] = useState(false);
    const stateStyle = STATE_STYLES[expedition.state] ?? STATE_STYLES.planned;
    const canManage = MANAGEABLE_STATES.includes(expedition.state);

    return (
        <>
            <tr className={styles.row} onClick={() => setIsOpen(prev => !prev)}>
                <td className={styles.td} style={{ fontWeight: 500 }}>{expedition.name}</td>
                <td className={styles.td} style={{ color: "#555" }}>{fmt(expedition.leavingDate)}</td>
                <td className={styles.td} style={{ color: "#555" }}>
                    {expedition.estimatedDays}
                    {expedition.extraDays > 0 && <span className={styles.extra}> (+{expedition.extraDays})</span>}
                </td>
                <td className={styles.td} style={{ color: "#555" }}>{expedition.membersCount}</td>
                <td className={styles.td}>
                    <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: stateStyle.bg,
                        color: stateStyle.color,
                    }}>
                        {STATE_LABELS[expedition.state] ?? expedition.state}
                    </span>
                </td>
                <td className={styles.td}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                            className={styles.toggleBtn}
                            onClick={e => { e.stopPropagation(); setIsOpen(prev => !prev); }}
                        >
                            <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>▼</span>
                            Detalles
                        </button>
                        {canManage && (
                            <button
                                className={styles.manageBtn}
                                onClick={e => { e.stopPropagation(); onManage(expedition); }}
                            >
                                Gestionar
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {isOpen && (
                <tr>
                    <td colSpan={6} className={styles.detailCell}>
                        <div className={styles.detailGrid}>
                            <DetailCard title="Programación">
                                <DetailField label="Salida" value={fmt(expedition.leavingDate)} />
                                <DetailField label="Regreso" value={fmt(expedition.arrivingDate)} />
                                <DetailField label="Días estimados" value={String(expedition.estimatedDays)} />
                                <DetailField label="Días extra" value={String(expedition.extraDays)} />
                            </DetailCard>

                            <DetailCard title="Recursos">
                                <DetailField label="Recursos usados" value={String(expedition.resourcesUsed)} />
                                <DetailField label="Recursos traídos" value={String(expedition.resourcesReturned)} />
                                <DetailField label="Integrantes" value={String(expedition.membersCount)} />
                            </DetailCard>

                            <DetailCard title="Datos">
                                <DetailField label="Campamento" value={expedition.camp.name} />
                                <DetailField label="Creada por" value={expedition.createdBy.username} />
                                <DetailField label="Creada" value={fmt(expedition.createdAt)} />
                                <DetailField label="Notas" value={expedition.notes ?? "—"} />
                            </DetailCard>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
