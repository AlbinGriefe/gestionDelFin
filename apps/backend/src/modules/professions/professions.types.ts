export interface ProfessionListFilters {
  page: number;
  pageSize: number;
  campId?: number;
  active?: boolean;
  collectsResources?: boolean;
  search?: string;
}

export interface ProfessionWriteInput {
  pfs_name?: string;
  pfs_description?: string;
  pfs_collects_resources?: boolean;
  pfs_food_generated_per_day?: number;
  pfs_water_generated_per_day?: number;
  id_camp?: number | null;
  pfs_is_active?: boolean;
}

export interface ProfessionSummary {
  id: number;
  name: string;
  description: string;
  collectsResources: boolean;
  foodGeneratedPerDay: number;
  waterGeneratedPerDay: number;
  campId: number | null;
  isActive: boolean;
}


export interface ProfessionCoverageEntry {
  profession: ProfessionSummary;
  totalPersons: number;
  activeWorkers: number;
  outOfCamp: number;
  temporarilyAssigned: number;
  needsCoverage: boolean;
}

export interface ProfessionCoverageResult {
  campId: number;
  campName: string;
  professions: ProfessionCoverageEntry[];
  totalNeedingCoverage: number;
}

export interface TemporaryReassignmentInput {
  targetProfessionId: number;
  personIds: number[];
  notes?: string;
}

export interface RevertReassignmentInput {
  personIds: number[];
  notes?: string;
}

export interface ReassignmentResultEntry {
  personId: number;
  fullName: string;
  previousProfessionId: number;
  previousProfessionName: string;
  newProfessionId: number;
  newProfessionName: string;
  isTemporary: boolean;
}

export interface ReassignmentResult {
  reassigned: ReassignmentResultEntry[];
  skipped: { personId: number; reason: string }[];
  warnings: string[];
}
