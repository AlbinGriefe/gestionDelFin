import { useContext } from "react";
import { ExpeditionsContext } from "./expeditions.context";

export function useExpeditions() {
    const context = useContext(ExpeditionsContext);
    if (!context) throw new Error("useExpeditions debe usarse dentro de ExpeditionsProvider");
    return context;
}