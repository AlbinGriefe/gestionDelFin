import { useState } from "react";
import { useUsers } from "../context/useUsers";
import type { UserDetail } from "../types/user.types";
import DetailCard from "../../../components/DetailCard";
import DetailField from "../../../components/DetailField";
import SearchById from "../../../components/SearchById";
import styles from "./UserDetailSearch.module.css";

type Tab = "general" | "sesiones" | "eventos";

const fmt = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleString("es-CR") : "—";

function GeneralTab({ user }: { user: UserDetail }) {
    return (
        <div className={styles.body}>
            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Usuario</span>
                    <span className={styles.metaValue}>{user.username}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Email</span>
                    <span className={styles.metaValue}>{user.email ?? "—"}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Estado</span>
                    <span className={user.isActive ? styles.badgeActive : styles.badgeInactive}>
                        {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Sesiones activas</span>
                    <span className={styles.metaValue}>{user.activeSessionsCount}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Último ingreso</span>
                    <span className={styles.metaValue}>{fmt(user.lastLoginAt)}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Creado</span>
                    <span className={styles.metaValue}>{fmt(user.createdAt)}</span>
                </div>
            </div>

            <div className={styles.infoGrid}>
                <DetailCard title="Campamento">
                    {user.camp ? (
                        <>
                            <DetailField label="ID" value={`#${user.camp.id}`} />
                            <DetailField label="Nombre" value={user.camp.name} />
                        </>
                    ) : (
                        <DetailField label="" value="Sin campamento asignado" />
                    )}
                </DetailCard>

                <DetailCard title="Rol">
                    <DetailField label="Nombre" value={user.role.name} />
                    <DetailField label="Descripción" value={user.role.description} />
                </DetailCard>

                <DetailCard title="Persona">
                    {user.person ? (
                        <>
                            <DetailField label="Nombre" value={user.person.fullName} />
                            <DetailField label="Documento" value={user.person.documentNumber ?? "—"} />
                            <DetailField label="Aceptado" value={user.person.isAccepted ? "Sí" : "No"} />
                        </>
                    ) : (
                        <DetailField label="" value="Sin persona asignada" />
                    )}
                </DetailCard>
            </div>
        </div>
    );
}

function SesionesTab({ user }: { user: UserDetail }) {
    if (user.recentSessions.length === 0) {
        return <p className={styles.empty}>Sin sesiones recientes.</p>;
    }

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>IP</th>
                    <th>Ingreso</th>
                    <th>Última actividad</th>
                    <th>Expira</th>
                    <th>Camp ID</th>
                </tr>
            </thead>
            <tbody>
                {user.recentSessions.map(s => (
                    <tr key={s.id}>
                        <td>{s.ipAddress}</td>
                        <td>{fmt(s.loginAt)}</td>
                        <td>{fmt(s.lastUpdateAt)}</td>
                        <td>{fmt(s.expiresAt)}</td>
                        <td>#{s.campId}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function EventosTab({ user }: { user: UserDetail }) {
    if (user.recentEvents.length === 0) {
        return <p className={styles.empty}>Sin eventos recientes.</p>;
    }

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Acción</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Actor</th>
                </tr>
            </thead>
            <tbody>
                {user.recentEvents.map(e => (
                    <tr key={e.id}>
                        <td>{e.action}</td>
                        <td>{e.description ?? "—"}</td>
                        <td>{fmt(e.createdAt)}</td>
                        <td>{e.actorUserId ? `#${e.actorUserId}` : "—"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function UserDetailTabs({ user }: { user: UserDetail }) {
    const [activeTab, setActiveTab] = useState<Tab>("general");

    return (
        <>
            <div className={styles.tabs}>
                {(["general", "sesiones", "eventos"] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            {activeTab === "general" && <GeneralTab user={user} />}
            {activeTab === "sesiones" && <SesionesTab user={user} />}
            {activeTab === "eventos" && <EventosTab user={user} />}
        </>
    );
}

export default function UserDetailSearch() {
    const { getUserById } = useUsers();

    return (
        <SearchById
            label="Buscar usuario por ID"
            onSearch={getUserById}
        >
            {(user: UserDetail) => <UserDetailTabs user={user} />}
        </SearchById>
    );
}