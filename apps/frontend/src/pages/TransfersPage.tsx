import { useState } from "react";
import { useTransfers } from "../modules/transfers/context/useTransfers";
import type {
    TransferSummary,
    TransferCreateInput,
    TransferStateUpdateInput,
} from "../modules/transfers/types/transfers.types";
import TransfersList from "../modules/transfers/components/TransfersList";
import TransferForm from "../modules/transfers/components/TransferForm";
import TransferStateModal from "../modules/transfers/components/TransferStateModal";
import styles from "./TransfersPage.module.css";

export default function TransfersPage() {
    const { createTransfer, updateTransferState } = useTransfers();

    const [formOpen, setFormOpen] = useState(false);
    const [managedTransfer, setManagedTransfer] = useState<TransferSummary | null>(null);

    const handleCreate = async (data: TransferCreateInput) => {
        await createTransfer(data);
    };

    const handleManage = async (data: TransferStateUpdateInput) => {
        if (managedTransfer) {
            await updateTransferState(managedTransfer.id, data);
        }
    };

    return (
        <div style={{ padding: "24px 32px", background: "#f9f9f7", minHeight: "100vh" }}>
            <h1>Traslados entre campamentos</h1>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
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
                    + Nueva solicitud
                </button>
            </div>

            <div className={styles.cardStyle}>
                <div className={styles.sectionHeaderStyle}>Solicitudes de traslado</div>
                <TransfersList onManage={setManagedTransfer} />
            </div>

            {formOpen && (
                <TransferForm
                    onSubmit={handleCreate}
                    onClose={() => setFormOpen(false)}
                />
            )}

            {managedTransfer && (
                <TransferStateModal
                    transfer={managedTransfer}
                    onConfirm={handleManage}
                    onClose={() => setManagedTransfer(null)}
                />
            )}
        </div>
    );
}
