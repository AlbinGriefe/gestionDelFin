import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Cross,
  Gem,
  Radio,
  Skull,
  Utensils,
} from "lucide-react";

import { useAuth } from "../modules/auth/context/useAuth";
import { httpClient } from "../shared/api/httpClient";
import styles from "./OperationsPage.module.css";

type NarrativeEvent = {
  id: number;
  camp: { id: number; name: string };
  type:
    | "disease"
    | "scarcity"
    | "zombie_attack"
    | "valuable_resources"
    | "traveler_loss";
  status: "generated" | "applied" | "resolved";
  sourceType: string;
  probability: number | null;
  roll: number | null;
  participants: unknown;
  effects: unknown;
  description: string;
  createdAt: string;
};

const eventMeta = {
  disease: { label: "Enfermedad", icon: Cross, tone: "amber" },
  scarcity: { label: "Escasez", icon: Utensils, tone: "red" },
  zombie_attack: { label: "Ataque zombie", icon: Skull, tone: "red" },
  valuable_resources: { label: "Recursos valiosos", icon: Gem, tone: "green" },
  traveler_loss: {
    label: "Perdida de viajeros",
    icon: AlertTriangle,
    tone: "amber",
  },
} as const;

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (type) params.set("type", type);
    httpClient<{ items: NarrativeEvent[] }>(`/narrative-events?${params}`)
      .then((result) => setEvents(result.items))
      .finally(() => setLoading(false));
  }, [type, user?.campId]);

  return (
    <section className={styles.stack}>
      <div className={styles.pageIntro}>
        <div>
          <span>Registro separado de la auditoria</span>
          <h2>Eventos del campamento</h2>
          <p>
            Consecuencias narrativas generadas por salud, escasez, expediciones
            y traslados.
          </p>
        </div>
        <label className={styles.fieldCompact}>
          Tipo
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(eventMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <p className={styles.empty}>Cargando eventos...</p>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <Radio size={24} />
            <h3>Sin eventos para este filtro</h3>
            <p>
              Los procesos diarios y las misiones alimentaran esta bitacora.
            </p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {events.map((event) => {
              const meta = eventMeta[event.type];
              const Icon = meta.icon;
              return (
                <article key={event.id}>
                  <div
                    className={`${styles.timelineIcon} ${styles[meta.tone]}`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className={styles.timelineBody}>
                    <div>
                      <strong>{meta.label}</strong>
                      <span className={styles.badge}>{event.status}</span>
                    </div>
                    <p>{event.description}</p>
                    <small>
                      {event.camp.name} ·{" "}
                      {new Date(event.createdAt).toLocaleString("es-MX")}
                      {event.probability !== null
                        ? ` · Probabilidad ${event.probability}%`
                        : ""}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
