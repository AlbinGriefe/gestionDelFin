import { useState } from "react";
import type {
  SessionSummary,
  SessionRevokeInput,
} from "../types/sessions.types";
import styles from "./SessionRevokeModal.module.css";
import { toast } from "sonner";

type RevokeReason = "manual" | "forced" | "security";

interface SessionRevokeModalProps {
  session: SessionSummary;
  onConfirm: (data: SessionRevokeInput) => Promise<void>;
  onClose: () => void;
}

const REASON_OPTIONS: { value: RevokeReason; label: string }[] = [
  { value: "forced", label: "Forzado por administrador" },
  { value: "manual", label: "Cierre manual" },
  { value: "security", label: "Motivo de seguridad" },
];

export default function SessionRevokeModal({
  session,
  onConfirm,
  onClose,
}: SessionRevokeModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<RevokeReason>("forced");

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm({ reason });
      toast.success("Sesión revocada");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            Revocar sesión
            <span className={styles.subtitle}>· {session.user.username}</span>
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.warning}>
            Esta acción cerrará la sesión de{" "}
            <strong>{session.user.username}</strong> en{" "}
            <strong>{session.camp.name}</strong>. El usuario deberá iniciar
            sesión nuevamente.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Motivo</label>
            <select
              className={styles.input}
              value={reason}
              onChange={(e) => setReason(e.target.value as RevokeReason)}
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnDanger}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Revocando..." : "Revocar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
