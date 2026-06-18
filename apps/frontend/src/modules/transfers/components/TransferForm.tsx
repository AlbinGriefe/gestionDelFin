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

function parsePositiveId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

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
    () => (catalogs?.camps ?? []).filter((camp) => camp.id !== originCampId),
    [catalogs, originCampId],
  );

  const availablePersons = useMemo(() => {
    const used = new Set(persons.map((person) => person.id_person));
    return (catalogs?.persons ?? [])
      .filter((person) =>
        originCampId ? person.campId === originCampId : true,
      )
      .filter((person) => !used.has(person.id));
  }, [catalogs, persons, originCampId]);

  const availableResources = useMemo(() => {
    const used = new Set(resources.map((resource) => resource.id_resource));
    return (catalogs?.resources ?? [])
      .filter((resource) =>
        originCampId ? resource.campId === originCampId : true,
      )
      .filter((resource) => !used.has(resource.id));
  }, [catalogs, resources, originCampId]);

  const showPersons = type === "people" || type === "mixed";
  const showResources = type === "resources" || type === "mixed";

  const handleAddPerson = () => {
    const id = parsePositiveId(personToAdd);
    if (Number.isNaN(id)) return;

    const person = catalogs?.persons.find((item) => item.id === id);
    if (!person) return;

    setPersons((prev) => [
      ...prev,
      { id_person: person.id, fullName: person.fullName, assignedRations: "0" },
    ]);
    setPersonToAdd("");
  };

  const handleAddResource = () => {
    const id = parsePositiveId(resourceToAdd);
    if (Number.isNaN(id)) return;

    const resource = catalogs?.resources.find((item) => item.id === id);
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

  const buildPersonPayload = (): TransferPersonItemInput[] | null => {
    const payload: TransferPersonItemInput[] = [];

    for (const person of persons) {
      const assignedRations = Number(person.assignedRations);
      if (!Number.isFinite(assignedRations) || assignedRations < 0) {
        setError(`Revisa las raciones asignadas a ${person.fullName}.`);
        return null;
      }

      payload.push({
        id_person: person.id_person,
        assignedRations,
      });
    }

    return payload;
  };

  const buildResourcePayload = (): TransferResourceItemInput[] | null => {
    const payload: TransferResourceItemInput[] = [];

    for (const resource of resources) {
      const quantity = Number(resource.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError(`Indica una cantidad valida para "${resource.name}".`);
        return null;
      }

      if (quantity > resource.available) {
        setError(
          `No hay suficiente "${resource.name}" (disponible: ${resource.available}).`,
        );
        return null;
      }

      payload.push({
        id_resource: resource.id_resource,
        quantity,
      });
    }

    return payload;
  };

  const handleSubmit = async () => {
    setError("");

    const destinationId = parsePositiveId(destinyCampId);
    if (Number.isNaN(destinationId)) {
      return setError("Selecciona el campamento de destino.");
    }

    if (showPersons && persons.length === 0) {
      return setError("Agrega al menos una persona.");
    }

    if (showResources && resources.length === 0) {
      return setError("Agrega al menos un recurso.");
    }

    const personPayload = buildPersonPayload();
    if (!personPayload) return;

    const resourcePayload = buildResourcePayload();
    if (!resourcePayload) return;

    const payload: TransferCreateInput = {
      id_destiny_camp: destinationId,
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
            x
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Informacion general</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Campamento de destino</label>
              <select
                className={styles.input}
                value={destinyCampId}
                onChange={(e) => setDestinyCampId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {destinyCamps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name}
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
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                  {availablePersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
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
                  {persons.map((person) => (
                    <div key={person.id_person} className={styles.itemCard}>
                      <span className={styles.itemName}>{person.fullName}</span>
                      <div className={styles.itemField}>
                        <label className={styles.miniLabel}>Raciones</label>
                        <input
                          className={styles.miniInput}
                          type="number"
                          min={0}
                          step="any"
                          value={person.assignedRations}
                          onChange={(e) =>
                            setPersons((prev) =>
                              prev.map((item) =>
                                item.id_person === person.id_person
                                  ? { ...item, assignedRations: e.target.value }
                                  : item,
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
                            prev.filter(
                              (item) => item.id_person !== person.id_person,
                            ),
                          )
                        }
                      >
                        x
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
                  {availableResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} (disp. {resource.availableQuantity}{" "}
                      {resource.unit})
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
                  {resources.map((resource) => (
                    <div key={resource.id_resource} className={styles.itemCard}>
                      <span className={styles.itemName}>
                        {resource.name}{" "}
                        <span className={styles.itemHint}>
                          - disp. {resource.available} {resource.unit}
                        </span>
                      </span>
                      <div className={styles.itemField}>
                        <label className={styles.miniLabel}>Cantidad</label>
                        <input
                          className={styles.miniInput}
                          type="number"
                          min={0}
                          max={resource.available}
                          step="any"
                          value={resource.quantity}
                          onChange={(e) =>
                            setResources((prev) =>
                              prev.map((item) =>
                                item.id_resource === resource.id_resource
                                  ? { ...item, quantity: e.target.value }
                                  : item,
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
                            prev.filter(
                              (item) =>
                                item.id_resource !== resource.id_resource,
                            ),
                          )
                        }
                      >
                        x
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
