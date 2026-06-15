import { useEffect } from "react";
import { useInventory } from "../modules/inventory/context/useInventory";
import DailyProcessPanel from "../modules/daily-processes/components/DailyProcessPanel";
import DailyAssignmentsPanel from "../modules/daily-processes/components/DailyAssignmentsPanel";
import styles from "./DailyProcessesPage.module.css";

export default function DailyProcessesPage() {
  const { loadCatalogs } = useInventory();

  // El formulario de excepciones necesita el catálogo de recursos (comida / agua).
  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  return (
    <div
      style={{
        padding: "24px 32px",
        background: "rgba(16,18,13,0.4)",
        minHeight: "100vh",
      }}
    >
      <h1>Procesos diarios</h1>
      <p
        style={{
          color: "var(--ash)",
          fontSize: 13,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Ejecución de la producción diaria y distribución de raciones del
        campamento.
      </p>

      <div className={styles.wrapper}>
        <DailyAssignmentsPanel />
        <DailyProcessPanel />
      </div>
    </div>
  );
}
