import { createContext } from "react";
import type {
  PersonListFilters,
  PersonWriteInput,
  PersonDetail,
  PersonList,
  PersonSummary,
  PersonsCatalogs,
} from "../types/persons.types";

export interface PersonsContextType {
  persons: PersonSummary[];
  pagination: PersonList["pagination"] | null;
  catalogs: PersonsCatalogs | null;
  loading: boolean;
  filters: PersonListFilters;
  appliedFilters: PersonList["appliedFilters"] | null;
  setFilters: (filters: PersonListFilters) => void;
  loadPersons: () => Promise<void>;
  getPersonById: (personId: number) => Promise<PersonDetail>;
  createPerson: (data: PersonWriteInput) => Promise<PersonDetail>;
  updatePerson: (
    personId: number,
    data: PersonWriteInput,
  ) => Promise<PersonDetail>;
  loadCatalogs: () => Promise<void>;
}

export const PersonsContext = createContext<PersonsContextType | null>(null);
