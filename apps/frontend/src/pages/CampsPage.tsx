import { useEffect, useState } from "react";
import { useCamps } from "../modules/camps/context/useCamps";
import { useAuth } from "../modules/auth/context/useAuth";
import type {
  CampSummary,
  CampWriteInput,
} from "../modules/camps/types/camps.types";
import CampsList from "../modules/camps/components/CampsList";
import CampForm from "../modules/camps/components/CampForm";
import CampMap from "../modules/camps/components/CampMap";
import type { TransferRoute } from "../modules/camps/components/CampMap";
import { httpClient } from "../shared/api/httpClient";
import styles from "./CampsPage.module.css";

type TransfersResponse = {
  items: Array<{
    id: number;
    state: string;
    originCamp: { id: number };
    destinyCamp: { id: number };
  }>;
};

export default function CampsPage() {
  const { camps, createCamp, updateCamp } = useCamps();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<TransferRoute[]>([]);

  useEffect(() => {
    httpClient<TransfersResponse>("/transfers?pageSize=100")
      .then((response) =>
        setRoutes(
          response.items.map((transfer) => ({
            id: transfer.id,
            fromCampId: transfer.originCamp.id,
            toCampId: transfer.destinyCamp.id,
            state: transfer.state,
          })),
        ),
      )
      .catch(() => undefined);
  }, []);

  const [selectedCamp, setSelectedCamp] = useState<CampSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = () => {
    setSelectedCamp(null);
    setModalOpen(true);
  };

  const handleEdit = (camp: CampSummary) => {
    setSelectedCamp(camp);
    setModalOpen(true);
  };

  const handleClose = () => {
    setSelectedCamp(null);
    setModalOpen(false);
  };

  const handleSubmit = async (data: CampWriteInput) => {
    if (selectedCamp) {
      await updateCamp(selectedCamp.id, data);
    } else {
      await createCamp(data);
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
      <h1>Gestión de Campamentos</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
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
          + Nuevo campamento
        </button>
      </div>

      <div className={styles.cardStyle} style={{ marginBottom: 18 }}>
        <div className={styles.sectionHeaderStyle}>Mapa de campamentos</div>
        <div style={{ padding: 16 }}>
          <CampMap camps={camps} routes={routes} activeCampId={user?.campId} />
        </div>
      </div>

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Lista de campamentos</div>
        <CampsList onEdit={handleEdit} />
      </div>

      {modalOpen && (
        <CampForm
          initialData={selectedCamp}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
