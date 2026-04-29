import { useContext } from "react";
import { ProfessionsContext } from "./professions.context";

export function useProfessions() {
    const context = useContext(ProfessionsContext);
    if (!context) throw new Error("useProfessions debe usarse dentro de ProfessionsProvider");
    return context;
}