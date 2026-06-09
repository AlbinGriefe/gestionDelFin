// ─── Result types ────────────────────────────────────────────────────────────

export interface DailyProductionResult {
  campId: number;
  campName: string;
  date: string;
  production: {
    personId: number;
    fullName: string;
    professionId: number;
    professionName: string;
    foodProduced: number;
    waterProduced: number;
    skipped: boolean;
    skipReason: string | null;
  }[];
  totals: {
    foodProduced: number;
    waterProduced: number;
    personsProcessed: number;
    personsSkipped: number;
  };
}

export interface DailyRationResult {
  campId: number;
  campName: string;
  date: string;
  rations: {
    resourceId: number;
    resourceName: string;
    rationPerPerson: number;
    totalConsumed: number;
    stockBefore: number;
    stockAfter: number;
    isBelowMinimum: boolean;
    shortfall: number;
  }[];
  totals: {
    resourcesProcessed: number;
    personsServed: number;
  };
}

export interface DailyProcessRunResult {
  campId: number;
  campName: string;
  runAt: string;
  alreadyRunToday: boolean;
  production: DailyProductionResult;
  rations: DailyRationResult;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface RunDailyProcessInput {
  campId?: number;
  force?: boolean;
}

export type DailyAssignmentTask =
  | "food_production"
  | "water_production"
  | "camp_support";

export interface DailyAssignmentsInput {
  campId: number;
  date: Date;
  assignments: Array<{
    personId: number;
    task: DailyAssignmentTask;
  }>;
}
