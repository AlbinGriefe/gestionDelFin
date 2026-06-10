import { useState } from "react";
import type { TransferSummary } from "../types/transfers.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./TransferRow.module.css";

const fmt = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATE_LABELS: Record<string, string> = {
    pending: "Pendiente",
    accepted: "Aceptada",
    declined: "Rechazada",
    scheduled: "Agendada",
    in_transit: "En tránsito",
    delivered: "Entregada",
    returned: "Devuelta",
    completed: "Completada",
    cancelled: "Cancelada",
};

const STATE_STYLES: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FEF3E2", color: "#7A4500" },
    accepted: { bg: "#E6F1FB", color: "#185FA5" },
    declined: { bg: "#FDECEA", color: "#8B2020" },
    scheduled: { bg: "#E6F1FB", color: "#185FA5" },
    in_transit: { bg: "#FEF3E2", color: "#7A4500" },
    delivered: { bg: "#EAF3DE", color: "#3B6D11" },
    returned: { bg: "#F1EFE8", color: "#5F5E5A" },
    completed: { bg: "#EAF3DE", color: "#3B6D11" },
    cancelled: { bg: "#F1EFE8", color: "#5F5E5A" },
};

const TYPE_LABELS: Record<string, string> = {
    resources: "Recursos",
    people: "Personas",
    mixed: "Mixta",
};

const TERMINAL_STATES = ["declined", "returned", "completed", "cancelled"];

interface TransferRowProps {
    transfer: TransferSummary;
    onManage: (transfer: TransferSummary) => void;
}

export default function TransferRow({ transfer, onManage }: TransferRowProps) {
    const [isOpen, setIsOpen] = useState(false);
    const stateStyle = STATE_STYLES[transfer.state] ?? STATE_STYLES.pending;
    const canManage = !TERMINAL_STATES.includes(transfer.state);

    return (
        <>
            <tr className={styles.row} onClick={() => setIsOpen(prev => !prev)}>
                <td className={styles.td} style={{ fontWeight: 500 }}>
                    {transfer.originCamp.name} <span className={styles.arrow}>→</span> {transfer.destinyCamp.name}
                </td>
                <td className={styles.td}>{TYPE_LABELS[transfer.type] ?? transfer.type}</td>
                <td className={styles.td} style={{ color: "#555" }}>
                    {transfer.counts.persons > 0 && `${transfer.counts.persons} pers.`}
                    {transfer.counts.persons > 0 && transfer.counts.resources > 0 && " · "}
                    {transfer.counts.resources > 0 && `${transfer.counts.resources} rec.`}
                    {transfer.counts.persons === 0 && transfer.counts.resources === 0 && "—"}
                </td>
                <td className={styles.td} style={{ color: "#555" }}>{fmt(transfer.requestedDate)}</td>
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
                        {STATE_LABELS[transfer.state] ?? transfer.state}
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
                                onClick={e => { e.stopPropagation(); onManage(transfer); }}
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
                            <DetailCard title="Ruta">
                                <DetailField label="Origen" value={transfer.originCamp.name} />
                                <DetailField label="Destino" value={transfer.destinyCamp.name} />
                                <DetailField label="Tipo" value={TYPE_LABELS[transfer.type] ?? transfer.type} />
                                <DetailField label="Solicitada por" value={transfer.requestedBy.username} />
                            </DetailCard>

                            <DetailCard title="Fechas">
                                <DetailField label="Solicitada" value={fmt(transfer.requestedDate)} />
                                <DetailField label="Aceptada" value={fmt(transfer.acceptedRequestDate)} />
                                <DetailField label="Envío" value={fmt(transfer.shipmentDate)} />
                                <DetailField label="Llegada" value={fmt(transfer.arrivalDate)} />
                            </DetailCard>

                            <DetailCard title="Contenido">
                                <DetailField label="Personas" value={String(transfer.counts.persons)} />
                                <DetailField label="Recursos" value={String(transfer.counts.resources)} />
                                <DetailField label="Retorno" value={fmt(transfer.returnDate)} />
                                <DetailField label="Comentarios" value={transfer.comments ?? "—"} />
                            </DetailCard>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
