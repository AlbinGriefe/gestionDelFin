import { useState } from "react";
import type { ProfessionSummary } from "../types/professions.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./ProfessionRow.module.css";

interface ProfessionRowProps {
    profession: ProfessionSummary;
    onEdit: (profession: ProfessionSummary) => void;
}

export default function ProfessionRow({ profession, onEdit }: ProfessionRowProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeStyle = profession.isActive
        ? { bg: "#EAF3DE", color: "#3B6D11" }
        : { bg: "#F1EFE8", color: "#5F5E5A" };

    return (
        <>
            <tr className={styles.row} onClick={() => setIsOpen(prev => !prev)}>
                <td className={styles.td} style={{ fontWeight: 500 }}>{profession.name}</td>
                <td className={styles.td} style={{ color: "#555", maxWidth: 260 }}>
                    {profession.description}
                </td>
                <td className={styles.td}>{profession.collectsResources ? "Sí" : "No"}</td>
                <td className={styles.td} style={{ color: "#555" }}>{profession.foodGeneratedPerDay}</td>
                <td className={styles.td} style={{ color: "#555" }}>{profession.waterGeneratedPerDay}</td>
                <td className={styles.td}>
                    <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 500,
                        background: activeStyle.bg,
                        color: activeStyle.color,
                    }}>
                        {profession.isActive ? "Activa" : "Inactiva"}
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
                        <button
                            className={styles.editBtn}
                            onClick={e => { e.stopPropagation(); onEdit(profession); }}
                        >
                            Editar
                        </button>
                    </div>
                </td>
            </tr>

            {isOpen && (
                <tr>
                    <td colSpan={7} className={styles.detailCell}>
                        <div className={styles.detailGrid}>
                            <DetailCard title="Producción diaria">
                                <DetailField label="Comida por día" value={String(profession.foodGeneratedPerDay)} />
                                <DetailField label="Agua por día" value={String(profession.waterGeneratedPerDay)} />
                                <DetailField label="Recolecta recursos" value={profession.collectsResources ? "Sí" : "No"} />
                            </DetailCard>

                            <DetailCard title="Alcance">
                                <DetailField
                                    label="Ámbito"
                                    value={profession.campId === null ? "Global (todos los campamentos)" : `Campamento #${profession.campId}`}
                                />
                                <DetailField label="Estado" value={profession.isActive ? "Activa" : "Inactiva"} />
                                <DetailField label="ID" value={String(profession.id)} />
                            </DetailCard>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
