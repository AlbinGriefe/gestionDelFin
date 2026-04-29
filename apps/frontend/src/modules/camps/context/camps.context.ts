import { createContext } from "react";
import type { CampListFilters, CampWriteInput, CampDetail, CampList, CampSummary } from "../types/camps.types"

export interface CampsContextType {
    camps: CampSummary[];
    pagination: CampList["pagination"] | null;
    loading: boolean;
    filters: CampListFilters;
    appliedFilters: CampList["appliedFilters"] | null;
    setFilters: (filters: CampListFilters) => void;
    loadCamps: () => Promise<void>;
    getCampById: (campId: number) => Promise<CampDetail>;
    createCamp: (data: CampWriteInput) => Promise<CampDetail>;
    updateCamp: (campId: number, data: CampWriteInput) => Promise<CampDetail>;
}

export const CampsContext = createContext<CampsContextType | null>(null);