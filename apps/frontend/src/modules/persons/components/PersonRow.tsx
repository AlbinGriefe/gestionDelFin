import { useState } from "react";
import type { PersonSummary, PersonDetail } from "../types/persons.types";
import { usePersons } from "../context/usePersons";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./PersonRow.module.css";

const HEALTH_STYLES: Record<string, { bg: string; color: string }> = {
    "Sano":         { bg: "#EAF3DE", color: "#3B6D11" },
    "Herido leve":  { bg: "#FEF3E2", color: "#7A4500" },
    "Herido grave": { bg: "#FDECEA", color: "#8B2020" },
    "Infectado":    { bg: "#F3E8FB", color: "#6B1FA0" },
};

const EVENT_LABELS: Record<string, string> = {
    created:          "Creado",
    updated:          "Actualizado",
    accepted:         "Aceptado",
    rejected:         "Rechazado",
    profession_changed: "Profesión cambiada",
    health_changed:   "Salud cambiada",
    camp_changed:     "Campamento cambiado",
    inactivated:      "Inactivado",
    reactivated:      "Reactivado",
};

const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("es-CR") : "—";

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" });

interface PersonRowProps {
    person: PersonSummary;
    onEdit: (person: PersonSummary) => void;
}

export default function PersonRow({ person, onEdit }: PersonRowProps) {
    const { getPersonById } = usePersons();
    const [isOpen, setIsOpen] = useState(false);
    const [detail, setDetail] = useState<PersonDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const healthStyle = person.healthStatus
        ? (HEALTH_STYLES[person.healthStatus.name] ?? { bg: "#f1f1f1", color: "#555" })
        : { bg: "#f1f1f1", color: "#999" };

    const handleToggle = async () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next && !detail) {
            setLoadingDetail(true);
            try {
                const data = await getPersonById(person.id);
                setDetail(data);
            } finally {
                setLoadingDetail(false);
            }
        }
    };

    return (
        <>
            <tr className={styles.row} onClick={handleToggle}>
                <td className={styles.td} style={{ fontWeight: 500 }}>{person.fullName}</td>
                <td className={styles.td} style={{ color: "#666" }}>{person.documentNumber ?? "—"}</td>
                <td className={styles.td}>{person.profession.name}</td>
                <td className={styles.td}>
                    {person.healthStatus ? (
                        <span className={styles.badge} style={{ background: healthStyle.bg, color: healthStyle.color }}>
                            {person.healthStatus.name}
                            {person.healthStatus.isTerminal && " ⚠"}
                        </span>
                    ) : (
                        <span className={styles.badge} style={{ background: "#f1f1f1", color: "#999" }}>Sin asignar</span>
                    )}
                </td>
                <td className={styles.td}>
                    <span className={styles.badge} style={
                        person.isAccepted
                            ? { background: "#EAF3DE", color: "#3B6D11" }
                            : { background: "#FEF3E2", color: "#7A4500" }
                    }>
                        {person.isAccepted ? "Aceptado" : "Pendiente"}
                    </span>
                </td>
                <td className={styles.td}>
                    <span className={styles.badge} style={
                        person.isActive
                            ? { background: "#E6F1FB", color: "#0C447C" }
                            : { background: "#f1f1f1", color: "#999" }
                    }>
                        {person.isActive ? "Activo" : "Inactivo"}
                    </span>
                </td>
                <td className={styles.td}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                            className={styles.toggleBtn}
                            onClick={e => { e.stopPropagation(); handleToggle(); }}
                        >
                            <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>▼</span>
                            Detalles
                        </button>
                        <button
                            className={styles.editBtn}
                            onClick={e => { e.stopPropagation(); onEdit(person); }}
                        >
                            Editar
                        </button>
                    </div>
                </td>
            </tr>

            {isOpen && (
                <tr>
                    <td colSpan={7} className={styles.detailCell}>
                        {loadingDetail ? (
                            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Cargando detalles...</p>
                        ) : detail ? (
                            <div className={styles.detailGrid}>
                                <DetailCard title="Información personal">
                                    <DetailField label="Nombre completo" value={detail.fullName} />
                                    <DetailField label="Documento" value={detail.documentNumber ?? "—"} />
                                    <DetailField label="Fecha de nacimiento" value={fmt(detail.birthDate)} />
                                    <DetailField label="Campamento" value={detail.camp.name} />
                                    <DetailField label="Profesión" value={detail.profession.name} />
                                    {detail.admissionNotes && (
                                        <DetailField label="Notas" value={detail.admissionNotes} />
                                    )}
                                </DetailCard>

                                <DetailCard title="Estado de salud">
                                    <DetailField
                                        label="Estado actual"
                                        value={detail.healthStatus?.name ?? "Sin asignar"}
                                    />
                                    <DetailField
                                        label="Puede trabajar"
                                        value={detail.healthStatus?.canWork ? "Sí" : "No"}
                                    />
                                    {detail.currentHealthRecord && (
                                        <>
                                            <DetailField
                                                label="Desde"
                                                value={fmtDateTime(detail.currentHealthRecord.startDate)}
                                            />
                                            {detail.currentHealthRecord.recordedBy && (
                                                <DetailField
                                                    label="Registrado por"
                                                    value={detail.currentHealthRecord.recordedBy.username}
                                                />
                                            )}
                                            {detail.currentHealthRecord.notes && (
                                                <DetailField
                                                    label="Observaciones"
                                                    value={detail.currentHealthRecord.notes}
                                                />
                                            )}
                                        </>
                                    )}
                                    <DetailField label="Usuarios vinculados" value={String(detail.linkedUsersCount)} />
                                </DetailCard>

                                <DetailCard title="Historial reciente">
                                    {detail.recentHistory.length === 0 ? (
                                        <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Sin eventos registrados.</p>
                                    ) : (
                                        detail.recentHistory.slice(0, 4).map(entry => (
                                            <div key={entry.id} className={styles.historyEntry}>
                                                <span className={styles.historyEvent}>
                                                    {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                                                </span>
                                                <span className={styles.historyMeta}>
                                                    {fmtDateTime(entry.createdAt)}
                                                    {entry.user && ` · ${entry.user.username}`}
                                                </span>
                                                {entry.notes && (
                                                    <span className={styles.historyNotes}>{entry.notes}</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </DetailCard>
                            </div>
                        ) : null}
                    </td>
                </tr>
            )}
        </>
    );
}
