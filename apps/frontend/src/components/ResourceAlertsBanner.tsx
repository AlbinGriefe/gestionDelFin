import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { inventoryApi } from "../modules/inventory/api/inventory.api";
import { useAuth } from "../modules/auth/context/useAuth";
import type { InventorySummary } from "../modules/inventory/types/inventory.types";
import styles from "./ResourceAlertsBanner.module.css";

const ALERT_ROLES = ["administrador sistema", "gestion recursos"];

export default function ResourceAlertsBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<InventorySummary[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const canSeeAlerts =
    user && ALERT_ROLES.includes(user.roleName.trim().toLowerCase());

  const fetchAlerts = useCallback(async () => {
    if (!canSeeAlerts) return;
    try {
      const data = await inventoryApi.listInventories({
        belowMinimum: true,
        page: 1,
        pageSize: 50,
      });
      setAlerts(data.items);

      const critical = data.items.filter((a) => a.resource.type.isPriority);
      if (critical.length > 0) {
        toast.warning(
          `${critical.length} recurso${critical.length > 1 ? "s" : ""} prioritario${critical.length > 1 ? "s" : ""} bajo mínimo`,
          { duration: 6000 },
        );
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [canSeeAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  if (!canSeeAlerts || loading || alerts.length === 0) return null;

  const critical = alerts.filter((a) => a.resource.type.isPriority);
  const nonCritical = alerts.filter((a) => !a.resource.type.isPriority);

  return (
    <div className={styles.banner}>
      <div
        className={styles.bannerHeader}
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <div className={styles.bannerTitle}>
          <span className={styles.warningIcon}>⚠</span>
          <span>
            {alerts.length} recurso{alerts.length > 1 ? "s" : ""} bajo mínimo
            {critical.length > 0 && (
              <span className={styles.criticalTag}>
                {critical.length} crítico{critical.length > 1 ? "s" : ""}
              </span>
            )}
          </span>
        </div>
        <div className={styles.bannerActions}>
          <button
            className={styles.refreshBtn}
            onClick={(e) => {
              e.stopPropagation();
              fetchAlerts();
            }}
          >
            Actualizar
          </button>
          <span
            className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ""}`}
          >
            ▼
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.alertList}>
          {critical.length > 0 && (
            <>
              <p className={styles.groupLabel}>Recursos prioritarios</p>
              {critical.map((alert) => (
                <AlertItem key={alert.storageId} alert={alert} />
              ))}
            </>
          )}
          {nonCritical.length > 0 && (
            <>
              <p className={styles.groupLabel}>Otros recursos</p>
              {nonCritical.map((alert) => (
                <AlertItem key={alert.storageId} alert={alert} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AlertItem({ alert }: { alert: InventorySummary }) {
  const pct =
    alert.minQuantity > 0
      ? Math.min((alert.quantity / alert.minQuantity) * 100, 100)
      : 100;

  const isCritical = alert.resource.type.isPriority;

  return (
    <div className={styles.alertItem}>
      <div className={styles.alertInfo}>
        <span className={styles.alertName}>{alert.resource.name}</span>
        <span className={styles.alertCamp}>{alert.camp.name}</span>
      </div>
      <div className={styles.alertQty}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${pct}%`,
              background: isCritical ? "#A32D2D" : "#7A4500",
            }}
          />
        </div>
        <span
          className={styles.alertNumbers}
          style={{ color: isCritical ? "#A32D2D" : "#7A4500" }}
        >
          {alert.quantity} / {alert.minQuantity} {alert.resource.unit}
        </span>
      </div>
    </div>
  );
}
