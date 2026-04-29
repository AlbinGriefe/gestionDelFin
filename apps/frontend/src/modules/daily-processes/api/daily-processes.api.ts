import type { RunDailyProcessInput, DailyProcessRunResult, DailyProcessStatus } from "../types/daily-processes.types";
import { httpClient } from "../../../shared/api/httpClient";

async function runDailyProcesses(data: RunDailyProcessInput) {
    return httpClient<DailyProcessRunResult>("/daily-processes/run", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

async function getDailyProcessesStatus(campId: number) {
    return httpClient<DailyProcessStatus>(`/daily-processes/status/${campId}`)
}

export const dailyProcessesApi = {

    runDailyProcesses,
    getDailyProcessesStatus,
}