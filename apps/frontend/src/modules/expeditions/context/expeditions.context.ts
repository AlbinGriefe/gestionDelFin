import { createContext } from "react";

import type {
  ExpeditionListFilters,
  ExpeditionCatalogFilters,
  ExpeditionCreateInput,
  ExpeditionStateUpdateInput,
  ExpeditionCatalogs,
  ExpeditionDetail,
  ExpeditionsList,
  ExpeditionSummary,
} from "../types/expeditions.types";

export interface ExpeditionsContextType {
  expeditions: ExpeditionSummary[];
  pagination: ExpeditionsList["pagination"] | null;
  expeditionsFilters: ExpeditionListFilters;
  appliedExpeditionsFilters: ExpeditionsList["appliedFilters"] | null;
  catalogsFilters: ExpeditionCatalogFilters;
  catalogs: ExpeditionCatalogs | null;
  loading: boolean;
  setExpeditionsFilters: (filters: ExpeditionListFilters) => void;
  setCatalogsFilters: (filters: ExpeditionCatalogFilters) => void;
  loadExpeditions: () => Promise<void>;
  loadCatalogs: () => Promise<void>;
  getExpeditionById: (expeditionId: number) => Promise<ExpeditionDetail>;
  createExpedition: (data: ExpeditionCreateInput) => Promise<ExpeditionDetail>;
  updateExpeditionState: (
    expeditionId: number,
    data: ExpeditionStateUpdateInput,
  ) => Promise<ExpeditionDetail>;
}

export const ExpeditionsContext = createContext<ExpeditionsContextType | null>(
  null,
);
