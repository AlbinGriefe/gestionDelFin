import { useState } from "react";
import { useCamps } from "../modules/camps/context/useCamps";
import type { CampSummary, CampWriteInput } from "../modules/camps/types/camps.types";
import CampsList from "../modules/camps/components/CampsList";
import CampForm from "../modules/camps/components/CampForm";
import styles from "./CampsPage.module.css";

export default function CampsPage() {
    const { createCamp, updateCamp } = useCamps();

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
        <div style={{ padding: "24px 32px", background: "#f9f9f7", minHeight: "100vh" }}>
            <h1>Gestión de Campamentos</h1>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
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
                    + Nuevo campamento
                </button>
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
