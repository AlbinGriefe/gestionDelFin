import { useEffect, useState } from "react";
import { useUsers } from "../modules/users/context/useUsers";
import type { UserSummary, UserWriteInput } from "../modules/users/types/user.types";
import ListUsers from "../modules/users/components/UsersList";
import UserForm from "../modules/users/components/UserForm";
import UserDetailSearch from "../modules/users/components/UserDetailSearch";

export default function UsersPage() {
    const { catalogs, loadCatalogs, createUser, updateUser } = useUsers();

    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    const handleCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: UserSummary) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleClose = () => {
        setSelectedUser(null);
        setModalOpen(false);
    };

    const handleSubmit = async (data: UserWriteInput) => {
        if (selectedUser) {
            await updateUser(selectedUser.id, data);
        } else {
            await createUser(data);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h1 style={{ fontSize: 18, fontWeight: 500 }}>Usuarios</h1>
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
                    + Nuevo usuario
                </button>
            </div>

            <UserDetailSearch />

            <ListUsers onEdit={handleEdit} />

            {modalOpen && catalogs && (
                <UserForm
                    initialData={selectedUser}
                    catalogs={catalogs}
                    onSubmit={handleSubmit}
                    onClose={handleClose}
                />
            )}
        </div>
    );
}