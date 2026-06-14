import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useExpeditions } from "../context/useExpeditions";
import type {
  ExpeditionSummary,
  ExpeditionDetail,
  ExpeditionStateUpdateInput,
  ExpeditionReturnMemberInput,
} from "../types/expeditions.types";
import styles from "./ExpeditionStateModal.module.css";

type NextState = "in_progress" | "returned" | "failed" | "cancelled";

interface ExpeditionStateModalProps {
  expedition: ExpeditionSummary;
  onConfirm: (data: ExpeditionStateUpdateInput) => Promise<void>;
  onClose: () => void;
}

const NEXT_STATES_BY_CURRENT: Record<
  string,
  { value: NextState; label: string }[]
> = {
  planned: [
    { value: "in_progress", label: "Iniciar (en curso)" },
    { value: "cancelled", label: "Cancelar" },
  ],
  in_progress: [
    { value: "returned", label: "Registrar regreso" },
    { value: "failed", label: "Marcar como fallida" },
    { value: "cancelled", label: "Cancelar" },
  ],
};

export default function ExpeditionStateModal({
  expedition,
  onConfirm,
  onClose,
}: ExpeditionStateModalProps) {
  const { getExpeditionById } = useExpeditions();

  const options = NEXT_STATES_BY_CURRENT[expedition.state] ?? [];

  const [detail, setDetail] = useState<ExpeditionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nextState, setNextState] = useState<NextState>(
    options[0]?.value ?? "cancelled",
  );
  const [resourcesUsed, setResourcesUsed] = useState("");
  const [resourcesReturned, setResourcesReturned] = useState("");
  const [arrivingDate, setArrivingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [memberFindings, setMemberFindings] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    let active = true;
    getExpeditionById(expedition.id)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active)
          toast.error("No se pudo cargar el detalle de la expedición");
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });
    return () => {
      active = false;
    };
  }, [expedition.id, getExpeditionById]);

  const isReturn = nextState === "returned";

  const handleSubmit = async () => {
    setError("");

    const payload: ExpeditionStateUpdateInput = {
      nextState,
      notes: notes.trim() || null,
    };

    if (nextState === "returned" || nextState === "failed") {
      if (resourcesUsed) payload.exe_resources_used = Number(resourcesUsed);
      if (resourcesReturned)
        payload.exe_resources_returned = Number(resourcesReturned);
    }

    if (isReturn) {
      if (arrivingDate) payload.exs_arriving_date = new Date(arrivingDate);

      const members: ExpeditionReturnMemberInput[] = Object.entries(
        memberFindings,
      )
        .filter(([, value]) => value !== "" && !Number.isNaN(Number(value)))
        .map(([personId, value]) => ({
          id_person: Number(personId),
          resourcesFound: Number(value),
        }));

      if (members.length > 0) payload.members = members;
    }

    try {
      setLoading(true);
      await onConfirm(payload);
      toast.success("Estado de la expedición actualizado");
      onClose();
    } catch {
      setError("No se pudo actualizar el estado. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            Gestionar expedición
            <span className={styles.subtitle}>· {expedition.name}</span>
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Acción</label>
            <select
              className={styles.input}
              value={nextState}
              onChange={(e) => setNextState(e.target.value as NextState)}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(nextState === "returned" || nextState === "failed") && (
            <div className={styles.formRow}>
              <div>
                <label className={styles.label}>
                  Recursos usados{" "}
                  <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step="any"
                  value={resourcesUsed}
                  onChange={(e) => setResourcesUsed(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>
                  Recursos traídos{" "}
                  <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step="any"
                  value={resourcesReturned}
                  onChange={(e) => setResourcesReturned(e.target.value)}
                />
              </div>
            </div>
          )}

          {isReturn && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Fecha de regreso{" "}
                <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                type="datetime-local"
                value={arrivingDate}
                onChange={(e) => setArrivingDate(e.target.value)}
              />
            </div>
          )}

          {isReturn && (
            <>
              <p className={styles.sectionTitle}>
                Recursos encontrados por integrante
              </p>
              {loadingDetail ? (
                <p className={styles.loading}>Cargando integrantes...</p>
              ) : (
                <div className={styles.memberList}>
                  {detail?.members.map((m) => (
                    <div key={m.personId} className={styles.memberCard}>
                      <span className={styles.memberName}>{m.fullName}</span>
                      <input
                        className={styles.miniInput}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={memberFindings[m.personId] ?? ""}
                        onChange={(e) =>
                          setMemberFindings((prev) => ({
                            ...prev,
                            [m.personId]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Notas <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
