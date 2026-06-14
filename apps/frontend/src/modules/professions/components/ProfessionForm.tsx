import { useState } from "react";
import type {
  ProfessionSummary,
  ProfessionWriteInput,
} from "../types/professions.types";
import styles from "./ProfessionForm.module.css";
import { toast } from "sonner";

interface ProfessionFormProps {
  initialData?: ProfessionSummary | null;
  onSubmit: (data: ProfessionWriteInput) => Promise<void>;
  onClose: () => void;
}

export default function ProfessionForm({
  initialData,
  onSubmit,
  onClose,
}: ProfessionFormProps) {
  const isEditing = !!initialData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [collectsResources, setCollectsResources] = useState(
    initialData?.collectsResources ?? false,
  );
  const [foodPerDay, setFoodPerDay] = useState(
    initialData?.foodGeneratedPerDay?.toString() ?? "0",
  );
  const [waterPerDay, setWaterPerDay] = useState(
    initialData?.waterGeneratedPerDay?.toString() ?? "0",
  );
  const [campId, setCampId] = useState(initialData?.campId?.toString() ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const handleSubmit = async () => {
    setError("");

    if (!name.trim())
      return setError("El nombre de la profesión es obligatorio.");
    if (!description.trim()) return setError("La descripción es obligatoria.");
    if (foodPerDay && (isNaN(Number(foodPerDay)) || Number(foodPerDay) < 0))
      return setError(
        "La comida por día debe ser un número mayor o igual a 0.",
      );
    if (waterPerDay && (isNaN(Number(waterPerDay)) || Number(waterPerDay) < 0))
      return setError("El agua por día debe ser un número mayor o igual a 0.");
    if (campId && (isNaN(Number(campId)) || Number(campId) <= 0))
      return setError("El ID de campamento debe ser un número positivo.");

    const payload: ProfessionWriteInput = {
      pfs_name: name.trim(),
      pfs_description: description.trim(),
      pfs_collects_resources: collectsResources,
      pfs_food_generated_per_day: Number(foodPerDay) || 0,
      pfs_water_generated_per_day: Number(waterPerDay) || 0,
      id_camp: campId ? Number(campId) : null,
      pfs_is_active: isActive,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success(isEditing ? "Profesión actualizada" : "Profesión creada");
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
            {isEditing ? "Editar profesión" : "Nueva profesión"}
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Recolector de agua"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción</label>
            <input
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej. Encargado de conseguir agua potable a diario"
            />
          </div>

          <p className={styles.sectionTitle}>Producción diaria</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Comida por día</label>
              <input
                className={styles.input}
                value={foodPerDay}
                onChange={(e) => setFoodPerDay(e.target.value)}
                type="number"
                min={0}
                step="any"
              />
            </div>
            <div>
              <label className={styles.label}>Agua por día</label>
              <input
                className={styles.input}
                value={waterPerDay}
                onChange={(e) => setWaterPerDay(e.target.value)}
                type="number"
                min={0}
                step="any"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>
                Campamento{" "}
                <span className={styles.optional}>(vacío = global)</span>
              </label>
              <input
                className={styles.input}
                value={campId}
                onChange={(e) => setCampId(e.target.value)}
                placeholder="ID del campamento"
                type="number"
                min={1}
              />
            </div>
            <div>
              <label className={styles.label}>Estado</label>
              <select
                className={styles.input}
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <input
              id="collectsResources"
              type="checkbox"
              checked={collectsResources}
              onChange={(e) => setCollectsResources(e.target.checked)}
            />
            <label htmlFor="collectsResources" className={styles.checkboxLabel}>
              Esta profesión recolecta recursos (comida / agua)
            </label>
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
                : "Crear profesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
