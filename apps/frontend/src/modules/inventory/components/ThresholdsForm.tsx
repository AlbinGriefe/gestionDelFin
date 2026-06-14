import { useState } from "react";
import { toast } from "sonner";
import type {
  InventorySummary,
  InventoryThresholdsInput,
} from "../types/inventory.types";
import { useInventory } from "../context/useInventory";
import styles from "./ThresholdsForm.module.css";

interface ThresholdsFormProps {
  selectedInventory: InventorySummary;
  onClose: () => void;
}

export default function ThresholdsForm({
  selectedInventory,
  onClose,
}: ThresholdsFormProps) {
  const { inventoryThresholds } = useInventory();

  const [minQty, setMinQty] = useState(String(selectedInventory.minQuantity));
  const [maxQty, setMaxQty] = useState(
    selectedInventory.maxQuantity !== null
      ? String(selectedInventory.maxQuantity)
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    const min = parseFloat(minQty);
    if (isNaN(min) || min < 0)
      return setError("El mínimo debe ser un número mayor o igual a 0.");

    let max: number | null | undefined = undefined;
    if (maxQty.trim() !== "") {
      const parsed = parseFloat(maxQty);
      if (isNaN(parsed) || parsed < 0)
        return setError("El máximo debe ser un número mayor o igual a 0.");
      if (parsed < min)
        return setError("El máximo no puede ser menor que el mínimo.");
      max = parsed;
    } else {
      max = null;
    }

    const payload: InventoryThresholdsInput = {
      stg_min_quantity: min,
      ...(max !== undefined ? { stg_max_quantity: max } : {}),
    };

    try {
      setLoading(true);
      await inventoryThresholds(selectedInventory.storageId, payload);
      toast.success("Umbrales actualizados");
      onClose();
    } catch {
      setError("No se pudieron actualizar los umbrales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            Editar umbrales
            <span className={styles.subtitle}>
              · {selectedInventory.resource.name}
            </span>
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.currentInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cantidad actual</span>
              <span className={styles.infoValue}>
                {selectedInventory.quantity} {selectedInventory.resource.unit}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Mínimo actual</span>
              <span className={styles.infoValue}>
                {selectedInventory.minQuantity}{" "}
                {selectedInventory.resource.unit}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Máximo actual</span>
              <span className={styles.infoValue}>
                {selectedInventory.maxQuantity !== null
                  ? `${selectedInventory.maxQuantity} ${selectedInventory.resource.unit}`
                  : "Sin límite"}
              </span>
            </div>
          </div>

          <p className={styles.sectionTitle}>Nuevos umbrales</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>
                Mínimo{" "}
                <span className={styles.unit}>
                  ({selectedInventory.resource.unit})
                </span>
              </label>
              <input
                className={styles.input}
                type="number"
                step="0.01"
                min="0"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                placeholder="ej. 50"
              />
              <p className={styles.hint}>
                Se generará alerta cuando la cantidad caiga por debajo de este
                valor.
              </p>
            </div>
            <div>
              <label className={styles.label}>
                Máximo <span className={styles.optional}>(opcional)</span>{" "}
                <span className={styles.unit}>
                  ({selectedInventory.resource.unit})
                </span>
              </label>
              <input
                className={styles.input}
                type="number"
                step="0.01"
                min="0"
                value={maxQty}
                onChange={(e) => setMaxQty(e.target.value)}
                placeholder="Sin límite"
              />
              <p className={styles.hint}>
                Dejar vacío para no establecer un límite superior.
              </p>
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
            {loading ? "Guardando..." : "Guardar umbrales"}
          </button>
        </div>
      </div>
    </div>
  );
}
