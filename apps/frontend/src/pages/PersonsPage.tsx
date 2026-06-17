import { useState } from "react";
import { usePersons } from "../modules/persons/context/usePersons";
import type {
  PersonSummary,
  PersonWriteInput,
} from "../modules/persons/types/persons.types";
import PersonsList from "../modules/persons/components/PersonsList";
import PersonForm from "../modules/persons/components/PersonForm";
import PersonWorkflowPanel from "../modules/persons/components/PersonWorkflowPanel";
import styles from "./PersonsPage.module.css";
import { useAuth } from "../modules/auth/context/useAuth";
import { isAdministrator } from "../shared/auth/roles";

export default function PersonsPage() {
  const { createPerson, updatePerson } = usePersons();
  const { user } = useAuth();

  const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [workflowPersonId, setWorkflowPersonId] = useState<number | null>(null);
  const isAdmin = Boolean(user && isAdministrator(user.roleName));

  const handleCreate = () => {
    setSelectedPerson(null);
    setModalOpen(true);
  };

  const handleEdit = (person: PersonSummary) => {
    setSelectedPerson(person);
    setModalOpen(true);
  };

  const handleClose = () => {
    setSelectedPerson(null);
    setModalOpen(false);
  };

  const handleSubmit = async (data: PersonWriteInput) => {
    if (selectedPerson) {
      await updatePerson(selectedPerson.id, data);
    } else {
      await createPerson(data);
    }
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        background: "rgba(16,18,13,0.4)",
        minHeight: "100vh",
      }}
    >
      <h1>Gestión de Personas</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        {isAdmin && (
          <button
            onClick={handleCreate}
            style={{
              padding: "8px 14px",
              background: "var(--moss)",
              color: "var(--bone)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Registrar persona
          </button>
        )}
      </div>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Lista de personas</div>
        <PersonsList
          onEdit={isAdmin ? handleEdit : undefined}
          onWorkflow={(person) => setWorkflowPersonId(person.id)}
        />
      </div>

      {modalOpen && (
        <PersonForm
          initialData={selectedPerson}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
      {workflowPersonId !== null && (
        <PersonWorkflowPanel
          personId={workflowPersonId}
          onClose={() => setWorkflowPersonId(null)}
        />
      )}
    </div>
  );
}
