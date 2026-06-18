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

function parseOptionalPositiveId(value: string) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

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
    const usedIds = new Set(members.map((member) => member.id_person));
    return (catalogs?.persons ?? [])
      .filter((person) => (campId ? person.campId === campId : true))
      .filter((person) => !usedIds.has(person.id));
  }, [catalogs, members, user]);

  const handleAddMember = () => {
    const personId = Number(personToAdd);
    if (!Number.isInteger(personId) || personId <= 0) return;

    const person = catalogs?.persons.find((item) => item.id === personId);
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
    setMembers((prev) =>
      prev.filter((member) => member.id_person !== personId),
    );
  };

  const updateMember = (personId: number, patch: Partial<DraftMember>) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id_person === personId ? { ...member, ...patch } : member,
      ),
    );
  };

  const buildMemberPayload = (): ExpeditionMemberInput[] | null => {
    const payload: ExpeditionMemberInput[] = [];

    for (const member of members) {
      const rationsAssigned = Number(member.rationsAssigned);
      if (!Number.isFinite(rationsAssigned) || rationsAssigned < 0) {
        setError(`Revisa las raciones asignadas a ${member.fullName}.`);
        return null;
      }

      const resourceId = parseOptionalPositiveId(member.resourceId);
      if (Number.isNaN(resourceId)) {
        setError(`Revisa el recurso asignado a ${member.fullName}.`);
        return null;
      }

      payload.push({
        id_person: member.id_person,
        id_resource: resourceId,
        rationsAssigned,
        roleInExpedition: member.roleInExpedition.trim() || null,
      });
    }

    return payload;
  };

  const handleSubmit = async () => {
    setError("");

    if (name.trim().length < 3) {
      return setError("El nombre debe tener al menos 3 caracteres.");
    }

    if (!leavingDate) {
      return setError("La fecha de salida es obligatoria.");
    }

    const parsedLeavingDate = new Date(leavingDate);
    if (Number.isNaN(parsedLeavingDate.getTime())) {
      return setError("La fecha de salida no es valida.");
    }

    const days = Number(estimatedDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return setError("Los dias estimados deben estar entre 1 y 365.");
    }

    if (members.length === 0) {
      return setError("Agrega al menos un integrante a la expedicion.");
    }

    const zoneId = parseOptionalPositiveId(explorationZoneId);
    if (Number.isNaN(zoneId)) {
      return setError("La zona de exploracion no es valida.");
    }

    const memberPayload = buildMemberPayload();
    if (!memberPayload) return;

    const payload: ExpeditionCreateInput = {
      id_exploration_zone: zoneId,
      exs_name: name.trim(),
      exs_leaving_date: parsedLeavingDate,
      exs_estimated_days: days,
      exe_notes: notes.trim() || null,
      members: memberPayload,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success("Expedicion creada");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Nueva expedicion</span>
          <button className={styles.closeBtn} onClick={onClose}>
            x
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Informacion general</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Busqueda en el sector sur"
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
              <label className={styles.label}>Dias estimados</label>
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
              placeholder="Objetivo o detalles de la expedicion"
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
              {availablePersons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName}
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
            <p className={styles.emptyMembers}>Aun no hay integrantes.</p>
          ) : (
            <div className={styles.memberList}>
              {members.map((member) => (
                <div key={member.id_person} className={styles.memberCard}>
                  <div className={styles.memberName}>{member.fullName}</div>
                  <div className={styles.memberFields}>
                    <div>
                      <label className={styles.miniLabel}>Recurso</label>
                      <select
                        className={styles.miniSelect}
                        value={member.resourceId}
                        onChange={(e) =>
                          updateMember(member.id_person, {
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
                        value={member.rationsAssigned}
                        onChange={(e) =>
                          updateMember(member.id_person, {
                            rationsAssigned: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={styles.miniLabel}>Rol</label>
                      <input
                        className={styles.miniInput}
                        value={member.roleInExpedition}
                        onChange={(e) =>
                          updateMember(member.id_person, {
                            roleInExpedition: e.target.value,
                          })
                        }
                        placeholder="ej. Lider"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveMember(member.id_person)}
                  >
                    x
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
            {loading ? "Creando..." : "Crear expedicion"}
          </button>
        </div>
      </div>
    </div>
  );
}
