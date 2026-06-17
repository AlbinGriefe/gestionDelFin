import { useState } from "react";
import type {
  UserSummary,
  UserWriteInput,
  UsersCatalogs,
} from "../types/user.types";
import CatalogSelect, {
  type CatalogItem,
} from "../../../components/CatalogSelect";
import { ApiError } from "../../../shared/api/apiError";
import { isSuperAdmin, normalizeRoleName } from "../../../shared/auth/roles";
import styles from "./UserForm.module.css";
import { toast } from "sonner";

interface UserFormProps {
  initialData?: UserSummary | null;
  catalogs: UsersCatalogs;
  onSubmit: (data: UserWriteInput) => Promise<void>;
  onClose: () => void;
}

type Tab = "info" | "password";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

function getRoleDisplayName(roleName: string) {
  const normalized = normalizeRoleName(roleName);

  if (normalized === "superadmin") {
    return "SuperAdmin";
  }

  if (normalized === "administrador sistema") {
    return "Admin de campamento";
  }

  return roleName;
}

function getRoleDescription(role: UsersCatalogs["roles"][number]) {
  const normalized = normalizeRoleName(role.name);

  if (normalized === "superadmin") {
    return "Acceso global a todos los campamentos.";
  }

  if (normalized === "administrador sistema") {
    return "Gestiona solo campamentos asignados.";
  }

  return role.description;
}

function extractUserFormError(error: unknown): { message: string; tab: Tab } {
  if (error instanceof ApiError) {
    const details = error.details as
      | {
          fieldErrors?: Record<string, string[] | undefined>;
        }
      | null
      | undefined;
    const fieldErrors = details?.fieldErrors;

    if (fieldErrors?.usr_password?.length) {
      return {
        message:
          "La contrasena debe tener al menos 8 caracteres, una minuscula, una mayuscula y un numero.",
        tab: "password",
      };
    }

    if (fieldErrors?.usr_username?.length) {
      return {
        message:
          "El nombre de usuario solo puede usar letras, numeros, puntos, guiones y guiones bajos.",
        tab: "info",
      };
    }

    if (fieldErrors?.usr_email?.length) {
      return {
        message: "El email no tiene un formato valido.",
        tab: "info",
      };
    }

    if (error.serverCode === "USER_PERSON_ALREADY_LINKED") {
      return {
        message: "La persona seleccionada ya esta vinculada a otro usuario.",
        tab: "info",
      };
    }

    if (error.serverCode === "USER_PERSON_CAMP_MISMATCH") {
      return {
        message: "La persona seleccionada pertenece a otro campamento.",
        tab: "info",
      };
    }

    if (error.serverCode === "USER_USERNAME_ALREADY_EXISTS") {
      return {
        message: "Ese nombre de usuario ya esta en uso.",
        tab: "info",
      };
    }

    if (error.serverCode === "USER_EMAIL_ALREADY_EXISTS") {
      return {
        message: "Ese email ya esta en uso.",
        tab: "info",
      };
    }
  }

  return {
    message: "No se pudo guardar el usuario. Revisa los campos.",
    tab: "info",
  };
}

export default function UserForm({
  initialData,
  catalogs,
  onSubmit,
  onClose,
}: UserFormProps) {
  const isEditing = !!initialData;

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState(initialData?.username ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [campId, setCampId] = useState<number | null>(
    initialData?.camp?.id ?? null,
  );
  const [assignedCampIds, setAssignedCampIds] = useState<number[]>(() => {
    const assigned = initialData?.assignedCamps.map((camp) => camp.id) ?? [];
    return assigned.length > 0
      ? assigned
      : initialData?.camp?.id
        ? [initialData.camp.id]
        : [];
  });
  const [roleId, setRoleId] = useState<number | null>(
    initialData?.role?.id ?? null,
  );
  const [personId, setPersonId] = useState<number | null>(
    initialData?.person?.id ?? null,
  );

  const selectedRole = catalogs.roles.find((role) => role.id === roleId);
  const selectedRoleIsSuperAdmin = selectedRole
    ? isSuperAdmin(selectedRole.name)
    : false;

  const campItems: CatalogItem[] = catalogs.camps.map((camp) => ({
    id: camp.id,
    label: camp.name,
    sublabel: camp.location,
    meta: (
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "1px 7px",
          borderRadius: 20,
          background:
            camp.status === "active"
              ? "var(--accent-bg)"
              : "rgba(16,18,13,0.4)",
          color: camp.status === "active" ? "var(--moss-bright)" : "var(--ash)",
        }}
      >
        {camp.status === "active" ? "Activo" : "Inactivo"}
      </span>
    ),
  }));

  const roleItems: CatalogItem[] = catalogs.roles.map((role) => ({
    id: role.id,
    label: getRoleDisplayName(role.name),
    sublabel: getRoleDescription(role),
    meta: (
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "1px 7px",
          borderRadius: 20,
          background: role.isSystemRole
            ? "var(--accent-bg)"
            : "rgba(16,18,13,0.4)",
          color: role.isSystemRole ? "#58683a" : "var(--ash)",
        }}
      >
        {role.isSystemRole ? "Sistema" : "Personalizado"}
      </span>
    ),
  }));

  const personItems: CatalogItem[] = catalogs.persons.map((person) => ({
    id: person.id,
    label: person.fullName,
    sublabel: `${person.campName}${
      person.documentNumber ? ` - Doc: ${person.documentNumber}` : ""
    } - ${person.linkedUsersCount} vinculado(s)`,
  }));

  const handlePrimaryCampChange = (item: CatalogItem) => {
    setCampId(item.id);
    setAssignedCampIds((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id],
    );
  };

  const handleAssignedCampToggle = (nextCampId: number) => {
    if (selectedRoleIsSuperAdmin) return;

    setAssignedCampIds((prev) => {
      if (prev.includes(nextCampId)) {
        if (nextCampId === campId) return prev;
        return prev.filter((id) => id !== nextCampId);
      }

      return [...prev, nextCampId];
    });
  };

  const handleRoleChange = (item: CatalogItem) => {
    const nextRole = catalogs.roles.find((role) => role.id === item.id);
    const allCampIds = catalogs.camps.map((camp) => camp.id);

    setRoleId(item.id);

    if (nextRole && isSuperAdmin(nextRole.name)) {
      setAssignedCampIds(allCampIds);
      setCampId((currentCampId) => currentCampId ?? allCampIds[0] ?? null);
      return;
    }

    if (selectedRoleIsSuperAdmin) {
      setAssignedCampIds(campId ? [campId] : []);
    }
  };

  const failValidation = (message: string, tab: Tab = "info") => {
    setActiveTab(tab);
    setError(message);
  };

  const handleSubmit = async () => {
    setError("");

    if (!username.trim()) {
      return failValidation("El nombre de usuario es obligatorio.");
    }

    if (!USERNAME_PATTERN.test(username.trim())) {
      return failValidation(
        "El nombre de usuario solo puede usar letras, numeros, puntos, guiones y guiones bajos.",
      );
    }

    if (!roleId) return failValidation("Selecciona un rol.");
    if (!campId) return failValidation("Selecciona un campamento principal.");

    if (!isEditing && !password.trim()) {
      return failValidation(
        "La contrasena es obligatoria al crear un usuario.",
        "password",
      );
    }

    if (password.trim()) {
      if (password.length < 8) {
        return failValidation(
          "La contrasena debe tener al menos 8 caracteres.",
          "password",
        );
      }

      if (!/[a-z]/.test(password)) {
        return failValidation(
          "La contrasena debe incluir al menos una letra minuscula.",
          "password",
        );
      }

      if (!/[A-Z]/.test(password)) {
        return failValidation(
          "La contrasena debe incluir al menos una letra mayuscula.",
          "password",
        );
      }

      if (!/[0-9]/.test(password)) {
        return failValidation(
          "La contrasena debe incluir al menos un numero.",
          "password",
        );
      }
    }

    const campIds = selectedRoleIsSuperAdmin
      ? catalogs.camps.map((camp) => camp.id)
      : Array.from(new Set([campId, ...assignedCampIds]));
    const payload: UserWriteInput = {
      usr_username: username.trim(),
      usr_email: email.trim() || null,
      id_camp: campId,
      campIds,
      id_role: roleId,
      id_person: personId ?? null,
      usr_is_active: isActive,
      ...(password.trim() ? { usr_password: password.trim() } : {}),
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success("Usuario creado/actualizado con exito");
      onClose();
    } catch (submitError) {
      const formError = extractUserFormError(submitError);
      setActiveTab(formError.tab);
      setError(formError.message);
      toast.error(formError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.title}>
            {isEditing ? "Editar usuario" : "Nuevo usuario"}
            {isEditing && (
              <span className={styles.subtitle}>- {initialData.username}</span>
            )}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            x
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Informacion
          </button>
          <button
            className={`${styles.tab} ${activeTab === "password" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("password")}
          >
            Contrasena{" "}
            {!isEditing && <span style={{ color: "#e6b89c" }}>*</span>}
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
                    onChange={(event) => setUsername(event.target.value)}
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
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuario@correo.com"
                  />
                </div>
              </div>

              <p className={styles.sectionTitle}>Asociaciones</p>
              <div className={styles.formRow}>
                <div>
                  <label className={styles.label}>Campamento principal</label>
                  <CatalogSelect
                    placeholder="Seleccionar..."
                    sectionTitle="campamentos"
                    items={campItems}
                    selectedId={campId}
                    onChange={handlePrimaryCampChange}
                  />
                </div>
                <div>
                  <label className={styles.label}>Rol</label>
                  <CatalogSelect
                    placeholder="Seleccionar..."
                    sectionTitle="roles"
                    items={roleItems}
                    selectedId={roleId}
                    onChange={handleRoleChange}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Campamentos asignados</label>
                <div className={styles.campAssignmentList}>
                  {catalogs.camps.map((camp) => {
                    const checked =
                      selectedRoleIsSuperAdmin ||
                      assignedCampIds.includes(camp.id);
                    const isPrimary = camp.id === campId;

                    return (
                      <label key={camp.id} className={styles.campAssignment}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={selectedRoleIsSuperAdmin || isPrimary}
                          onChange={() => handleAssignedCampToggle(camp.id)}
                        />
                        <span>{camp.name}</span>
                        {isPrimary && (
                          <strong className={styles.primaryCamp}>
                            Principal
                          </strong>
                        )}
                      </label>
                    );
                  })}
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
                  onChange={(item) => setPersonId(item.id)}
                />
              </div>

              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>Usuario activo</span>
                <button
                  type="button"
                  className={`${styles.toggle} ${isActive ? styles.toggleOn : ""}`}
                  onClick={() => setIsActive((prev) => !prev)}
                >
                  <span
                    className={`${styles.toggleDot} ${isActive ? styles.toggleDotOn : ""}`}
                  />
                </button>
              </div>
            </>
          )}

          {activeTab === "password" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {isEditing ? "Nueva contrasena" : "Contrasena"}
                  {!isEditing && (
                    <span style={{ color: "#e6b89c", marginLeft: 4 }}>*</span>
                  )}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className={styles.showPasswordBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {isEditing && (
                  <p className={styles.hint}>
                    Deja el campo vacio si no deseas cambiar la contrasena.
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}
