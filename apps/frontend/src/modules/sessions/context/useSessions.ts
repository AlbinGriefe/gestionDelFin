import { useContext } from "react";
import { SessionsContext } from "./sessions.context";

export function useSessions() {
    const context = useContext(SessionsContext);
    if (!context) throw new Error("useSessions debe usarse dentro de SessionsProvider");
    return context;
}