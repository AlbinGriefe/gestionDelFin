import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../auth/context/useAuth";
import { personsApi } from "../../persons/api/person.api";
import type { PersonSummary } from "../../persons/types/persons.types";
import { useProfessions } from "../context/useProfessions";
import type { ProfessionCoverageResult } from "../types/professions.types";
import styles from "./ProfessionCoveragePanel.module.css";

export default function ProfessionCoveragePanel() {
  const { user } = useAuth();
  const {
    getProfessionCoverage,
    createTemporaryReassignment,
    revertTemporaryReassignment,
  } = useProfessions();
  const [coverage, setCoverage] = useState<ProfessionCoverageResult | null>(
    null,
  );
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [targetProfessionId, setTargetProfessionId] = useState<number>();
  const [personId, setPersonId] = useState<number>();
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [coverageResult, peopleResult] = await Promise.all([
      getProfessionCoverage(user.campId),
      personsApi.listPersons({
        page: 1,
        pageSize: 100,
        campId: user.campId,
        admissionStatus: "accepted",
        active: true,
      }),
    ]);
    setCoverage(coverageResult);
    setPeople(peopleResult.items);
    const firstGap = coverageResult.professions.find(
      (item) => item.needsCoverage,
    );
    setTargetProfessionId((current) => current ?? firstGap?.profession.id);
  };

  useEffect(() => {
    void load();
    // The camp change is the only external trigger; action handlers refresh explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.campId]);

  const reassign = async () => {
    if (!targetProfessionId || !personId) {
      toast.error("Selecciona oficio y persona");
      return;
    }
    setBusy(true);
    try {
      const result = await createTemporaryReassignment({
        targetProfessionId,
        personIds: [personId],
        notes: "Cobertura temporal desde la interfaz operativa.",
      });
      if (result.reassigned.length) {
        toast.success("Cobertura temporal aplicada");
      } else {
        toast.warning(result.skipped[0]?.reason ?? "No fue posible reasignar");
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revert = async () => {
    if (!personId) {
      toast.error("Selecciona la persona que volvera a su oficio");
      return;
    }
    setBusy(true);
    try {
      const result = await revertTemporaryReassignment({
        personIds: [personId],
        notes: "Cobertura restablecida.",
      });
      if (result.reassigned.length) {
        toast.success("Persona devuelta a su oficio original");
      } else {
        toast.warning(
          result.skipped[0]?.reason ?? "No hay reasignacion temporal",
        );
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!coverage) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={17} /> Cargando cobertura...
      </div>
    );
  }

  const gaps = coverage.professions.filter((item) => item.needsCoverage);
  const candidates = people.filter(
    (person) => person.profession?.id !== targetProfessionId,
  );

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <span>Continuidad operativa</span>
          <h2>Cobertura actual</h2>
          <p>{coverage.totalNeedingCoverage} oficios requieren apoyo.</p>
        </div>
        <button onClick={() => void load()} title="Actualizar cobertura">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className={styles.coverageGrid}>
        {coverage.professions.map((item) => (
          <article
            key={item.profession.id}
            className={item.needsCoverage ? styles.gap : ""}
          >
            <strong>{item.activeWorkers}</strong>
            <div>
              <span>{item.profession.name}</span>
              <small>
                {item.needsCoverage
                  ? "Sin personal activo"
                  : `${item.totalPersons} asignadas · ${item.outOfCamp} fuera`}
              </small>
            </div>
            {item.needsCoverage && <AlertTriangle size={15} />}
          </article>
        ))}
      </div>

      <div className={styles.assignment}>
        <label>
          Oficio sin cobertura
          <select
            value={targetProfessionId ?? ""}
            onChange={(event) =>
              setTargetProfessionId(Number(event.target.value))
            }
          >
            <option value="">Seleccionar</option>
            {gaps.map((item) => (
              <option key={item.profession.id} value={item.profession.id}>
                {item.profession.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Persona disponible
          <select
            value={personId ?? ""}
            onChange={(event) => setPersonId(Number(event.target.value))}
          >
            <option value="">Seleccionar</option>
            {candidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName} · {person.profession?.name ?? "Sin oficio"}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={busy || gaps.length === 0}
          onClick={() => void reassign()}
        >
          <UserRoundPlus size={16} /> Cubrir temporalmente
        </button>
        <button
          className={styles.secondary}
          disabled={busy}
          onClick={() => void revert()}
        >
          <RotateCcw size={16} /> Revertir
        </button>
      </div>
    </section>
  );
}
