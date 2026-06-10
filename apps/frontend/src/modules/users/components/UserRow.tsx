import { useState } from "react";
import type { UserSummary } from "../types/user.types";
import { useAuth } from "../../auth/context/useAuth";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import styles from "./UserRow.module.css";

const fmt = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("es-CR") : "—";

interface UserRowProps {
  user: UserSummary;
  onEdit: (user: UserSummary) => void;
}

export default function UserRow({ user, onEdit }: UserRowProps) {
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === user.id;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <tr className={styles.row} onClick={() => setIsOpen((prev) => !prev)}>
        <td className={styles.td} style={{ fontWeight: 500 }}>
          {user.username}
        </td>
        <td className={styles.td}>{user.email ?? "—"}</td>
        <td className={styles.td}>
          <span
            className={
              user.isActive ? styles.badgeActive : styles.badgeInactive
            }
          >
            {user.isActive ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td className={styles.td}>{user.activeSessionsCount}</td>
        <td className={styles.td}>{fmt(user.createdAt)}</td>
        <td className={styles.td}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={styles.toggleBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
            >
              <span
                className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
              >
                ▼
              </span>
              Detalles
            </button>
            <button
              className={styles.editBtn}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
              disabled={isSelf}
              title={isSelf ? "No puedes editarte a ti mismo" : undefined}
            >
              Editar
            </button>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td colSpan={6} className={styles.detailCell}>
            <div className={styles.detailGrid}>
              <DetailCard title="Campamento">
                <DetailField label="ID" value={`#${user.camp.id}`} />
                <DetailField label="Nombre" value={user.camp.name} />
              </DetailCard>

              <DetailCard title="Rol">
                <DetailField label="Nombre" value={user.role.name} />
                <DetailField
                  label="Descripción"
                  value={user.role.description}
                />
              </DetailCard>

              <DetailCard title="Persona">
                {user.person ? (
                  <>
                    <DetailField label="Nombre" value={user.person.fullName} />
                    <DetailField
                      label="Documento"
                      value={user.person.documentNumber ?? "—"}
                    />
                    <DetailField
                      label="Aceptado"
                      value={user.person.isAccepted ? "Sí" : "No"}
                    />
                  </>
                ) : (
                  <p className={styles.empty}>Sin persona asignada</p>
                )}
              </DetailCard>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
