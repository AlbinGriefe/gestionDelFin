import { useState } from "react";
import type { SessionSummary } from "../types/sessions.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./SessionRow.module.css";

const fmt = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString("es-CR") : "—";

const REASON_LABELS: Record<string, string> = {
  manual: "Manual",
  timeout: "Inactividad",
  forced: "Forzado",
  camp_change: "Cambio de campamento",
  security: "Seguridad",
};

interface SessionRowProps {
  session: SessionSummary;
  onRevoke: (session: SessionSummary) => void;
}

export default function SessionRow({ session, onRevoke }: SessionRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = !session.isExpired;
  const stateStyle = isActive
    ? { bg: "var(--accent-bg)", color: "var(--moss-bright)" }
    : { bg: "rgba(16,18,13,0.4)", color: "var(--ash)" };

  return (
    <>
      <tr className={styles.row} onClick={() => setIsOpen((prev) => !prev)}>
        <td className={styles.td} style={{ fontWeight: 500 }}>
          {session.user.username}
          {session.isCurrent && (
            <span className={styles.currentTag}>actual</span>
          )}
        </td>
        <td className={styles.td}>{session.camp.name}</td>
        <td className={styles.td} style={{ color: "var(--text)" }}>
          {session.ipAddress}
        </td>
        <td className={styles.td} style={{ color: "var(--text)" }}>
          {fmt(session.loginAt)}
        </td>
        <td className={styles.td} style={{ color: "var(--text)" }}>
          {fmt(session.expiresAt)}
        </td>
        <td className={styles.td}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              background: stateStyle.bg,
              color: stateStyle.color,
            }}
          >
            {isActive ? "Activa" : "Cerrada"}
          </span>
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
              className={styles.revokeBtn}
              disabled={!isActive || session.isCurrent}
              title={
                session.isCurrent
                  ? "No puedes revocar tu sesión actual"
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation();
                onRevoke(session);
              }}
            >
              Revocar
            </button>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td colSpan={7} className={styles.detailCell}>
            <div className={styles.detailGrid}>
              <DetailCard title="Usuario">
                <DetailField label="Usuario" value={session.user.username} />
                <DetailField label="Rol" value={session.user.roleName} />
                <DetailField label="Correo" value={session.user.email ?? "—"} />
              </DetailCard>

              <DetailCard title="Sesión">
                <DetailField label="Inicio" value={fmt(session.loginAt)} />
                <DetailField
                  label="Última actividad"
                  value={fmt(session.lastUpdateAt)}
                />
                <DetailField label="Expira" value={fmt(session.expiresAt)} />
              </DetailCard>

              <DetailCard title="Seguridad">
                <DetailField label="Dirección IP" value={session.ipAddress} />
                <DetailField
                  label="Estado"
                  value={isActive ? "Activa" : "Cerrada"}
                />
                <DetailField
                  label="Motivo de cierre"
                  value={
                    REASON_LABELS[session.signOutReason] ??
                    session.signOutReason
                  }
                />
              </DetailCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
