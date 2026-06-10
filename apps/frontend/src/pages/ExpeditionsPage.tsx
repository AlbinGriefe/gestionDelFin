import { useState } from "react";
import { useExpeditions } from "../modules/expeditions/context/useExpeditions";
import type {
  ExpeditionSummary,
  ExpeditionCreateInput,
  ExpeditionStateUpdateInput,
} from "../modules/expeditions/types/expeditions.types";
import ExpeditionsList from "../modules/expeditions/components/ExpeditionsList";
import ExpeditionForm from "../modules/expeditions/components/ExpeditionForm";
import ExpeditionStateModal from "../modules/expeditions/components/ExpeditionStateModal";
import styles from "./ExpeditionsPage.module.css";

export default function ExpeditionsPage() {
  const { createExpedition, updateExpeditionState } = useExpeditions();

  const [formOpen, setFormOpen] = useState(false);
  const [managedExpedition, setManagedExpedition] =
    useState<ExpeditionSummary | null>(null);

  const handleCreate = async (data: ExpeditionCreateInput) => {
    await createExpedition(data);
  };

  const handleManage = async (data: ExpeditionStateUpdateInput) => {
    if (managedExpedition) {
      await updateExpeditionState(managedExpedition.id, data);
    }
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        background: "#f9f9f7",
        minHeight: "100vh",
      }}
    >
      <h1>Gestión de Expediciones</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setFormOpen(true)}
          style={{
            padding: "8px 14px",
            background: "#185FA5",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Nueva expedición
        </button>
      </div>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Lista de expediciones</div>
        <ExpeditionsList onManage={setManagedExpedition} />
      </div>

      {formOpen && (
        <ExpeditionForm
          onSubmit={handleCreate}
          onClose={() => setFormOpen(false)}
        />
      )}

      {managedExpedition && (
        <ExpeditionStateModal
          expedition={managedExpedition}
          onConfirm={handleManage}
          onClose={() => setManagedExpedition(null)}
        />
      )}
    </div>
  );
}
