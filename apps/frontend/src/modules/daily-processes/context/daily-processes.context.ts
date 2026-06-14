import { createContext } from "react";
import type {
  RunDailyProcessInput,
  DailyProcessRunResult,
  DailyProcessStatus,
} from "../types/daily-processes.types";

export interface DailyProcessesContextType {
  loading: boolean;
  runDailyProcesses: (
    data: RunDailyProcessInput,
  ) => Promise<DailyProcessRunResult>;
  getDailyProcessesStatus: (campId: number) => Promise<DailyProcessStatus>;
}

export const DailyProcessesContext =
  createContext<DailyProcessesContextType | null>(null);
