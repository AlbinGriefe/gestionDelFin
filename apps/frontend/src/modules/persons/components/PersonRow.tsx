import { useState } from "react";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import { usePersons } from "../context/usePersons";
import type {
  PersonAdmissionStatus,
  PersonDetail,
  PersonSummary,
} from "../types/persons.types";
import styles from "./PersonRow.module.css";

const HEALTH_STYLES: Record<string, { bg: string; color: string }> = {
  Sano: { bg: "var(--accent-bg)", color: "var(--moss-bright)" },
  "Herido leve": { bg: "rgba(212,177,58,0.14)", color: "var(--hazard)" },
  "Herido grave": { bg: "rgba(176,106,56,0.14)", color: "#e6b89c" },
  Enfermo: { bg: "rgba(150,120,200,0.18)", color: "#b58fd6" },
};

const ADMISSION_STYLES: Record<
  PersonAdmissionStatus,
  { label: string; bg: string; color: string }
> = {
  pending: {
    label: "Pendiente",
    bg: "rgba(212,177,58,0.14)",
    color: "var(--hazard)",
  },
  under_review: {
    label: "En revision",
    bg: "var(--accent-bg)",
    color: "#58683a",
  },
  observe: {
    label: "Observar",
    bg: "rgba(150,120,200,0.18)",
    color: "#b58fd6",
  },
  accepted: {
    label: "Aceptado",
    bg: "var(--accent-bg)",
    color: "var(--moss-bright)",
  },
  rejected: {
    label: "Rechazado",
    bg: "rgba(176,106,56,0.14)",
    color: "#e6b89c",
  },
};

const EVENT_LABELS: Record<string, string> = {
  created: "Creado",
  updated: "Actualizado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  profession_changed: "Oficio cambiado",
  health_changed: "Salud cambiada",
  camp_changed: "Campamento cambiado",
  inactivated: "Inactivado",
  reactivated: "Reactivado",
  admission_evaluated: "Admision evaluada",
  stats_changed: "Estadisticas actualizadas",
  level_up: "Subida de nivel",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-CR") : "-";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
  });

interface PersonRowProps {
  person: PersonSummary;
  onEdit?: (person: PersonSummary) => void;
  onWorkflow: (person: PersonSummary) => void;
}

export default function PersonRow({
  person,
  onEdit,
  onWorkflow,
}: PersonRowProps) {
  const { getPersonById } = usePersons();
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const healthStyle = person.healthStatus
    ? (HEALTH_STYLES[person.healthStatus.name] ?? {
        bg: "rgba(16,18,13,0.4)",
        color: "var(--text)",
      })
    : { bg: "rgba(16,18,13,0.4)", color: "var(--ash)" };
  const admissionStyle = ADMISSION_STYLES[person.admissionStatus];

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !detail) {
      setLoadingDetail(true);
      try {
        setDetail(await getPersonById(person.id));
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <>
      <tr className={styles.row} onClick={() => void handleToggle()}>
        <td className={styles.td} style={{ fontWeight: 500 }}>
          {person.fullName}
        </td>
        <td className={styles.td} style={{ color: "var(--ash)" }}>
          {person.documentNumber ?? "-"}
        </td>
        <td className={styles.td}>{person.profession?.name ?? "Sin oficio"}</td>
        <td className={styles.td}>
          {person.healthStatus ? (
            <span
              className={styles.badge}
              style={{
                background: healthStyle.bg,
                color: healthStyle.color,
              }}
            >
              {person.healthStatus.name}
            </span>
          ) : (
            <span
              className={styles.badge}
              style={{ background: "rgba(16,18,13,0.4)", color: "var(--ash)" }}
            >
              Sin asignar
            </span>
          )}
        </td>
        <td className={styles.td}>
          <span
            className={styles.badge}
            style={{
              background: admissionStyle.bg,
              color: admissionStyle.color,
            }}
          >
            {admissionStyle.label}
          </span>
        </td>
        <td className={styles.td}>
          <span
            className={styles.badge}
            style={
              person.isActive
                ? { background: "var(--accent-bg)", color: "#58683a" }
                : { background: "rgba(16,18,13,0.4)", color: "var(--ash)" }
            }
          >
            {person.isActive ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td className={styles.td}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={styles.toggleBtn}
              onClick={(event) => {
                event.stopPropagation();
                void handleToggle();
              }}
            >
              Detalles
            </button>
            <button
              className={styles.editBtn}
              onClick={(event) => {
                event.stopPropagation();
                onWorkflow(person);
              }}
            >
              Flujo
            </button>
            {onEdit && (
              <button
                className={styles.editBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(person);
                }}
              >
                Editar
              </button>
            )}
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td colSpan={7} className={styles.detailCell}>
            {loadingDetail ? (
              <p style={{ fontSize: 13, color: "var(--ash)", margin: 0 }}>
                Cargando detalles...
              </p>
            ) : detail ? (
              <div className={styles.detailGrid}>
                <DetailCard title="Informacion personal">
                  <DetailField
                    label="Nombre completo"
                    value={detail.fullName}
                  />
                  <DetailField
                    label="Documento"
                    value={detail.documentNumber ?? "-"}
                  />
                  <DetailField
                    label="Fecha de nacimiento"
                    value={fmt(detail.birthDate)}
                  />
                  <DetailField label="Campamento" value={detail.camp.name} />
                  <DetailField
                    label="Oficio"
                    value={detail.profession?.name ?? "Sin oficio"}
                  />
                  <DetailField
                    label="Perfil"
                    value={detail.profileDescription}
                  />
                  {detail.admissionNotes && (
                    <DetailField label="Notas" value={detail.admissionNotes} />
                  )}
                </DetailCard>

                <DetailCard title="Estado y estadisticas">
                  <DetailField
                    label="Estado de salud"
                    value={detail.healthStatus?.name ?? "Sin asignar"}
                  />
                  <DetailField
                    label="Puede trabajar"
                    value={detail.healthStatus?.canWork ? "Si" : "No"}
                  />
                  {detail.stats && (
                    <>
                      <DetailField
                        label="Nivel"
                        value={String(detail.stats.level)}
                      />
                      <DetailField
                        label="Salud"
                        value={`${detail.stats.health}/${detail.stats.maxHealth}`}
                      />
                      <DetailField
                        label="Fuerza"
                        value={String(detail.stats.strength)}
                      />
                      <DetailField
                        label="Saciedad"
                        value={String(detail.stats.satiety)}
                      />
                      <DetailField
                        label="Hidratacion"
                        value={String(detail.stats.hydration)}
                      />
                      <DetailField
                        label="Suerte"
                        value={String(detail.stats.luck)}
                      />
                    </>
                  )}
                  {detail.currentHealthRecord && (
                    <DetailField
                      label="Estado desde"
                      value={fmtDateTime(detail.currentHealthRecord.startDate)}
                    />
                  )}
                </DetailCard>

                <DetailCard title="Historial reciente">
                  {detail.recentHistory.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--ash)", margin: 0 }}>
                      Sin eventos registrados.
                    </p>
                  ) : (
                    detail.recentHistory.slice(0, 4).map((entry) => (
                      <div key={entry.id} className={styles.historyEntry}>
                        <span className={styles.historyEvent}>
                          {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                        </span>
                        <span className={styles.historyMeta}>
                          {fmtDateTime(entry.createdAt)}
                          {entry.user ? ` - ${entry.user.username}` : ""}
                        </span>
                        {entry.notes && (
                          <span className={styles.historyNotes}>
                            {entry.notes}
                          </span>
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
