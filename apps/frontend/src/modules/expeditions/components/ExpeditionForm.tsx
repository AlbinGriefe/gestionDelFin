import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useExpeditions } from "../context/useExpeditions";
import { useAuth } from "../../auth/context/useAuth";
import type {
  ExpeditionCreateInput,
  ExpeditionMemberInput,
} from "../types/expeditions.types";
import styles from "./ExpeditionForm.module.css";

interface ExpeditionFormProps {
  onSubmit: (data: ExpeditionCreateInput) => Promise<void>;
  onClose: () => void;
}

type DraftMember = {
  id_person: number;
  fullName: string;
  resourceId: string;
  rationsAssigned: string;
  roleInExpedition: string;
};

export default function ExpeditionForm({
  onSubmit,
  onClose,
}: ExpeditionFormProps) {
  const { catalogs } = useExpeditions();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [leavingDate, setLeavingDate] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("1");
  const [explorationZoneId, setExplorationZoneId] = useState("");
  const [notes, setNotes] = useState("");
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [personToAdd, setPersonToAdd] = useState("");

  const availablePersons = useMemo(() => {
    const campId = user?.campId;
    const usedIds = new Set(members.map((m) => m.id_person));
    return (catalogs?.persons ?? [])
      .filter((p) => (campId ? p.campId === campId : true))
      .filter((p) => !usedIds.has(p.id));
  }, [catalogs, members, user]);

  const handleAddMember = () => {
    const personId = Number(personToAdd);
    if (!personId) return;
    const person = catalogs?.persons.find((p) => p.id === personId);
    if (!person) return;
    setMembers((prev) => [
      ...prev,
      {
        id_person: person.id,
        fullName: person.fullName,
        resourceId: "",
        rationsAssigned: "0",
        roleInExpedition: "",
      },
    ]);
    setPersonToAdd("");
  };

  const handleRemoveMember = (personId: number) => {
    setMembers((prev) => prev.filter((m) => m.id_person !== personId));
  };

  const updateMember = (personId: number, patch: Partial<DraftMember>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id_person === personId ? { ...m, ...patch } : m)),
    );
  };

  const handleSubmit = async () => {
    setError("");

    if (name.trim().length < 3)
      return setError("El nombre debe tener al menos 3 caracteres.");
    if (!leavingDate) return setError("La fecha de salida es obligatoria.");
    const days = Number(estimatedDays);
    if (!days || days < 1)
      return setError("Los días estimados deben ser al menos 1.");
    if (members.length === 0)
      return setError("Agrega al menos un integrante a la expedición.");

    const memberPayload: ExpeditionMemberInput[] = members.map((m) => ({
      id_person: m.id_person,
      id_resource: m.resourceId ? Number(m.resourceId) : null,
      rationsAssigned: Number(m.rationsAssigned) || 0,
      roleInExpedition: m.roleInExpedition.trim() || null,
    }));

    const payload: ExpeditionCreateInput = {
      id_exploration_zone: explorationZoneId ? Number(explorationZoneId) : null,
      exs_name: name.trim(),
      exs_leaving_date: new Date(leavingDate),
      exs_estimated_days: days,
      exe_notes: notes.trim() || null,
      members: memberPayload,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success("Expedición creada");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Nueva expedición</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Información general</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Búsqueda en el sector sur"
            />
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Fecha de salida</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={leavingDate}
                onChange={(e) => setLeavingDate(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.label}>Días estimados</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={365}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Zona de exploracion</label>
            <select
              className={styles.input}
              value={explorationZoneId}
              onChange={(e) => setExplorationZoneId(e.target.value)}
            >
              <option value="">Sin zona especifica</option>
              {(catalogs?.explorationZones ?? [])
                .filter((zone) => !user?.campId || zone.campId === user.campId)
                .map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - riesgo {zone.risk}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Notas <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Objetivo o detalles de la expedición"
            />
          </div>

          <p className={styles.sectionTitle}>Integrantes</p>

          <div className={styles.addMemberRow}>
            <select
              className={styles.input}
              value={personToAdd}
              onChange={(e) => setPersonToAdd(e.target.value)}
            >
              <option value="">Seleccionar persona...</option>
              {availablePersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAddMember}
              disabled={!personToAdd}
            >
              Agregar
            </button>
          </div>

          {members.length === 0 ? (
            <p className={styles.emptyMembers}>Aún no hay integrantes.</p>
          ) : (
            <div className={styles.memberList}>
              {members.map((m) => (
                <div key={m.id_person} className={styles.memberCard}>
                  <div className={styles.memberName}>{m.fullName}</div>
                  <div className={styles.memberFields}>
                    <div>
                      <label className={styles.miniLabel}>Recurso</label>
                      <select
                        className={styles.miniSelect}
                        value={m.resourceId}
                        onChange={(e) =>
                          updateMember(m.id_person, {
                            resourceId: e.target.value,
                          })
                        }
                      >
                        <option value="">Sin recurso</option>
                        {(catalogs?.resources ?? []).map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={styles.miniLabel}>Raciones</label>
                      <input
                        className={styles.miniInput}
                        type="number"
                        min={0}
                        step="any"
                        value={m.rationsAssigned}
                        onChange={(e) =>
                          updateMember(m.id_person, {
                            rationsAssigned: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={styles.miniLabel}>Rol</label>
                      <input
                        className={styles.miniInput}
                        value={m.roleInExpedition}
                        onChange={(e) =>
                          updateMember(m.id_person, {
                            roleInExpedition: e.target.value,
                          })
                        }
                        placeholder="ej. Líder"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveMember(m.id_person)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

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
            {loading ? "Creando..." : "Crear expedición"}
          </button>
        </div>
      </div>
    </div>
  );
}
