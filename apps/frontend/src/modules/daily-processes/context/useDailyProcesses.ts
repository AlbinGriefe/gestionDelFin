import { useContext } from "react";
import { DailyProcessesContext } from "./daily-processes.context";

export function useDailyProcesses() {
    const context = useContext(DailyProcessesContext);
    if (!context) throw new Error("useDailyProcesses debe usarse dentro de DailyProcessesProvider");
    return context;
}