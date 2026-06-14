import { useEffect, useState } from "react";
import { useInventory } from "../modules/inventory/context/useInventory";
import type { InventorySummary } from "../modules/inventory/types/inventory.types";
import InventoryList from "../modules/inventory/components/InventoryList";
import AdjustmentForm from "../modules/inventory/components/AdjustmentForm";
import ThresholdsForm from "../modules/inventory/components/ThresholdsForm";
import DailyProcessPanel from "../modules/daily-processes/components/DailyProcessPanel";
import styles from "./InventoryPage.module.css";

export default function InventoryPage() {
  const { loadCatalogs, inventories } = useInventory();

  const [selectedInventory, setSelectedInventory] =
    useState<InventorySummary | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  const handleNewAdjustment = () => {
    setSelectedInventory(null);
    setAdjustOpen(true);
  };

  const handleAdjust = (item: InventorySummary) => {
    setSelectedInventory(item);
    setAdjustOpen(true);
  };

  const handleThresholds = (item: InventorySummary) => {
    setSelectedInventory(item);
    setThresholdsOpen(true);
  };

  const handleCloseAdjust = () => {
    setAdjustOpen(false);
    setSelectedInventory(null);
  };

  const handleCloseThresholds = () => {
    setThresholdsOpen(false);
    setSelectedInventory(null);
  };

  const belowMinCount = inventories.filter((i) => i.isBelowMinimum).length;

  return (
    <div
      style={{
        padding: "24px 32px",
        background: "#f9f9f7",
        minHeight: "100vh",
      }}
    >
      <h1>Bodega e Inventario</h1>

      <DailyProcessPanel />

      {belowMinCount > 0 && (
        <div className={styles.alertBanner}>
          <span className={styles.alertIcon}>⚠</span>
          <span>
            <strong>{belowMinCount}</strong> recurso
            {belowMinCount > 1 ? "s" : ""} por debajo del mínimo
          </span>
          <button className={styles.alertFilterBtn} onClick={() => {}}>
            Ver críticos
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button
          onClick={handleNewAdjustment}
          style={{
            padding: "8px 14px",
            background: "#185FA5",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Registrar ajuste
        </button>
      </div>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Recursos en bodega</div>
        <InventoryList
          onAdjust={handleAdjust}
          onThresholds={handleThresholds}
        />
      </div>

      {adjustOpen && (
        <AdjustmentForm
          selectedInventory={selectedInventory}
          onClose={handleCloseAdjust}
        />
      )}

      {thresholdsOpen && selectedInventory && (
        <ThresholdsForm
          selectedInventory={selectedInventory}
          onClose={handleCloseThresholds}
        />
      )}
    </div>
  );
}
