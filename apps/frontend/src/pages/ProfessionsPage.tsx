import { useState } from "react";
import { useProfessions } from "../modules/professions/context/useProfessions";
import type {
  ProfessionSummary,
  ProfessionWriteInput,
} from "../modules/professions/types/professions.types";
import ProfessionsList from "../modules/professions/components/ProfessionsList";
import ProfessionForm from "../modules/professions/components/ProfessionForm";
import ProfessionCoveragePanel from "../modules/professions/components/ProfessionCoveragePanel";
import styles from "./ProfessionsPage.module.css";

export default function ProfessionsPage() {
  const { createProfession, updateProfession } = useProfessions();

  const [selectedProfession, setSelectedProfession] =
    useState<ProfessionSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = () => {
    setSelectedProfession(null);
    setModalOpen(true);
  };

  const handleEdit = (profession: ProfessionSummary) => {
    setSelectedProfession(profession);
    setModalOpen(true);
  };

  const handleClose = () => {
    setSelectedProfession(null);
    setModalOpen(false);
  };

  const handleSubmit = async (data: ProfessionWriteInput) => {
    if (selectedProfession) {
      await updateProfession(selectedProfession.id, data);
    } else {
      await createProfession(data);
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
      <h1>Gestión de Profesiones</h1>
      <ProfessionCoveragePanel />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "20px 0",
        }}
      >
        <button
          onClick={handleCreate}
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
          + Nueva profesión
        </button>
      </div>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Lista de profesiones</div>
        <ProfessionsList onEdit={handleEdit} />
      </div>

      {modalOpen && (
        <ProfessionForm
          initialData={selectedProfession}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
