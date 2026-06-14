import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTransfers } from "../context/useTransfers";
import { useAuth } from "../../auth/context/useAuth";
import type {
  TransferCreateInput,
  TransferPersonItemInput,
  TransferResourceItemInput,
} from "../types/transfers.types";
import styles from "./TransferForm.module.css";

interface TransferFormProps {
  onSubmit: (data: TransferCreateInput) => Promise<void>;
  onClose: () => void;
}

type TransferType = "resources" | "people" | "mixed";

type DraftPerson = {
  id_person: number;
  fullName: string;
  assignedRations: string;
};
type DraftResource = {
  id_resource: number;
  name: string;
  unit: string;
  available: number;
  quantity: string;
};

const TYPE_OPTIONS: { value: TransferType; label: string }[] = [
  { value: "resources", label: "Recursos" },
  { value: "people", label: "Personas" },
  { value: "mixed", label: "Mixta (personas y recursos)" },
];

export default function TransferForm({ onSubmit, onClose }: TransferFormProps) {
  const { catalogs } = useTransfers();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [destinyCampId, setDestinyCampId] = useState("");
  const [type, setType] = useState<TransferType>("resources");
  const [comments, setComments] = useState("");

  const [persons, setPersons] = useState<DraftPerson[]>([]);
  const [resources, setResources] = useState<DraftResource[]>([]);
  const [personToAdd, setPersonToAdd] = useState("");
  const [resourceToAdd, setResourceToAdd] = useState("");

  const originCampId = user?.campId;

  const destinyCamps = useMemo(
    () => (catalogs?.camps ?? []).filter((c) => c.id !== originCampId),
    [catalogs, originCampId],
  );

  const availablePersons = useMemo(() => {
    const used = new Set(persons.map((p) => p.id_person));
    return (catalogs?.persons ?? [])
      .filter((p) => (originCampId ? p.campId === originCampId : true))
      .filter((p) => !used.has(p.id));
  }, [catalogs, persons, originCampId]);

  const availableResources = useMemo(() => {
    const used = new Set(resources.map((r) => r.id_resource));
    return (catalogs?.resources ?? [])
      .filter((r) => (originCampId ? r.campId === originCampId : true))
      .filter((r) => !used.has(r.id));
  }, [catalogs, resources, originCampId]);

  const showPersons = type === "people" || type === "mixed";
  const showResources = type === "resources" || type === "mixed";

  const handleAddPerson = () => {
    const id = Number(personToAdd);
    const person = catalogs?.persons.find((p) => p.id === id);
    if (!person) return;
    setPersons((prev) => [
      ...prev,
      { id_person: person.id, fullName: person.fullName, assignedRations: "0" },
    ]);
    setPersonToAdd("");
  };

  const handleAddResource = () => {
    const id = Number(resourceToAdd);
    const resource = catalogs?.resources.find((r) => r.id === id);
    if (!resource) return;
    setResources((prev) => [
      ...prev,
      {
        id_resource: resource.id,
        name: resource.name,
        unit: resource.unit,
        available: resource.availableQuantity,
        quantity: "",
      },
    ]);
    setResourceToAdd("");
  };

  const handleSubmit = async () => {
    setError("");

    if (!destinyCampId) return setError("Selecciona el campamento de destino.");

    if (showPersons && persons.length === 0)
      return setError("Agrega al menos una persona.");
    if (showResources && resources.length === 0)
      return setError("Agrega al menos un recurso.");

    for (const r of resources) {
      const qty = Number(r.quantity);
      if (!qty || qty <= 0)
        return setError(`Indica una cantidad válida para "${r.name}".`);
      if (qty > r.available)
        return setError(
          `No hay suficiente "${r.name}" (disponible: ${r.available}).`,
        );
    }

    const personPayload: TransferPersonItemInput[] = persons.map((p) => ({
      id_person: p.id_person,
      assignedRations: Number(p.assignedRations) || 0,
    }));

    const resourcePayload: TransferResourceItemInput[] = resources.map((r) => ({
      id_resource: r.id_resource,
      quantity: Number(r.quantity),
    }));

    const payload: TransferCreateInput = {
      id_destiny_camp: Number(destinyCampId),
      tfs_type: type,
      tfs_comments: comments.trim() || null,
      persons: showPersons ? personPayload : [],
      resources: showResources ? resourcePayload : [],
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success("Solicitud de traslado creada");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Nueva solicitud de traslado</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Información general</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Campamento de destino</label>
              <select
                className={styles.input}
                value={destinyCampId}
                onChange={(e) => setDestinyCampId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {destinyCamps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Tipo de traslado</label>
              <select
                className={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value as TransferType)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Comentarios <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              className={styles.input}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Motivo o detalles del traslado"
            />
          </div>

          {showPersons && (
            <>
              <p className={styles.sectionTitle}>Personas</p>
              <div className={styles.addRow}>
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
                  onClick={handleAddPerson}
                  disabled={!personToAdd}
                >
                  Agregar
                </button>
              </div>
              {persons.length === 0 ? (
                <p className={styles.emptyItems}>Sin personas asignadas.</p>
              ) : (
                <div className={styles.itemList}>
                  {persons.map((p) => (
                    <div key={p.id_person} className={styles.itemCard}>
                      <span className={styles.itemName}>{p.fullName}</span>
                      <div className={styles.itemField}>
                        <label className={styles.miniLabel}>Raciones</label>
                        <input
                          className={styles.miniInput}
                          type="number"
                          min={0}
                          step="any"
                          value={p.assignedRations}
                          onChange={(e) =>
                            setPersons((prev) =>
                              prev.map((x) =>
                                x.id_person === p.id_person
                                  ? { ...x, assignedRations: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() =>
                          setPersons((prev) =>
                            prev.filter((x) => x.id_person !== p.id_person),
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {showResources && (
            <>
              <p className={styles.sectionTitle}>Recursos</p>
              <div className={styles.addRow}>
                <select
                  className={styles.input}
                  value={resourceToAdd}
                  onChange={(e) => setResourceToAdd(e.target.value)}
                >
                  <option value="">Seleccionar recurso...</option>
                  {availableResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (disp. {r.availableQuantity} {r.unit})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={handleAddResource}
                  disabled={!resourceToAdd}
                >
                  Agregar
                </button>
              </div>
              {resources.length === 0 ? (
                <p className={styles.emptyItems}>Sin recursos asignados.</p>
              ) : (
                <div className={styles.itemList}>
                  {resources.map((r) => (
                    <div key={r.id_resource} className={styles.itemCard}>
                      <span className={styles.itemName}>
                        {r.name}{" "}
                        <span className={styles.itemHint}>
                          · disp. {r.available} {r.unit}
                        </span>
                      </span>
                      <div className={styles.itemField}>
                        <label className={styles.miniLabel}>Cantidad</label>
                        <input
                          className={styles.miniInput}
                          type="number"
                          min={0}
                          max={r.available}
                          step="any"
                          value={r.quantity}
                          onChange={(e) =>
                            setResources((prev) =>
                              prev.map((x) =>
                                x.id_resource === r.id_resource
                                  ? { ...x, quantity: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() =>
                          setResources((prev) =>
                            prev.filter((x) => x.id_resource !== r.id_resource),
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
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
            {loading ? "Creando..." : "Crear solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
