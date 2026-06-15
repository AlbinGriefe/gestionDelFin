import { useState } from "react";
import { useSessions } from "../modules/sessions/context/useSessions";
import type {
  SessionSummary,
  SessionRevokeInput,
} from "../modules/sessions/types/sessions.types";
import SessionsList from "../modules/sessions/components/SessionsList";
import SessionRevokeModal from "../modules/sessions/components/SessionRevokeModal";
import styles from "./SessionsPage.module.css";

export default function SessionsPage() {
  const { revokeSession } = useSessions();

  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(
    null,
  );

  const handleRevoke = (session: SessionSummary) => {
    setSelectedSession(session);
  };

  const handleClose = () => {
    setSelectedSession(null);
  };

  const handleConfirm = async (data: SessionRevokeInput) => {
    if (selectedSession) {
      await revokeSession(selectedSession.id, data);
    }
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        background: "rgba(16,18,13,0.4)",
        minHeight: "100vh",
      }}
    >
      <h1>Sesiones activas</h1>
      <p
        style={{
          color: "var(--ash)",
          fontSize: 13,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Auditoría y control de las sesiones del sistema.
      </p>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Registro de sesiones</div>
        <SessionsList onRevoke={handleRevoke} />
      </div>

      {selectedSession && (
        <SessionRevokeModal
          session={selectedSession}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
