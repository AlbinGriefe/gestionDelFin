import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Compass,
  HeartPulse,
  Radio,
  RefreshCw,
  Trophy,
  Truck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { httpClient } from "../shared/api/httpClient";
import type { AchievementsResponse } from "../modules/achievements/types/achievements.types";
import styles from "./HomePage.module.css";

type Dashboard = {
  role: string;
  capabilities: {
    admissions: boolean;
    inventory: boolean;
    travel: boolean;
  };
  camp: {
    id: number;
    name: string;
    location: string;
    status: string;
    capacity: number;
  };
  metrics: {
    population: number;
    accepted: number;
    pendingAdmissions: number;
    injuredOrSick: number;
    activeAlerts: number;
    activeExpeditions: number;
    pendingTransfers: number;
  };
  inventory: Array<{
    storageId: number;
    resourceName: string;
    unit: string;
    quantity: number;
    minimum: number;
    isBelowMinimum: boolean;
  }>;
  professionCoverage: Array<{
    professionId: number;
    professionName: string;
    activeWorkers: number;
    needsCoverage: boolean;
  }>;
  pendingPeople: Array<{
    personId: number;
    identifier: string;
    fullName: string;
    admissionStatus: string;
  }>;
  recentEvents: Array<{
    id: number;
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
};

const eventLabels: Record<string, string> = {
  disease: "Enfermedad",
  scarcity: "Escasez",
  zombie_attack: "Ataque",
  valuable_resources: "Hallazgo",
  traveler_loss: "Perdida",
};

export default function HomePage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [progress, setProgress] = useState<
    AchievementsResponse["summary"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      setDashboard(await httpClient<Dashboard>("/dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    httpClient<AchievementsResponse>("/achievements")
      .then((response) => setProgress(response.summary))
      .catch(() => undefined);
  }, []);

  if (loading && !dashboard) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={20} className={styles.spin} /> Cargando operacion...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={styles.empty}>No fue posible cargar el dashboard.</div>
    );
  }

  const capacityPercent =
    dashboard.camp.capacity > 0
      ? Math.min(
          100,
          (dashboard.metrics.accepted / dashboard.camp.capacity) * 100,
        )
      : 0;

  const metrics = [
    {
      label: "Poblacion activa",
      value: dashboard.metrics.accepted,
      meta: `${dashboard.camp.capacity || "Sin"} capacidad`,
      icon: UsersRound,
      tone: "green",
    },
    {
      label: "Admisiones pendientes",
      value: dashboard.metrics.pendingAdmissions,
      meta: dashboard.capabilities.admissions
        ? "Requieren revision"
        : "Vista restringida",
      icon: UserCheck,
      tone: "amber",
    },
    {
      label: "Alertas de recursos",
      value: dashboard.metrics.activeAlerts,
      meta: "Bajo minimo operativo",
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Salud comprometida",
      value: dashboard.metrics.injuredOrSick,
      meta: "Personas sin capacidad plena",
      icon: HeartPulse,
      tone: "blue",
    },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.campStrip}>
        <div>
          <span>Campamento activo</span>
          <h2>{dashboard.camp.name}</h2>
          <p>{dashboard.camp.location}</p>
        </div>
        <div className={styles.capacity}>
          <div>
            <span>Ocupacion</span>
            <strong>{Math.round(capacityPercent)}%</strong>
          </div>
          <div className={styles.progress}>
            <span style={{ width: `${capacityPercent}%` }} />
          </div>
        </div>
        <button
          className={styles.refresh}
          onClick={() => void loadDashboard()}
          title="Actualizar"
        >
          <RefreshCw size={17} />
        </button>
      </section>

      {progress && (
        <Link to="/achievements" className={styles.levelStrip}>
          <div className={styles.levelIcon}>
            <Trophy size={20} />
          </div>
          <div className={styles.levelInfo}>
            <span>Progreso del campamento</span>
            <strong>
              Nivel {progress.level} · {progress.unlockedCount}/{progress.total}{" "}
              logros
            </strong>
            <div className={styles.levelBar}>
              <span style={{ width: `${progress.levelProgressPct}%` }} />
            </div>
          </div>
          <div className={styles.levelPts}>
            <strong>{progress.totalPoints}</strong>
            <span>pts</span>
          </div>
          <ArrowRight size={16} />
        </Link>
      )}

      <section className={styles.metrics}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className={styles.metric}>
              <div className={`${styles.metricIcon} ${styles[metric.tone]}`}>
                <Icon size={18} />
              </div>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.meta}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Existencias</span>
              <h2>Recursos principales</h2>
            </div>
            <Link to="/inventory">
              Ver inventario <ArrowRight size={15} />
            </Link>
          </div>
          <div className={styles.resourceList}>
            {dashboard.inventory.map((resource) => {
              const maxReference = Math.max(
                resource.minimum * 2,
                resource.quantity,
                1,
              );
              const percent = Math.min(
                100,
                (resource.quantity / maxReference) * 100,
              );
              return (
                <div key={resource.storageId} className={styles.resourceRow}>
                  <div>
                    <Boxes size={16} />
                    <span>{resource.resourceName}</span>
                  </div>
                  <strong
                    className={resource.isBelowMinimum ? styles.dangerText : ""}
                  >
                    {resource.quantity} {resource.unit}
                  </strong>
                  <div className={styles.resourceBar}>
                    <span
                      className={
                        resource.isBelowMinimum ? styles.dangerBar : ""
                      }
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Continuidad</span>
              <h2>Cobertura de oficios</h2>
            </div>
            <Link to="/professions">
              Gestionar <ArrowRight size={15} />
            </Link>
          </div>
          <div className={styles.coverageGrid}>
            {dashboard.professionCoverage.map((profession) => (
              <div
                key={profession.professionId}
                className={styles.coverageItem}
              >
                <span
                  className={
                    profession.needsCoverage ? styles.coverageAlert : ""
                  }
                >
                  {profession.activeWorkers}
                </span>
                <div>
                  <strong>{profession.professionName}</strong>
                  <small>
                    {profession.needsCoverage
                      ? "Sin cobertura"
                      : "Con cobertura"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>

        {dashboard.capabilities.admissions && (
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span>Decision humana</span>
                <h2>Cola de admision</h2>
              </div>
              <Link to="/persons">
                Revisar <ArrowRight size={15} />
              </Link>
            </div>
            <div className={styles.queue}>
              {dashboard.pendingPeople.length === 0 ? (
                <p className={styles.empty}>No hay personas pendientes.</p>
              ) : (
                dashboard.pendingPeople.map((person) => (
                  <div key={person.personId}>
                    <span className={styles.personInitials}>
                      {person.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{person.fullName}</strong>
                      <small>{person.identifier}</small>
                    </div>
                    <span className={styles.status}>
                      {person.admissionStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Actividad reciente</span>
              <h2>Eventos narrativos</h2>
            </div>
            <Link to="/events">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          <div className={styles.events}>
            {dashboard.recentEvents.length === 0 ? (
              <p className={styles.empty}>Aun no hay eventos registrados.</p>
            ) : (
              dashboard.recentEvents.map((event) => (
                <div key={event.id}>
                  <Radio size={16} />
                  <div>
                    <strong>{eventLabels[event.type] ?? event.type}</strong>
                    <p>{event.description}</p>
                  </div>
                  <time>
                    {new Date(event.createdAt).toLocaleDateString("es-MX")}
                  </time>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className={styles.operations}>
        <Link to="/expeditions">
          <Compass size={18} />
          <span>Expediciones activas</span>
          <strong>{dashboard.metrics.activeExpeditions}</strong>
        </Link>
        <Link to="/transfers">
          <Truck size={18} />
          <span>Traslados pendientes</span>
          <strong>{dashboard.metrics.pendingTransfers}</strong>
        </Link>
      </section>
    </div>
  );
}
