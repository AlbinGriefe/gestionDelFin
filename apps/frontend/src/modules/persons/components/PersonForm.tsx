import { useState } from "react";
import type { PersonSummary, PersonWriteInput } from "../types/persons.types";
import { usePersons } from "../context/usePersons";
import styles from "./PersonForm.module.css";
import { toast } from "sonner";

interface PersonFormProps {
    initialData?: PersonSummary | null;
    onSubmit: (data: PersonWriteInput) => Promise<void>;
    onClose: () => void;
}

export default function PersonForm({ initialData, onSubmit, onClose }: PersonFormProps) {
    const isEditing = !!initialData;
    const { catalogs } = usePersons();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState(initialData?.fullName.split(" ")[0] ?? "");
    const [lastname, setLastname] = useState(initialData?.fullName.split(" ").slice(1).join(" ") ?? "");
    const [document, setDocument] = useState(initialData?.documentNumber ?? "");
    const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "");
    const [professionId, setProfessionId] = useState(initialData?.profession.id?.toString() ?? "");
    const [healthId, setHealthId] = useState(initialData?.healthStatus?.id?.toString() ?? "");
    const [campId, setCampId] = useState(initialData?.camp.id?.toString() ?? "");
    const [isAccepted, setIsAccepted] = useState(initialData?.isAccepted ?? false);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [notes, setNotes] = useState(initialData?.admissionNotes ?? "");

    const handleSubmit = async () => {
        setError("");

        if (!name.trim()) return setError("El nombre es obligatorio.");
        if (!lastname.trim()) return setError("El apellido es obligatorio.");
        if (!professionId) return setError("La profesión es obligatoria.");

        const payload: PersonWriteInput = {
            prn_name: name.trim(),
            prn_lastname: lastname.trim(),
            prn_document_number: document.trim() || null,
            prn_birth_date: birthDate ? new Date(birthDate) : null,
            id_profession: Number(professionId),
            id_person_health: healthId ? Number(healthId) : null,
            id_camp: campId ? Number(campId) : undefined,
            prn_is_accepted: isAccepted,
            prn_is_active: isActive,
            prn_admission_notes: notes.trim() || null,
        };

        try {
            setLoading(true);
            await onSubmit(payload);
            toast.success(isEditing ? "Persona actualizada" : "Persona registrada");
            onClose();
        } catch {
            setError("Ocurrió un error. Revisa los datos e intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <span className={styles.title}>
                        {isEditing ? "Editar persona" : "Registrar persona"}
                        {isEditing && <span className={styles.subtitle}>· {initialData.fullName}</span>}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    <p className={styles.sectionTitle}>Datos personales</p>

                    <div className={styles.formRow}>
                        <div>
                            <label className={styles.label}>Nombre</label>
                            <input
                                className={styles.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="ej. Carlos"
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Apellido</label>
                            <input
                                className={styles.input}
                                value={lastname}
                                onChange={e => setLastname(e.target.value)}
                                placeholder="ej. Ramírez"
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
                                onChange={e => setDocument(e.target.value)}
                                placeholder="ej. 1-1234-5678"
                            />
                        </div>
                        <div>
                            <label className={styles.label}>
                                Fecha de nacimiento <span className={styles.optional}>(opcional)</span>
                            </label>
                            <input
                                className={styles.input}
                                type="date"
                                value={birthDate}
                                onChange={e => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <p className={styles.sectionTitle} style={{ marginTop: 16 }}>Asignación</p>

                    <div className={styles.formRow}>
                        <div>
                            <label className={styles.label}>Campamento</label>
                            <select
                                className={styles.input}
                                value={campId}
                                onChange={e => setCampId(e.target.value)}
                            >
                                <option value="">Campamento del usuario</option>
                                {catalogs?.camps.filter(c => c.status === "active").map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>Profesión</label>
                            <select
                                className={styles.input}
                                value={professionId}
                                onChange={e => setProfessionId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {catalogs?.professions.filter(p => p.isActive).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <label className={styles.label}>
                                Estado de salud <span className={styles.optional}>(opcional)</span>
                            </label>
                            <select
                                className={styles.input}
                                value={healthId}
                                onChange={e => setHealthId(e.target.value)}
                            >
                                <option value="">Sin asignar</option>
                                {catalogs?.healthStatuses.filter(h => h.isActiveStatus).map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>
                                Notas de admisión <span className={styles.optional}>(opcional)</span>
                            </label>
                            <input
                                className={styles.input}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones..."
                            />
                        </div>
                    </div>

                    <div className={styles.checkRow}>
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                checked={isAccepted}
                                onChange={e => setIsAccepted(e.target.checked)}
                            />
                            Aceptar ingreso al campamento
                        </label>
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                            Persona activa
                        </label>
                    </div>

                    {!isEditing && (
                        <div className={styles.aiPlaceholder}>
                            <div className={styles.aiHeader}>
                                <span className={styles.aiTitle}>Evaluación IA</span>
                                <span className={styles.aiTag}>Próximamente</span>
                            </div>
                            <p className={styles.aiDescription}>
                                Al registrar una persona, el sistema analizará automáticamente su perfil
                                con inteligencia artificial. La IA evaluará criterios de admisión y
                                generará un reporte con criterios claros y trazables para que el
                                administrador pueda aceptar o rechazar la recomendación.
                            </p>
                        </div>
                    )}

                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Registrar persona"}
                    </button>
                </div>

            </div>
        </div>
    );
}
