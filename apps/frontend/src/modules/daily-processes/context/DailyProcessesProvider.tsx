import { useState } from "react";
import { DailyProcessesContext } from "./daily-processes.context";
import { dailyProcessesApi } from "../api/daily-processes.api";

import type {
    RunDailyProcessInput,
    DailyProcessRunResult,
    DailyProcessStatus,
} from "../types/daily-processes.types";

export function DailyProcessesProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);

    const runDailyProcesses = async (
        data: RunDailyProcessInput
    ): Promise<DailyProcessRunResult> => {
        setLoading(true);
        try {
            return await dailyProcessesApi.runDailyProcesses(data);
        } finally {
            setLoading(false);
        }
    };

    const getDailyProcessesStatus = async (
        campId: number
    ): Promise<DailyProcessStatus> => {
        setLoading(true);
        try {
            return await dailyProcessesApi.getDailyProcessesStatus(campId);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DailyProcessesContext.Provider
            value={{
                loading,
                runDailyProcesses,
                getDailyProcessesStatus,
            }}
        >
            {children}
        </DailyProcessesContext.Provider>
    );
}