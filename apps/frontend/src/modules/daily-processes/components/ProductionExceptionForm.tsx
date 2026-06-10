import { useState, useEffect } from "react";
import { toast } from "sonner";
import { personsApi } from "../../persons/api/person.api";
import { professionsApi } from "../../professions/api/profession.api";
import { useInventory } from "../../inventory/context/useInventory";
import { useAuth } from "../../auth/context/useAuth";
import type { PersonSummary } from "../../persons/types/persons.types";
import type { ProfessionSummary } from "../../professions/types/professions.types";
import styles from "./ProductionExceptionForm.module.css";

interface ProductionExceptionFormProps {
    onClose: () => void;
}

function findResourceId(
    name: string,
    resources: { id: number; name: string; isRationable: boolean }[]
): number | null {
    const needle = name.toLowerCase();
    const match = resources
        .filter(r => r.isRationable)
        .find(r => r.name.toLowerCase().includes(needle));
    return match?.id ?? null;
}

export default function ProductionExceptionForm({ onClose }: ProductionExceptionFormProps) {
    const { user } = useAuth();
    const { catalogs, inventoryAdjustments } = useInventory();

    const [persons, setPersons] = useState<PersonSummary[]>([]);
    const [professions, setProfessions] = useState<ProfessionSummary[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedPersonId, setSelectedPersonId] = useState("");
    const [actualFood, setActualFood] = useState("");
    const [actualWater, setActualWater] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        Promise.all([
            personsApi.listPersons({ page: 1, pageSize: 100, active: true, accepted: true }),
            professionsApi.listProfessions({ page: 1, pageSize: 100, active: true, campId: user.campId }),
        ]).then(([personsData, profData]) => {
            setPersons(personsData.items);
            setProfessions(profData.items);
        }).catch(() => {
            toast.error("Error cargando datos");
        }).finally(() => setLoadingData(false));
    }, [user]);

    const selectedPerson = persons.find(p => p.id === Number(selectedPersonId)) ?? null;
    const profession = selectedPerson?.profession
        ? professions.find(p => p.id === selectedPerson.profession?.id) ?? null
        : null;

    const expectedFood = profession?.foodGeneratedPerDay ?? 0;
    const expectedWater = profession?.waterGeneratedPerDay ?? 0;

    useEffect(() => {
        if (profession) {
            setActualFood(String(profession.foodGeneratedPerDay));
            setActualWater(String(profession.waterGeneratedPerDay));
        }
    }, [profession]);

    const handleSubmit = async () => {
        setError("");
        if (!selectedPersonId) return setError("Selecciona una persona.");

        const realFood = parseFloat(actualFood);
        const realWater = parseFloat(actualWater);
        if (isNaN(realFood) || realFood < 0) return setError("El valor de alimento debe ser ≥ 0.");
        if (isNaN(realWater) || realWater < 0) return setError("El valor de agua debe ser ≥ 0.");

        const foodDeficit = expectedFood - realFood;
        const waterDeficit = expectedWater - realWater;

        if (foodDeficit <= 0 && waterDeficit <= 0) {
            toast.info("No hay déficit que registrar.");
            onClose();
            return;
        }

        const foodResourceId = findResourceId("comida", catalogs?.resources ?? [])
            ?? findResourceId("aliment", catalogs?.resources ?? []);
        const waterResourceId = findResourceId("agua", catalogs?.resources ?? []);

        const personName = selectedPerson?.fullName ?? `Persona #${selectedPersonId}`;
        const reasonBase = `Excepción de producción — ${personName}`;

        try {
            setLoading(true);
            const tasks: Promise<unknown>[] = [];

            if (foodDeficit > 0 && foodResourceId !== null) {
                tasks.push(inventoryAdjustments({
                    id_resource: foodResourceId,
                    mode: "delta",
                    quantity: -foodDeficit,
                    reason: `${reasonBase} (esperado: ${expectedFood}, real: ${realFood})`,
                }));
            }

            if (waterDeficit > 0 && waterResourceId !== null) {
                tasks.push(inventoryAdjustments({
                    id_resource: waterResourceId,
                    mode: "delta",
                    quantity: -waterDeficit,
                    reason: `${reasonBase} (esperado: ${expectedWater}, real: ${realWater})`,
                }));
            }

            if (tasks.length === 0) {
                toast.warning("No se encontraron los recursos de comida/agua en el inventario.");
                onClose();
                return;
            }

            await Promise.all(tasks);
            toast.success("Excepción de producción registrada");
            onClose();
        } catch {
            setError("No se pudo registrar la excepción. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>Registrar excepción de producción</span>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.body}>
                    <p className={styles.description}>
                        Usarlo cuando una persona no pueda cumplir con su producción diaria
                        esperada. Se aplicará un ajuste negativo al inventario por la diferencia.
                    </p>

                    {loadingData ? (
                        <p className={styles.loading}>Cargando personas...</p>
                    ) : (
                        <>
                            <div className={styles.field}>
                                <label className={styles.label}>Persona</label>
                                <select
                                    className={styles.input}
                                    value={selectedPersonId}
                                    onChange={e => setSelectedPersonId(e.target.value)}
                                >
                                    <option value="">Seleccionar persona...</option>
                                    {persons.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.fullName} - {p.profession?.name ?? "Sin oficio"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {profession && (
                                <div className={styles.professionCard}>
                                    <p className={styles.professionTitle}>
                                        Producción esperada hoy · {profession.name}
                                    </p>
                                    <div className={styles.professionStats}>
                                        {expectedFood > 0 && (
                                            <div className={styles.stat}>
                                                <span className={styles.statValue}>{expectedFood}</span>
                                                <span className={styles.statLabel}>uds. de alimento</span>
                                            </div>
                                        )}
                                        {expectedWater > 0 && (
                                            <div className={styles.stat}>
                                                <span className={styles.statValue}>{expectedWater}</span>
                                                <span className={styles.statLabel}>uds. de agua</span>
                                            </div>
                                        )}
                                        {expectedFood === 0 && expectedWater === 0 && (
                                            <span className={styles.noProduction}>
                                                Esta profesión no genera alimento ni agua.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {profession && (expectedFood > 0 || expectedWater > 0) && (
                                <>
                                    <p className={styles.sectionTitle}>Producción real del día</p>
                                    <div className={styles.formRow}>
                                        {expectedFood > 0 && (
                                            <div>
                                                <label className={styles.label}>
                                                    Alimento producido
                                                    <span className={styles.hint}> (esperado: {expectedFood})</span>
                                                </label>
                                                <input
                                                    className={styles.input}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={expectedFood}
                                                    value={actualFood}
                                                    onChange={e => setActualFood(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        {expectedWater > 0 && (
                                            <div>
                                                <label className={styles.label}>
                                                    Agua producida
                                                    <span className={styles.hint}> (esperado: {expectedWater})</span>
                                                </label>
                                                <input
                                                    className={styles.input}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={expectedWater}
                                                    value={actualWater}
                                                    onChange={e => setActualWater(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {(parseFloat(actualFood) < expectedFood || parseFloat(actualWater) < expectedWater) && (
                                        <div className={styles.deficitSummary}>
                                            <span className={styles.deficitLabel}>Corrección a aplicar:</span>
                                            <div className={styles.deficitItems}>
                                                {expectedFood > 0 && parseFloat(actualFood) < expectedFood && (
                                                    <span className={styles.deficitItem}>
                                                        −{(expectedFood - parseFloat(actualFood || "0")).toFixed(2)} alimento
                                                    </span>
                                                )}
                                                {expectedWater > 0 && parseFloat(actualWater) < expectedWater && (
                                                    <span className={styles.deficitItem}>
                                                        −{(expectedWater - parseFloat(actualWater || "0")).toFixed(2)} agua
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleSubmit}
                        disabled={loading || loadingData || !selectedPersonId}
                    >
                        {loading ? "Registrando..." : "Registrar excepción"}
                    </button>
                </div>
            </div>
        </div>
    );
}
