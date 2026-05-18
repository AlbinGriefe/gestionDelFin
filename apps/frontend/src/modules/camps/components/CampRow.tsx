import { useState } from "react";
import type { CampSummary } from "../types/camps.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./CampRow.module.css";

const fmt = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString("es-CR") : "—";

const STATUS_LABELS: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    destroyed: "Destruido",
    abandoned: "Abandonado",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    active: { bg: "#EAF3DE", color: "#3B6D11" },
    inactive: { bg: "#F1EFE8", color: "#5F5E5A" },
    destroyed: { bg: "#FDECEA", color: "#8B2020" },
    abandoned: { bg: "#FEF3E2", color: "#7A4500" },
};

interface CampRowProps {
    camp: CampSummary;
    onEdit: (camp: CampSummary) => void;
}

export default function CampRow({ camp, onEdit }: CampRowProps) {
    const [isOpen, setIsOpen] = useState(false);
    const statusStyle = STATUS_STYLES[camp.status] ?? STATUS_STYLES.inactive;
    const utilizationRate = camp.occupancy.utilizationRate;

    return (
        <>
            <tr className={styles.row} onClick={() => setIsOpen(prev => !prev)}>
                <td className={styles.td} style={{ fontWeight: 500 }}>{camp.name}</td>
                <td className={styles.td}>{camp.location}</td>
                <td className={styles.td}>
                    <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                    }}>
                        {STATUS_LABELS[camp.status] ?? camp.status}
                    </span>
                </td>
                <td className={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 80, height: 6, borderRadius: 4, background: "#eee", overflow: "hidden" }}>
                            <div style={{
                                width: `${Math.min(utilizationRate, 100)}%`,
                                height: "100%",
                                borderRadius: 4,
                                background: utilizationRate >= 90 ? "#A32D2D" : utilizationRate >= 70 ? "#7A4500" : "#3B6D11",
                            }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#666" }}>{utilizationRate.toFixed(0)}%</span>
                    </div>
                </td>
                <td className={styles.td} style={{ color: "#555" }}>
                    {camp.occupancy.activePersons} / {camp.maxCapacity}
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
                        <button
                            className={styles.editBtn}
                            onClick={e => { e.stopPropagation(); onEdit(camp); }}
                        >
                            Editar
                        </button>
                    </div>
                </td>
            </tr>

            {isOpen && (
                <tr>
                    <td colSpan={6} className={styles.detailCell}>
                        <div className={styles.detailGrid}>
                            <DetailCard title="Ocupación">
                                <DetailField label="Personas activas" value={String(camp.occupancy.activePersons)} />
                                <DetailField label="Espacios disponibles" value={String(camp.occupancy.availableSpots)} />
                                <DetailField label="Tasa de ocupación" value={`${utilizationRate.toFixed(1)}%`} />
                                <DetailField label="Capacidad máxima" value={String(camp.maxCapacity)} />
                            </DetailCard>

                            <DetailCard title="Operaciones">
                                <DetailField label="Usuarios activos" value={String(camp.counts.activeUsers)} />
                                <DetailField label="Profesiones" value={String(camp.counts.professions)} />
                                <DetailField label="Recursos en bodega" value={String(camp.counts.storageItems)} />
                                <DetailField label="Expediciones" value={String(camp.counts.expeditions)} />
                            </DetailCard>

                            <DetailCard title="Transferencias y datos">
                                <DetailField label="Envíos salientes" value={String(camp.counts.outgoingTransfers)} />
                                <DetailField label="Envíos entrantes" value={String(camp.counts.incomingTransfers)} />
                                <DetailField label="Coordenadas" value={camp.latitude !== null ? `${camp.latitude}, ${camp.longitude}` : "—"} />
                                <DetailField label="Creado" value={fmt(camp.createdAt)} />
                            </DetailCard>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
