import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MapPin, Plus, Radar } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../modules/auth/context/useAuth";
import { httpClient } from "../shared/api/httpClient";
import styles from "./OperationsPage.module.css";

type Zone = {
  id: number;
  campId: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  risk: "low" | "medium" | "high" | "critical";
  isActive: boolean;
};

const riskLabels = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  critical: "Critico",
};

function canManage(roleName: string) {
  const role = roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return role.includes("viaje") || role.includes("comunic");
}

export default function ZonesPage() {
  const { user } = useAuth();
  const campId = user?.campId;
  const [zones, setZones] = useState<Zone[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setZones(
      await httpClient<Zone[]>(
        `/exploration-zones?campId=${user?.campId ?? ""}`,
      ),
    );
  };

  useEffect(() => {
    if (!campId) return;
    void httpClient<Zone[]>(`/exploration-zones?campId=${campId}`).then(
      setZones,
    );
  }, [campId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await httpClient<Zone>("/exploration-zones", {
      method: "POST",
      body: JSON.stringify({
        campId: user?.campId,
        name: data.get("name"),
        description: data.get("description") || null,
        latitude: data.get("latitude") ? Number(data.get("latitude")) : null,
        longitude: data.get("longitude") ? Number(data.get("longitude")) : null,
        risk: data.get("risk"),
        isActive: true,
      }),
    });
    toast.success("Zona registrada");
    event.currentTarget.reset();
    setShowForm(false);
    await load();
  };

  return (
    <section className={styles.stack}>
      <div className={styles.pageIntro}>
        <div>
          <span>Planificacion territorial</span>
          <h2>Zonas de exploracion</h2>
          <p>Riesgo y coordenadas disponibles para vincular expediciones.</p>
        </div>
        {user && canManage(user.roleName) && (
          <button
            className={styles.primaryButton}
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={17} /> Nueva zona
          </button>
        )}
      </div>

      {showForm && (
        <form
          className={styles.inlineForm}
          onSubmit={(event) => void submit(event)}
        >
          <label>
            Nombre
            <input name="name" required minLength={2} />
          </label>
          <label>
            Riesgo
            <select name="risk" defaultValue="medium">
              {Object.entries(riskLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Latitud
            <input name="latitude" type="number" step="any" />
          </label>
          <label>
            Longitud
            <input name="longitude" type="number" step="any" />
          </label>
          <label className={styles.wideField}>
            Descripcion
            <input name="description" maxLength={255} />
          </label>
          <button className={styles.primaryButton} type="submit">
            Guardar zona
          </button>
        </form>
      )}

      <div className={styles.zoneGrid}>
        {zones.map((zone) => (
          <article key={zone.id} className={styles.zoneCard}>
            <div className={styles.zoneMap}>
              <Radar size={34} />
              {zone.latitude !== null && zone.longitude !== null && (
                <span>
                  <MapPin size={13} /> {zone.latitude.toFixed(3)},{" "}
                  {zone.longitude.toFixed(3)}
                </span>
              )}
            </div>
            <div className={styles.zoneContent}>
              <div>
                <span
                  className={`${styles.risk} ${styles[`risk_${zone.risk}`]}`}
                >
                  Riesgo {riskLabels[zone.risk]}
                </span>
                <span className={styles.badge}>
                  {zone.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <h3>{zone.name}</h3>
              <p>{zone.description ?? "Sin descripcion adicional."}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
