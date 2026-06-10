import { useState } from "react";
import { toast } from "sonner";
import { usePersons } from "../context/usePersons";
import type { PersonSummary, PersonWriteInput } from "../types/persons.types";
import styles from "./PersonForm.module.css";

interface PersonFormProps {
  initialData?: PersonSummary | null;
  onSubmit: (data: PersonWriteInput) => Promise<void>;
  onClose: () => void;
}

export default function PersonForm({
  initialData,
  onSubmit,
  onClose,
}: PersonFormProps) {
  const isEditing = Boolean(initialData);
  const { catalogs } = usePersons();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initialData?.fullName.split(" ")[0] ?? "");
  const [lastname, setLastname] = useState(
    initialData?.fullName.split(" ").slice(1).join(" ") ?? "",
  );
  const [document, setDocument] = useState(initialData?.documentNumber ?? "");
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "");
  const [profileDescription, setProfileDescription] = useState(
    initialData?.profileDescription ?? "",
  );
  const [healthId, setHealthId] = useState(
    initialData?.healthStatus?.id?.toString() ?? "",
  );
  const [campId, setCampId] = useState(initialData?.camp.id?.toString() ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [notes, setNotes] = useState(initialData?.admissionNotes ?? "");

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (!lastname.trim()) return setError("El apellido es obligatorio.");
    if (profileDescription.trim() && profileDescription.trim().length < 20) {
      return setError(
        "La descripcion del perfil debe tener al menos 20 caracteres.",
      );
    }

    const payload: PersonWriteInput = {
      prn_name: name.trim(),
      prn_lastname: lastname.trim(),
      prn_document_number: document.trim() || null,
      prn_birth_date: birthDate ? new Date(`${birthDate}T00:00:00`) : null,
      prn_profile_description: profileDescription.trim() || null,
      id_person_health: healthId ? Number(healthId) : null,
      id_camp: campId ? Number(campId) : undefined,
      prn_is_active: isActive,
      prn_admission_notes: notes.trim() || null,
    };

    try {
      setLoading(true);
      await onSubmit(payload);
      toast.success(isEditing ? "Persona actualizada" : "Persona registrada");
      onClose();
    } catch {
      setError("Ocurrio un error. Revisa los datos e intenta de nuevo.");
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
            {isEditing ? "Editar persona" : "Registrar persona"}
            {isEditing && (
              <span className={styles.subtitle}>
                {" "}
                - {initialData?.fullName}
              </span>
            )}
          </span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            X
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.sectionTitle}>Datos personales</p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ej. Carlos"
              />
            </div>
            <div>
              <label className={styles.label}>Apellido</label>
              <input
                className={styles.input}
                value={lastname}
                onChange={(event) => setLastname(event.target.value)}
                placeholder="ej. Ramirez"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>
                Documento <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                value={document}
                onChange={(event) => setDocument(event.target.value)}
                placeholder="ej. 1-1234-5678"
              />
            </div>
            <div>
              <label className={styles.label}>
                Fecha de nacimiento{" "}
                <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </div>
          </div>

          <p className={styles.sectionTitle} style={{ marginTop: 16 }}>
            Perfil y ubicacion
          </p>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>Campamento</label>
              <select
                className={styles.input}
                value={campId}
                onChange={(event) => setCampId(event.target.value)}
              >
                <option value="">Campamento del usuario</option>
                {catalogs?.camps
                  .filter((camp) => camp.status === "active")
                  .map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>
                Estado de salud{" "}
                <span className={styles.optional}>(opcional)</span>
              </label>
              <select
                className={styles.input}
                value={healthId}
                onChange={(event) => setHealthId(event.target.value)}
              >
                <option value="">Sin asignar</option>
                {catalogs?.healthStatuses
                  .filter((status) => status.isActiveStatus)
                  .map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              Descripcion del perfil{" "}
              <span className={styles.optional}>
                (opcional; se genera una si se deja vacia)
              </span>
            </label>
            <textarea
              className={styles.input}
              rows={4}
              value={profileDescription}
              onChange={(event) => setProfileDescription(event.target.value)}
              placeholder="Experiencia, habilidades, comportamiento y conocimientos..."
            />
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label}>
                Notas de admision{" "}
                <span className={styles.optional}>(opcional)</span>
              </label>
              <input
                className={styles.input}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones..."
              />
            </div>
          </div>

          <div className={styles.checkRow}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Persona activa
            </label>
          </div>

          {!isEditing && (
            <div className={styles.aiPlaceholder}>
              <div className={styles.aiHeader}>
                <span className={styles.aiTitle}>Flujo de admision e IA</span>
                <span className={styles.aiTag}>Posterior al registro</span>
              </div>
              <p className={styles.aiDescription}>
                La persona se registra como pendiente y sin oficio. La
                evaluacion textual de admision y la recomendacion de oficio se
                confirman por separado para conservar la decision humana.
              </p>
            </div>
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
                : "Registrar persona"}
          </button>
        </div>
      </div>
    </div>
  );
}
