import { useEffect } from "react";
import { useInventory } from "../modules/inventory/context/useInventory";
import DailyProcessPanel from "../modules/daily-processes/components/DailyProcessPanel";
import styles from "./DailyProcessesPage.module.css";

export default function DailyProcessesPage() {
    const { loadCatalogs } = useInventory();

    // El formulario de excepciones necesita el catálogo de recursos (comida / agua).
    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    return (
        <div style={{ padding: "24px 32px", background: "#f9f9f7", minHeight: "100vh" }}>
            <h1>Procesos diarios</h1>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 24, textAlign: "center" }}>
                Ejecución de la producción diaria y distribución de raciones del campamento.
            </p>

            <div className={styles.wrapper}>
                <DailyProcessPanel />
            </div>
        </div>
    );
}
