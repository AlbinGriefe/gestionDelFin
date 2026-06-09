import type {
    DailyAssignment,
    DailyAssignmentsInput,
    RunDailyProcessInput,
    DailyProcessRunResult,
    DailyProcessStatus,
} from "../types/daily-processes.types";
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

async function getAssignments(campId: number, date: string) {
    const params = new URLSearchParams({ campId: String(campId), date });
    return httpClient<DailyAssignment[]>(`/daily-processes/assignments?${params.toString()}`);
}

async function updateAssignments(data: DailyAssignmentsInput) {
    return httpClient<DailyAssignment[]>("/daily-processes/assignments", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export const dailyProcessesApi = {

    runDailyProcesses,
    getDailyProcessesStatus,
    getAssignments,
    updateAssignments,
}
