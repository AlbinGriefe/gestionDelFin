import { createContext } from "react";

import type {
  ProfessionListFilters,
  ProfessionWriteInput,
  ProfessionList,
  ProfessionSummary,
  ProfessionCoverageResult,
  TemporaryReassignmentInput,
  ReassignmentResult,
  RevertReassignmentInput,
} from "../types/professions.types";

export interface ProfessionsContextType {
  professions: ProfessionSummary[];
  pagination: ProfessionList["pagination"] | null;
  loading: boolean;
  filters: ProfessionListFilters;
  appliedFilters: ProfessionList["appliedFilters"] | null;
  setFilters: (filters: ProfessionListFilters) => void;
  loadProfessions: () => Promise<void>;
  getProfessionById: (professionId: number) => Promise<ProfessionSummary>;
  createProfession: (data: ProfessionWriteInput) => Promise<ProfessionSummary>;
  updateProfession: (
    professionId: number,
    data: ProfessionWriteInput,
  ) => Promise<ProfessionSummary>;
  getProfessionCoverage: (campId: number) => Promise<ProfessionCoverageResult>;
  createTemporaryReassignment: (
    data: TemporaryReassignmentInput,
  ) => Promise<ReassignmentResult>;
  revertTemporaryReassignment: (
    data: RevertReassignmentInput,
  ) => Promise<ReassignmentResult>;
}

export const ProfessionsContext = createContext<ProfessionsContextType | null>(
  null,
);
