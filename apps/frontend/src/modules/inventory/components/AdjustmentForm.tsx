import { useState } from "react";
import { toast } from "sonner";
import type { InventoryAdjustmentInput, InventoryCatalogs, InventorySummary } from "../types/inventory.types";
import { useInventory } from "../context/useInventory";
import styles from "./AdjustmentForm.module.css";

interface AdjustmentFormProps {
    selectedInventory: InventorySummary | null;
    onClose: () => void;
}

export default function AdjustmentForm({ selectedInventory, onClose }: AdjustmentFormProps) {
    const { inventoryAdjustments, catalogs } = useInventory();

    const [resourceId, setResourceId] = useState<string>(
        selectedInventory ? String(selectedInventory.resource.id) : ""
    );
    const [mode, setMode] = useState<"delta" | "set">("delta");
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isFixed = !!selectedInventory;

    const selectedResource = isFixed
        ? selectedInventory
        : catalogs?.resources.find(r => r.id === Number(resourceId)) ?? null;

    const handleSubmit = async () => {
        setError("");

        if (!resourceId) return setError("Selecciona un recurso.");

        const qty = parseFloat(quantity);
        if (isNaN(qty)) return setError("La cantidad debe ser un número válido.");
        if (mode === "set" && qty < 0) return setError("La cantidad establecida no puede ser negativa.");
        if (!reason.trim()) return setError("La razón es obligatoria.");

        const payload: InventoryAdjustmentInput = {
            id_resource: Number(resourceId),
            mode,
            quantity: qty,
            reason: reason.trim(),
        };

        try {
            setLoading(true);
            await inventoryAdjustments(payload);
            toast.success("Ajuste aplicado correctamente");
            onClose();
        } catch {
            setError("No se pudo aplicar el ajuste. Verifica los datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>
                        Ajustar inventario
                        {isFixed && (
                            <span className={styles.subtitle}>· {selectedInventory.resource.name}</span>
                        )}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    {!isFixed && (
                        <div className={styles.field}>
                            <label className={styles.label}>Recurso</label>
                            <select
                                className={styles.input}
                                value={resourceId}
                                onChange={e => setResourceId(e.target.value)}
                            >
                                <option value="">Seleccionar recurso...</option>
                                {(catalogs as InventoryCatalogs | null)?.resources
                                    .filter(r => r.isActive)
                                    .map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({r.unit})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    {isFixed && (
                        <div className={styles.currentQty}>
                            <span className={styles.currentQtyLabel}>Cantidad actual</span>
                            <span className={styles.currentQtyValue}>
                                {selectedInventory.quantity}{" "}
                                <span className={styles.unit}>{selectedInventory.resource.unit}</span>
                            </span>
                            {selectedInventory.isBelowMinimum && (
                                <span className={styles.alertTag}>⚠ Bajo mínimo</span>
                            )}
                        </div>
                    )}

                    <p className={styles.sectionTitle}>Tipo de ajuste</p>
                    <div className={styles.modeGroup}>
                        <button
                            type="button"
                            className={`${styles.modeBtn} ${mode === "delta" ? styles.modeBtnActive : ""}`}
                            onClick={() => setMode("delta")}
                        >
                            <span className={styles.modeBtnTitle}>Agregar / Descontar</span>
                            <span className={styles.modeBtnDesc}>Suma o resta una cantidad al valor actual</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeBtn} ${mode === "set" ? styles.modeBtnActive : ""}`}
                            onClick={() => setMode("set")}
                        >
                            <span className={styles.modeBtnTitle}>Establecer cantidad</span>
                            <span className={styles.modeBtnDesc}>Fija la cantidad a un valor exacto</span>
                        </button>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <label className={styles.label}>
                                {mode === "delta" ? "Cantidad (+ agrega, − descuenta)" : "Nueva cantidad"}
                                {selectedResource && (
                                    <span className={styles.unit}> en {
                                        isFixed
                                            ? (selectedInventory as InventorySummary).resource.unit
                                            : (catalogs as InventoryCatalogs | null)?.resources.find(r => r.id === Number(resourceId))?.unit ?? ""
                                    }</span>
                                )}
                            </label>
                            <input
                                className={styles.input}
                                type="number"
                                step="0.01"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder={mode === "delta" ? "ej. 50 o -10" : "ej. 200"}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Razón del ajuste</label>
                            <input
                                className={styles.input}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="ej. Ingreso de suministros, consumo extra..."
                            />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Aplicando..." : "Aplicar ajuste"}
                    </button>
                </div>
            </div>
        </div>
    );
}
