import { useState } from "react";
import type {
  InventorySummary,
  InventoryDetail,
} from "../types/inventory.types";
import { useInventory } from "../context/useInventory";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./InventoryRow.module.css";

const fmt = (iso: string): string => new Date(iso).toLocaleDateString("es-CR");
const fmtFull = (iso: string): string =>
  new Date(iso).toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
  });

const MOVEMENT_LABELS: Record<string, string> = {
  entry: "Entrada",
  daily_production: "Producción diaria",
  expedition_out: "Salida expedición",
  expedition_return: "Retorno expedición",
  transfer_out: "Salida traslado",
  transfer_in: "Entrada traslado",
  ration_out: "Ración diaria",
  manual_adjustment: "Ajuste manual",
  consumption: "Consumo",
};

function getStatus(quantity: number, minQuantity: number) {
  if (quantity < minQuantity) return "critical" as const;
  const ratio = minQuantity > 0 ? quantity / minQuantity : 2;
  if (ratio < 1.2) return "low" as const;
  return "ok" as const;
}

const STATUS_CONFIG = {
  critical: { label: "Crítico", bg: "rgba(176,106,56,0.14)", color: "#e6b89c" },
  low: { label: "Bajo", bg: "rgba(212,177,58,0.14)", color: "var(--hazard)" },
  ok: { label: "OK", bg: "var(--accent-bg)", color: "var(--moss-bright)" },
};

const BAR_COLOR = {
  critical: "#e6b89c",
  low: "var(--hazard)",
  ok: "var(--moss-bright)",
};

interface InventoryRowProps {
  item: InventorySummary;
  onAdjust: (item: InventorySummary) => void;
  onThresholds: (item: InventorySummary) => void;
}

export default function InventoryRow({
  item,
  onAdjust,
  onThresholds,
}: InventoryRowProps) {
  const { getInventoryById } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<InventoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const status = getStatus(item.quantity, item.minQuantity);
  const statusCfg = STATUS_CONFIG[status];
  const pct =
    item.minQuantity > 0
      ? Math.min((item.quantity / item.minQuantity) * 100, 100)
      : 100;

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next || detail) return;

    setLoadingDetail(true);
    try {
      setDetail(await getInventoryById(item.storageId));
    } catch {
      setIsOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <>
      <tr className={styles.row} onClick={() => void handleToggle()}>
        <td className={styles.td}>
          <span className={styles.resourceName}>{item.resource.name}</span>
          {item.resource.isRationable && (
            <span className={styles.tag}>Racionable</span>
          )}
        </td>
        <td className={styles.td}>
          <span
            className={styles.typeBadge}
            style={
              item.resource.type.isPriority
                ? {
                    background: "rgba(212,177,58,0.14)",
                    color: "var(--hazard)",
                  }
                : { background: "rgba(16,18,13,0.4)", color: "var(--text)" }
            }
          >
            {item.resource.type.isPriority ? "⚑ " : ""}
            {item.resource.type.name}
          </span>
        </td>
        <td className={styles.td}>
          <div className={styles.quantityCell}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${pct}%`, background: BAR_COLOR[status] }}
              />
            </div>
            <span className={styles.quantityLabel}>
              {item.quantity}{" "}
              <span className={styles.unit}>{item.resource.unit}</span>
            </span>
          </div>
        </td>
        <td className={styles.td}>
          <span
            className={styles.statusBadge}
            style={{ background: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </td>
        <td className={styles.td}>
          <span className={styles.threshold}>
            {item.minQuantity}
            {item.maxQuantity !== null && (
              <span className={styles.unit}> / {item.maxQuantity}</span>
            )}
            <span className={styles.unit}> {item.resource.unit}</span>
          </span>
        </td>
        <td className={styles.td}>{fmt(item.lastUpdatedAt)}</td>
        <td className={styles.td}>
          <div className={styles.actions}>
            <button
              className={styles.toggleBtn}
              onClick={(e) => {
                e.stopPropagation();
                void handleToggle();
              }}
            >
              <span
                className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
              >
                ▼
              </span>
              Detalles
            </button>
            <button
              className={styles.adjustBtn}
              onClick={(e) => {
                e.stopPropagation();
                onAdjust(item);
              }}
            >
              Ajustar
            </button>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td colSpan={7} className={styles.detailCell}>
            {loadingDetail ? (
              <p className={styles.loading}>Cargando detalle...</p>
            ) : detail ? (
              <div>
                <div className={styles.detailGrid}>
                  <DetailCard title="Recurso">
                    <DetailField label="Nombre" value={detail.resource.name} />
                    <DetailField label="Unidad" value={detail.resource.unit} />
                    <DetailField
                      label="Tipo"
                      value={detail.resource.type.name}
                    />
                    <DetailField
                      label="Racionable"
                      value={detail.resource.isRationable ? "Sí" : "No"}
                    />
                    <DetailField
                      label="Prioritario"
                      value={detail.resource.type.isPriority ? "Sí" : "No"}
                    />
                  </DetailCard>
                  <DetailCard title="Niveles">
                    <DetailField
                      label="Cantidad actual"
                      value={`${detail.quantity} ${detail.resource.unit}`}
                    />
                    <DetailField
                      label="Mínimo"
                      value={`${detail.minQuantity} ${detail.resource.unit}`}
                    />
                    <DetailField
                      label="Máximo"
                      value={
                        detail.maxQuantity !== null
                          ? `${detail.maxQuantity} ${detail.resource.unit}`
                          : "Sin límite"
                      }
                    />
                    <DetailField
                      label="Actualizado"
                      value={fmt(detail.lastUpdatedAt)}
                    />
                  </DetailCard>
                </div>

                <div className={styles.detailActions}>
                  <button
                    className={styles.thresholdsBtn}
                    onClick={() => onThresholds(item)}
                  >
                    Editar umbrales
                  </button>
                </div>

                {detail.recentMovements.length > 0 && (
                  <div className={styles.movementsSection}>
                    <p className={styles.subLabel}>Movimientos recientes</p>
                    <div style={{ overflowX: "auto" }}>
                      <table className={styles.movTable}>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Razón</th>
                            <th>Usuario</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.recentMovements.map((mv) => (
                            <tr key={mv.id}>
                              <td>{MOVEMENT_LABELS[mv.type] ?? mv.type}</td>
                              <td
                                className={
                                  mv.quantity >= 0
                                    ? styles.qtyPositive
                                    : styles.qtyNegative
                                }
                              >
                                {mv.quantity >= 0 ? "+" : ""}
                                {mv.quantity} {detail.resource.unit}
                              </td>
                              <td>{mv.reason ?? "—"}</td>
                              <td>{mv.user?.username ?? "—"}</td>
                              <td>{fmtFull(mv.movementDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detail.recentRecords.length > 0 && (
                  <div className={styles.movementsSection}>
                    <p className={styles.subLabel}>Historial de ajustes</p>
                    <div style={{ overflowX: "auto" }}>
                      <table className={styles.movTable}>
                        <thead>
                          <tr>
                            <th>Anterior</th>
                            <th>Nuevo</th>
                            <th>Razón</th>
                            <th>Usuario</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.recentRecords.map((rec) => (
                            <tr key={rec.id}>
                              <td>
                                {rec.previousQuantity} {detail.resource.unit}
                              </td>
                              <td
                                className={
                                  rec.newQuantity >= rec.previousQuantity
                                    ? styles.qtyPositive
                                    : styles.qtyNegative
                                }
                              >
                                {rec.newQuantity} {detail.resource.unit}
                              </td>
                              <td>{rec.reason}</td>
                              <td>{rec.user?.username ?? "—"}</td>
                              <td>{fmtFull(rec.recordedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}
