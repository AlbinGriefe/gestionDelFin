import { useState } from "react";
import type { UserSummary, UserWriteInput, UsersCatalogs } from "../types/user.types";
import CatalogSelect, { type CatalogItem } from "../../../components/CatalogSelect";
import styles from "./UserForm.module.css";

interface UserFormProps {
    initialData?: UserSummary | null;
    catalogs: UsersCatalogs;
    onSubmit: (data: UserWriteInput) => Promise<void>;
    onClose: () => void;
}

type Tab = "info" | "password";

export default function UserForm({ initialData, catalogs, onSubmit, onClose }: UserFormProps) {
    const isEditing = !!initialData;

    const [activeTab, setActiveTab] = useState<Tab>("info");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [username, setUsername] = useState(initialData?.username ?? "");
    const [email, setEmail] = useState(initialData?.email ?? "");
    const [password, setPassword] = useState("");
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [campId, setCampId] = useState<number | null>(initialData?.camp?.id ?? null);
    const [roleId, setRoleId] = useState<number | null>(initialData?.role?.id ?? null);
    const [personId, setPersonId] = useState<number | null>(initialData?.person?.id ?? null);

    const campItems: CatalogItem[] = catalogs.camps.map(c => ({
        id: c.id,
        label: c.name,
        sublabel: c.location,
        meta: (
            <span style={{
                fontSize: 11, fontWeight: 500, padding: "1px 7px", borderRadius: 20,
                background: c.status === "active" ? "#EAF3DE" : "#F1EFE8",
                color: c.status === "active" ? "#3B6D11" : "#5F5E5A",
            }}>
                {c.status === "active" ? "Activo" : "Inactivo"}
            </span>
        ),
    }));

    const roleItems: CatalogItem[] = catalogs.roles.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: r.description,
        meta: (
            <span style={{
                fontSize: 11, fontWeight: 500, padding: "1px 7px", borderRadius: 20,
                background: r.isSystemRole ? "#E6F1FB" : "#F1EFE8",
                color: r.isSystemRole ? "#0C447C" : "#5F5E5A",
            }}>
                {r.isSystemRole ? "Sistema" : "Personalizado"}
            </span>
        ),
    }));

    const personItems: CatalogItem[] = catalogs.persons.map(p => ({
        id: p.id,
        label: p.fullName,
        sublabel: `${p.campName}${p.documentNumber ? ` · Doc: ${p.documentNumber}` : ""} · ${p.linkedUsersCount} vinculado(s)`,
    }));

    const handleSubmit = async () => {
        setError("");

        if (!username.trim()) return setError("El nombre de usuario es obligatorio.");

        if (!roleId) return setError("Selecciona un rol.");
        if (!isEditing && !password.trim()) return setError("La contraseña es obligatoria al crear un usuario.");

        if (password.trim()) {
            if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
            if (!/[a-z]/.test(password)) return setError("La contraseña debe incluir al menos una letra minúscula.");
            if (!/[A-Z]/.test(password)) return setError("La contraseña debe incluir al menos una letra mayúscula.");
        }

        const payload: UserWriteInput = {
            usr_username: username.trim(),
            usr_email: email.trim() || null,
            id_camp: campId ?? undefined,
            id_role: roleId,
            id_person: personId ?? null,
            usr_is_active: isActive,
            ...(password.trim() ? { usr_password: password.trim() } : {}),
        };

        try {
            setLoading(true);
            await onSubmit(payload);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <span className={styles.title}>
                        {isEditing ? "Editar usuario" : "Nuevo usuario"}
                        {isEditing && (
                            <span className={styles.subtitle}>· {initialData.username}</span>
                        )}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("info")}
                    >
                        Información
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "password" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("password")}
                    >
                        Contraseña {!isEditing && <span style={{ color: "#A32D2D" }}>*</span>}
                    </button>
                </div>

                <div className={styles.body}>
                    {activeTab === "info" && (
                        <>
                            <p className={styles.sectionTitle}>Credenciales</p>
                            <div className={styles.formRow}>
                                <div>
                                    <label className={styles.label}>Nombre de usuario</label>
                                    <input
                                        className={styles.input}
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="ej. jperez"
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>
                                        Email <span className={styles.optional}>(opcional)</span>
                                    </label>
                                    <input
                                        className={styles.input}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="usuario@correo.com"
                                    />
                                </div>
                            </div>

                            <p className={styles.sectionTitle}>Asociaciones</p>
                            <div className={styles.formRow}>
                                <div>
                                    <label className={styles.label}>
                                        Campamento <span className={styles.optional}>(opcional)</span>
                                    </label>
                                    <CatalogSelect
                                        placeholder="Seleccionar..."
                                        sectionTitle="campamentos"
                                        items={campItems}
                                        selectedId={campId}
                                        onChange={item => setCampId(item.id)}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>Rol</label>
                                    <CatalogSelect
                                        placeholder="Seleccionar..."
                                        sectionTitle="roles"
                                        items={roleItems}
                                        selectedId={roleId}
                                        onChange={item => setRoleId(item.id)}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Persona <span className={styles.optional}>(opcional)</span>
                                </label>
                                <CatalogSelect
                                    placeholder="Seleccionar persona..."
                                    sectionTitle="personas registradas"
                                    items={personItems}
                                    selectedId={personId}
                                    onChange={item => setPersonId(item.id)}
                                />
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Usuario activo</span>
                                <button
                                    type="button"
                                    className={`${styles.toggle} ${isActive ? styles.toggleOn : ""}`}
                                    onClick={() => setIsActive(prev => !prev)}
                                >
                                    <span className={`${styles.toggleDot} ${isActive ? styles.toggleDotOn : ""}`} />
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === "password" && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    {isEditing ? "Nueva contraseña" : "Contraseña"}
                                    {!isEditing && <span style={{ color: "#A32D2D", marginLeft: 4 }}>*</span>}
                                </label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        className={styles.input}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className={styles.showPasswordBtn}
                                        onClick={() => setShowPassword(prev => !prev)}
                                    >
                                        {showPassword ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>
                                {isEditing && (
                                    <p className={styles.hint}>
                                        Deja el campo vacío si no deseas cambiar la contraseña.
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear usuario"}
                    </button>
                </div>

            </div>
        </div>
    );
}