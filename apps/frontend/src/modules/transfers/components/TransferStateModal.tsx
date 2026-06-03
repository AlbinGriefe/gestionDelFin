import { useState } from "react";
import { toast } from "sonner";
import type {
    TransferSummary,
    TransferStateUpdateInput,
} from "../types/transfers.types";
import styles from "./TransferStateModal.module.css";

type TransferState = TransferSummary["state"];

interface TransferStateModalProps {
    transfer: TransferSummary;
    onConfirm: (data: TransferStateUpdateInput) => Promise<void>;
    onClose: () => void;
}

const ALLOWED_TRANSITIONS: Record<string, TransferState[]> = {
    pending: ["accepted", "declined", "cancelled"],
    accepted: ["scheduled", "cancelled"],
    scheduled: ["in_transit", "cancelled"],
    in_transit: ["delivered", "returned"],
    delivered: ["completed"],
};

const STATE_META: Record<string, { label: string; from: "origen" | "destino" }> = {
    accepted: { label: "Aceptar solicitud", from: "destino" },
    declined: { label: "Rechazar solicitud", from: "destino" },
    cancelled: { label: "Cancelar traslado", from: "origen" },
    scheduled: { label: "Agendar envío", from: "origen" },
    in_transit: { label: "Marcar en tránsito", from: "origen" },
    delivered: { label: "Confirmar entrega", from: "destino" },
    returned: { label: "Marcar como devuelta", from: "destino" },
    completed: { label: "Completar traslado", from: "destino" },
};

export default function TransferStateModal({ transfer, onConfirm, onClose }: TransferStateModalProps) {
    const options = ALLOWED_TRANSITIONS[transfer.state] ?? [];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [nextState, setNextState] = useState<TransferState>(options[0] ?? "cancelled");
    const [comments, setComments] = useState("");

    const meta = STATE_META[nextState];

    const handleSubmit = async () => {
        setError("");
        try {
            setLoading(true);
            await onConfirm({ nextState, comments: comments.trim() || null });
            toast.success("Estado del traslado actualizado");
            onClose();
        } catch {
            setError("No se pudo actualizar. Verifica que tu campamento tenga la autoridad para esta acción.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <span className={styles.title}>
                        Gestionar traslado
                        <span className={styles.subtitle}>
                            · {transfer.originCamp.name} → {transfer.destinyCamp.name}
                        </span>
                    </span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Acción</label>
                        <select
                            className={styles.input}
                            value={nextState}
                            onChange={e => setNextState(e.target.value as TransferState)}
                        >
                            {options.map(state => (
                                <option key={state} value={state}>
                                    {STATE_META[state]?.label ?? state}
                                </option>
                            ))}
                        </select>
                    </div>

                    {meta && (
                        <p className={styles.authorityHint}>
                            Esta acción debe realizarse desde el <strong>campamento {meta.from}</strong>.
                        </p>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Comentarios <span className={styles.optional}>(opcional)</span>
                        </label>
                        <input
                            className={styles.input}
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Guardando..." : "Confirmar"}
                    </button>
                </div>

            </div>
        </div>
    );
}
