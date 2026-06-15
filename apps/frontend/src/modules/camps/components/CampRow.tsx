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
  active: { bg: "var(--accent-bg)", color: "var(--moss-bright)" },
  inactive: { bg: "rgba(16,18,13,0.4)", color: "var(--ash)" },
  destroyed: { bg: "rgba(176,106,56,0.14)", color: "#e6b89c" },
  abandoned: { bg: "rgba(212,177,58,0.14)", color: "var(--hazard)" },
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
      <tr className={styles.row} onClick={() => setIsOpen((prev) => !prev)}>
        <td className={styles.td} style={{ fontWeight: 500 }}>
          {camp.name}
        </td>
        <td className={styles.td}>{camp.location}</td>
        <td className={styles.td}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {STATUS_LABELS[camp.status] ?? camp.status}
          </span>
        </td>
        <td className={styles.td}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 80,
                height: 6,
                borderRadius: 4,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(utilizationRate, 100)}%`,
                  height: "100%",
                  borderRadius: 4,
                  background:
                    utilizationRate >= 90
                      ? "#e6b89c"
                      : utilizationRate >= 70
                        ? "var(--hazard)"
                        : "var(--moss-bright)",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--ash)" }}>
              {utilizationRate.toFixed(0)}%
            </span>
          </div>
        </td>
        <td className={styles.td} style={{ color: "var(--text)" }}>
          {camp.occupancy.activePersons} / {camp.maxCapacity}
        </td>
        <td className={styles.td}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={styles.toggleBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
            >
              <span
                className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
              >
                ▼
              </span>
              Detalles
            </button>
            <button
              className={styles.editBtn}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(camp);
              }}
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
                <DetailField
                  label="Personas activas"
                  value={String(camp.occupancy.activePersons)}
                />
                <DetailField
                  label="Espacios disponibles"
                  value={String(camp.occupancy.availableSpots)}
                />
                <DetailField
                  label="Tasa de ocupación"
                  value={`${utilizationRate.toFixed(1)}%`}
                />
                <DetailField
                  label="Capacidad máxima"
                  value={String(camp.maxCapacity)}
                />
              </DetailCard>

              <DetailCard title="Operaciones">
                <DetailField
                  label="Usuarios activos"
                  value={String(camp.counts.activeUsers)}
                />
                <DetailField
                  label="Profesiones"
                  value={String(camp.counts.professions)}
                />
                <DetailField
                  label="Recursos en bodega"
                  value={String(camp.counts.storageItems)}
                />
                <DetailField
                  label="Expediciones"
                  value={String(camp.counts.expeditions)}
                />
              </DetailCard>

              <DetailCard title="Transferencias y datos">
                <DetailField
                  label="Envíos salientes"
                  value={String(camp.counts.outgoingTransfers)}
                />
                <DetailField
                  label="Envíos entrantes"
                  value={String(camp.counts.incomingTransfers)}
                />
                <DetailField
                  label="Coordenadas"
                  value={
                    camp.latitude !== null
                      ? `${camp.latitude}, ${camp.longitude}`
                      : "—"
                  }
                />
                <DetailField label="Creado" value={fmt(camp.createdAt)} />
              </DetailCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
