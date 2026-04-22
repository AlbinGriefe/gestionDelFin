import { useState } from "react";
import styles from "./SearchById.module.css";

interface SearchByIdProps<T> {
    label?: string;
    placeholder?: string;
    onSearch: (id: number) => Promise<T>;
    children: (result: T) => React.ReactNode;
}

export default function SearchById<T>({
    label = "Buscar por ID",
    placeholder = "ej. 1",
    onSearch,
    children,
}: SearchByIdProps<T>) {
    const [inputId, setInputId] = useState("");
    const [result, setResult] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        const id = parseInt(inputId);
        if (!inputId || isNaN(id) || id <= 0) {
            setError("Ingresa un ID válido.");
            return;
        }

        setError("");
        setResult(null);

        try {
            setLoading(true);
            const data = await onSearch(id);
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "No se encontró el registro.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBar}>
                <span className={styles.label}>{label}</span>
                <input
                    className={styles.input}
                    type="number"
                    min={1}
                    placeholder={placeholder}
                    value={inputId}
                    onChange={e => setInputId(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className={styles.btn}
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {!result && !error && (
                <p className={styles.placeholder}>
                    Ingresa un ID para ver el detalle.
                </p>
            )}

            {result && children(result)}
        </div>
    );
}