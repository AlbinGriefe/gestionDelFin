import { useState } from "react";
import type { CampSummary, CampWriteInput } from "../types/camps.types";
import styles from "./CampForm.module.css";
import { toast } from "sonner";

type CampStatus = "active" | "inactive" | "destroyed" | "abandoned";

interface CampFormProps {
  initialData?: CampSummary | null;
  onSubmit: (data: CampWriteInput) => Promise<void>;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: CampStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "abandoned", label: "Abandonado" },
  { value: "destroyed", label: "Destruido" },
];

export default function CampForm({
  initialData,
  onSubmit,
  onClose,
}: CampFormProps) {
  const isEditing = !!initialData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData?.name ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [latitude, setLatitude] = useState(
    initialData?.latitude?.toString() ?? "",
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude?.toString() ?? "",
  );
  const [maxCapacity, setMaxCapacity] = useState(
    initialData?.maxCapacity?.toString() ?? "",
  );
  const [status, setStatus] = useState<CampStatus>(
    initialData?.status ?? "active",
  );

  const handleSubmit = async () => {
    setError("");

    if (!name.trim())
      return setError("El nombre del campamento es obligatorio.");
    if (!location.trim()) return setError("La ubicación es obligatoria.");
    if (!maxCapacity || Number(maxCapacity) <= 0)
      return setError("La capacidad máxima debe ser mayor a 0.");
    if (latitude && isNaN(Number(latitude)))
      return setError("Latitud inválida.");
    if (longitude && isNaN(Number(longitude)))
      return setError("Longitud inválida.");

    const payload: CampWriteInput = {
      cmp_name: name.trim(),
      cmp_location: location.trim(),
      cmp_max_capacity: Number(maxCapacity),
      cmp_status: status,
      cmp_latitude: latitude ? Number(latitude) : null,
      cmp_longitude: longitude ? Number(longitude) : null,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success(isEditing ? "Campamento actualizado" : "Campamento creado");
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
            {isEditing ? "Editar campamento" : "Nuevo campamento"}
            {isEditing && (
              <span className={styles.subtitle}>· {initialData.name}</span>
            )}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Información general</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Base Norte"
              />
            </div>
            <div>
              <label className={styles.label}>Ubicación</label>
              <input
                className={styles.input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ej. Sector industrial"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>
                Latitud <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="ej. 9.9281"
                type="number"
                step="any"
              />
            </div>
            <div>
              <label className={styles.label}>
                Longitud <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="ej. -84.0907"
                type="number"
                step="any"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Capacidad máxima</label>
              <input
                className={styles.input}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="ej. 100"
                type="number"
                min={1}
              />
            </div>
            <div>
              <label className={styles.label}>Estado</label>
              <select
                className={styles.input}
                value={status}
                onChange={(e) => setStatus(e.target.value as CampStatus)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
            {loading
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear campamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
