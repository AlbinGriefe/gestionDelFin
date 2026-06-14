import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Check,
  HeartPulse,
  RefreshCw,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../auth/context/useAuth";
import { usePersons } from "../context/usePersons";
import type { PersonDetail } from "../types/persons.types";
import {
  personWorkflowApi,
  type AdmissionEvaluation,
  type ProfessionRecommendation,
} from "../api/person-workflow.api";
import styles from "./PersonWorkflowPanel.module.css";

function normalizeRole(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function reasonList(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (value && typeof value === "object")
    return Object.values(value).map(String);
  return value ? [String(value)] : [];
}

interface Props {
  personId: number;
  onClose: () => void;
}

export default function PersonWorkflowPanel({ personId, onClose }: Props) {
  const { user } = useAuth();
  const { getPersonById, loadPersons, persons, catalogs } = usePersons();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [admission, setAdmission] = useState<AdmissionEvaluation | null>(null);
  const [recommendation, setRecommendation] =
    useState<ProfessionRecommendation | null>(null);
  const [selectedProfessionId, setSelectedProfessionId] = useState<number>();
  const [doctorId, setDoctorId] = useState<number>();
  const [busy, setBusy] = useState(false);

  const role = normalizeRole(user?.roleName ?? "");
  const isAdmin = role === "administrador sistema";
  const isResourceManager =
    role.includes("gestion") && role.includes("recurso");

  const doctors = useMemo(
    () =>
      persons.filter(
        (item) =>
          item.admissionStatus === "accepted" &&
          item.isActive &&
          normalizeRole(item.profession?.name ?? "") === "medico",
      ),
    [persons],
  );

  const reload = useCallback(async () => {
    setPerson(await getPersonById(personId));
    await loadPersons();
  }, [getPersonById, loadPersons, personId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runAdmission = async (forceRefresh = false) => {
    setBusy(true);
    try {
      const result = await personWorkflowApi.evaluateAdmission(personId, {
        forceRefresh,
      });
      setAdmission(result.evaluation);
      toast.success(
        result.reusedExisting
          ? "Evaluacion pendiente recuperada"
          : "Evaluacion generada",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmAdmission = async (
    decision: "accept" | "observe" | "reject",
  ) => {
    if (!admission) return;
    setBusy(true);
    try {
      setAdmission(
        await personWorkflowApi.confirmAdmission(admission.id, decision),
      );
      toast.success("Decision de admision confirmada");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const runRecommendation = async () => {
    setBusy(true);
    try {
      const result = await personWorkflowApi.recommendProfession(personId);
      setRecommendation(result.recommendation);
      setSelectedProfessionId(result.recommendation.recommendedProfession.id);
      toast.success("Recomendacion generada");
    } finally {
      setBusy(false);
    }
  };

  const confirmProfession = async () => {
    if (!recommendation) return;
    setBusy(true);
    try {
      setRecommendation(
        await personWorkflowApi.confirmProfession(
          recommendation.id,
          selectedProfessionId,
          selectedProfessionId === recommendation.recommendedProfession.id
            ? "Recomendacion aceptada por el administrador."
            : "Oficio corregido por el administrador.",
        ),
      );
      toast.success("Oficio confirmado");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const heal = async () => {
    if (!doctorId) {
      toast.error("Selecciona una persona medica");
      return;
    }
    setBusy(true);
    try {
      const result = await personWorkflowApi.heal(doctorId, personId);
      toast.success(
        `Salud restaurada de ${result.healthBefore} a ${result.healthAfter}`,
      );
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.panel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Flujo de persona</span>
            <h2>{person?.fullName ?? "Cargando..."}</h2>
            <p>{person?.identifier}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar panel">
            <X size={19} />
          </button>
        </header>

        {!person ? (
          <div className={styles.loading}>
            <RefreshCw size={18} /> Cargando detalle...
          </div>
        ) : (
          <div className={styles.body}>
            <section className={styles.profile}>
              <p>{person.profileDescription}</p>
              <div className={styles.stats}>
                {person.stats &&
                  Object.entries({
                    Salud: `${person.stats.health}/${person.stats.maxHealth}`,
                    Fuerza: person.stats.strength,
                    Saciedad: person.stats.satiety,
                    Hidratacion: person.stats.hydration,
                    Suerte: person.stats.luck,
                    Nivel: person.stats.level,
                  }).map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
              </div>
            </section>

            {isAdmin &&
              person.admissionStatus !== "accepted" &&
              person.admissionStatus !== "rejected" && (
                <section className={styles.step}>
                  <div className={styles.stepTitle}>
                    <UserCheck size={18} />
                    <div>
                      <h3>1. Evaluacion de admision</h3>
                      <p>La salida es una recomendacion explicable.</p>
                    </div>
                  </div>
                  {!admission ? (
                    <button
                      className={styles.primary}
                      disabled={busy}
                      onClick={() => void runAdmission()}
                    >
                      <Bot size={16} /> Evaluar perfil
                    </button>
                  ) : (
                    <div className={styles.result}>
                      <div className={styles.resultHeader}>
                        <span className={styles.decision}>
                          {admission.decision}
                        </span>
                        <strong>
                          {Math.round(admission.confidence * 100)}% confianza
                        </strong>
                        <small>{admission.provider}</small>
                      </div>
                      <ul>
                        {reasonList(admission.reasons).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      {!admission.isFinal && (
                        <div className={styles.actions}>
                          <button
                            onClick={() => void confirmAdmission("accept")}
                            disabled={busy}
                          >
                            <Check size={15} /> Admitir
                          </button>
                          <button
                            onClick={() => void confirmAdmission("observe")}
                            disabled={busy}
                          >
                            Observar
                          </button>
                          <button
                            className={styles.danger}
                            onClick={() => void confirmAdmission("reject")}
                            disabled={busy}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {admission.isFinal &&
                        person.admissionStatus === "observe" && (
                          <div className={styles.observationFollowUp}>
                            <p>
                              La persona sigue en observacion y todavia no forma
                              parte activa del campamento. Debe ser evaluada y
                              admitida antes de asignarle un oficio.
                            </p>
                            <button
                              className={styles.primary}
                              disabled={busy}
                              onClick={() => void runAdmission(true)}
                            >
                              <RefreshCw size={15} /> Realizar nueva evaluacion
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </section>
              )}

            {isAdmin &&
              person.admissionStatus === "accepted" &&
              !person.profession && (
                <section className={styles.step}>
                  <div className={styles.stepTitle}>
                    <Sparkles size={18} />
                    <div>
                      <h3>2. Recomendacion de oficio</h3>
                      <p>Puedes aceptar o corregir la propuesta.</p>
                    </div>
                  </div>
                  {!recommendation ? (
                    <button
                      className={styles.primary}
                      disabled={busy}
                      onClick={() => void runRecommendation()}
                    >
                      <Bot size={16} /> Recomendar oficio
                    </button>
                  ) : (
                    <div className={styles.result}>
                      <div className={styles.resultHeader}>
                        <span className={styles.decision}>
                          {recommendation.recommendedProfession.name}
                        </span>
                        <strong>
                          {Math.round(recommendation.confidence * 100)}%
                          confianza
                        </strong>
                        <small>{recommendation.provider}</small>
                      </div>
                      <ul>
                        {reasonList(recommendation.reasons).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      {!recommendation.isFinal && (
                        <div className={styles.confirmProfession}>
                          <label>
                            Oficio final
                            <select
                              value={selectedProfessionId}
                              onChange={(event) =>
                                setSelectedProfessionId(
                                  Number(event.target.value),
                                )
                              }
                            >
                              {catalogs?.professions
                                .filter((item) => item.isActive)
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <button
                            className={styles.primary}
                            onClick={() => void confirmProfession()}
                            disabled={busy}
                          >
                            <Check size={15} /> Confirmar oficio
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

            {isResourceManager &&
              person.admissionStatus === "accepted" &&
              person.stats &&
              person.stats.health < person.stats.maxHealth && (
                <section className={styles.step}>
                  <div className={styles.stepTitle}>
                    <HeartPulse size={18} />
                    <div>
                      <h3>Curacion medica</h3>
                      <p>
                        Consume 3 unidades de comida y restaura hasta 5 de
                        salud.
                      </p>
                    </div>
                  </div>
                  <div className={styles.confirmProfession}>
                    <label>
                      Persona medica
                      <select
                        value={doctorId ?? ""}
                        onChange={(event) =>
                          setDoctorId(Number(event.target.value))
                        }
                      >
                        <option value="">Seleccionar</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className={styles.primary}
                      onClick={() => void heal()}
                      disabled={busy || doctors.length === 0}
                    >
                      <HeartPulse size={15} /> Aplicar curacion
                    </button>
                  </div>
                  {doctors.length === 0 && (
                    <p className={styles.warning}>
                      No hay personal medico activo disponible.
                    </p>
                  )}
                </section>
              )}

            {person.profession && (
              <section className={styles.complete}>
                <Check size={18} />
                <div>
                  <strong>{person.profession.name}</strong>
                  <span>Oficio asignado y flujo principal completado.</span>
                </div>
              </section>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
