import { useEffect, useState } from "react";
import { ClipboardList, Save } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../auth/context/useAuth";
import { personsApi } from "../../persons/api/person.api";
import type { PersonSummary } from "../../persons/types/persons.types";
import { dailyProcessesApi } from "../api/daily-processes.api";
import type { DailyAssignmentTask } from "../types/daily-processes.types";
import styles from "./DailyAssignmentsPanel.module.css";

const tasks: Array<{ value: DailyAssignmentTask; label: string }> = [
  { value: "food_production", label: "Produccion de comida" },
  { value: "water_production", label: "Produccion de agua" },
  { value: "camp_support", label: "Apoyo del campamento" },
];

function defaultTask(person: PersonSummary): DailyAssignmentTask {
  const profession = person.profession?.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (profession === "agricultor" || profession === "cazador")
    return "food_production";
  if (profession === "cientifico") return "water_production";
  return "camp_support";
}

export default function DailyAssignmentsPanel() {
  const { user } = useAuth();
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [draft, setDraft] = useState<Record<number, DailyAssignmentTask>>({});
  const [saving, setSaving] = useState(false);
  const date = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      personsApi.listPersons({
        page: 1,
        pageSize: 100,
        campId: user.campId,
        admissionStatus: "accepted",
        active: true,
      }),
      dailyProcessesApi.getAssignments(user.campId, date),
    ]).then(([peopleResult, assignmentResult]) => {
      const eligible = peopleResult.items.filter(
        (person) => !person.healthStatus || person.healthStatus.canWork,
      );
      const existing = new Map(
        assignmentResult.assignments.map((item) => [item.personId, item.task]),
      );
      setPeople(eligible);
      setDraft(
        Object.fromEntries(
          eligible.map((person) => [
            person.id,
            existing.get(person.id) ?? defaultTask(person),
          ]),
        ),
      );
    });
  }, [date, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await dailyProcessesApi.updateAssignments({
        campId: user.campId,
        date,
        assignments: people.map((person) => ({
          personId: person.id,
          task: draft[person.id] ?? defaultTask(person),
        })),
      });
      toast.success("Asignaciones del dia guardadas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <ClipboardList size={19} />
          <div>
            <h2>Asignaciones del dia</h2>
            <p>{date} · solo personas disponibles</p>
          </div>
        </div>
        <button
          onClick={() => void save()}
          disabled={saving || people.length === 0}
        >
          <Save size={15} /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <div className={styles.list}>
        {people.map((person) => {
          const selected = draft[person.id] ?? defaultTask(person);
          const expected = defaultTask(person);
          return (
            <article key={person.id}>
              <div>
                <strong>{person.fullName}</strong>
                <span>{person.profession?.name ?? "Sin oficio"}</span>
              </div>
              <select
                value={selected}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [person.id]: event.target.value as DailyAssignmentTask,
                  }))
                }
              >
                {tasks.map((task) => (
                  <option key={task.value} value={task.value}>
                    {task.label}
                  </option>
                ))}
              </select>
              <span
                className={
                  selected === expected ? styles.compatible : styles.penalty
                }
              >
                {selected === expected ? "Compatible" : "Penalizacion -6"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
