import { useEffect, useState } from "react";
import { useUsers } from "../modules/users/context/useUsers";
import type {
  UserSummary,
  UserWriteInput,
} from "../modules/users/types/user.types";
import ListUsers from "../modules/users/components/UsersList";
import UserForm from "../modules/users/components/UserForm";
import UserDetailSearch from "../modules/users/components/UserDetailSearch";
import styles from "./UsersPage.module.css";

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
    <div style={{ padding: "24px 32px", background: "rgba(16,18,13,0.4)" }}>
      <h1>Gestión de Usuarios</h1>
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
          + Nuevo usuario
        </button>
      </div>

      <UserDetailSearch />

      <div className={styles.cardStyle}>
        <div className={styles.sectionHeaderStyle}>Lista de usuarios</div>
        <ListUsers onEdit={handleEdit} />
      </div>

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
