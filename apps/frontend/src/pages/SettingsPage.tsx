import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bot, CheckCircle2, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../modules/auth/context/useAuth";
import { httpClient } from "../shared/api/httpClient";
import styles from "./OperationsPage.module.css";

type CampDetail = {
  operationalRules: {
    expeditionSuccessProbability: number;
    transferSuccessProbability: number;
    diseaseProbability: number;
    valuableResourceProbability: number;
    diseaseHealthThreshold: number;
  } | null;
};

export default function SettingsPage() {
  const { user, sessionConfig } = useAuth();
  const [rules, setRules] = useState<CampDetail["operationalRules"]>(null);

  useEffect(() => {
    if (!user) return;
    httpClient<CampDetail>(`/camps/${user.campId}`).then((camp) =>
      setRules(camp.operationalRules),
    );
  }, [user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    await httpClient(`/camps/${user.campId}/operational-rules`, {
      method: "PUT",
      body: JSON.stringify({
        expeditionSuccessProbability: Number(data.get("expedition")),
        transferSuccessProbability: Number(data.get("transfer")),
        diseaseProbability: Number(data.get("disease")),
        valuableResourceProbability: Number(data.get("valuable")),
        diseaseHealthThreshold: Number(data.get("threshold")),
      }),
    });
    toast.success("Reglas operativas actualizadas");
  };

  return (
    <section className={styles.stack}>
      <div className={styles.pageIntro}>
        <div>
          <span>Administracion del sistema</span>
          <h2>Configuracion operativa</h2>
          <p>Parametros por campamento y estado de integraciones.</p>
        </div>
      </div>

      <div className={styles.twoColumns}>
        <article className={styles.panel}>
          <div className={styles.sectionHeading}>
            <Bot size={20} />
            <div>
              <h3>Proveedor de IA</h3>
              <p>Decision textual explicable</p>
            </div>
          </div>
          <div className={styles.statusLine}>
            <CheckCircle2 size={17} />
            <div>
              <strong>Reglas deterministas activas</strong>
              <span>
                Produccion no requiere Ollama ni descargas de modelos.
              </span>
            </div>
          </div>
          <div className={styles.notice}>
            <ShieldAlert size={17} />
            <p>
              La sustitucion del analisis de imagen por IA textual permanece
              como desviacion academica pendiente de aprobacion.
            </p>
          </div>
          <div className={styles.definitionList}>
            <div>
              <span>Tiempo de inactividad</span>
              <strong>{sessionConfig?.sessionTimeoutMinutes ?? 20} min</strong>
            </div>
            <div>
              <span>Campamento</span>
              <strong>{user?.campName}</strong>
            </div>
            <div>
              <span>Proveedor cloud</span>
              <strong>No requerido</strong>
            </div>
          </div>
        </article>

        <form className={styles.panel} onSubmit={(event) => void submit(event)}>
          <div className={styles.sectionHeading}>
            <Save size={20} />
            <div>
              <h3>Probabilidades base</h3>
              <p>Valores entre 0 y 100</p>
            </div>
          </div>
          {rules ? (
            <div className={styles.formGrid}>
              <label>
                Exito de expedicion
                <input
                  name="expedition"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={rules.expeditionSuccessProbability}
                />
              </label>
              <label>
                Exito de traslado
                <input
                  name="transfer"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={rules.transferSuccessProbability}
                />
              </label>
              <label>
                Enfermedad
                <input
                  name="disease"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={rules.diseaseProbability}
                />
              </label>
              <label>
                Recurso valioso
                <input
                  name="valuable"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={rules.valuableResourceProbability}
                />
              </label>
              <label>
                Umbral de salud
                <input
                  name="threshold"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={rules.diseaseHealthThreshold}
                />
              </label>
              <button className={styles.primaryButton} type="submit">
                <Save size={16} /> Guardar cambios
              </button>
            </div>
          ) : (
            <p className={styles.empty}>Cargando reglas...</p>
          )}
        </form>
      </div>
    </section>
  );
}
