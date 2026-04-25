import { useState, useCallback, useEffect } from "react";
import { PersonsContext } from "./persons.context";
import { personsApi } from "../api/person.api";
import type {
    PersonSummary,
    PersonList,
    PersonListFilters,
    PersonWriteInput,
    PersonDetail,
    PersonsCatalogs,
} from "../types/persons.types";

export function PersonsProvider({ children }: { children: React.ReactNode }) {
    const [persons, setPersons] = useState<PersonSummary[]>([]);
    const [pagination, setPagination] = useState<PersonList["pagination"] | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<PersonList["appliedFilters"] | null>(null);
    const [catalogs, setCatalogs] = useState<PersonsCatalogs | null>(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<PersonListFilters>({
        page: 1,
        pageSize: 20,
    });

    const loadPersons = useCallback(async () => {
        setLoading(true);
        try {
            const data = await personsApi.listPersons(filters);
            setPersons(data.items);
            setPagination(data.pagination);
            setAppliedFilters(data.appliedFilters);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadCatalogs = useCallback(async () => {
        const data = await personsApi.loadCatalogs();
        setCatalogs(data);
    }, []);

    const getPersonById = async (personId: number): Promise<PersonDetail> => {
        return personsApi.getPersonById(personId);
    };

    const createPerson = async (data: PersonWriteInput): Promise<PersonDetail> => {
        const created = await personsApi.createPerson(data);
        await loadPersons();
        return created;
    };

    const updatePerson = async (personId: number, data: PersonWriteInput): Promise<PersonDetail> => {
        const updated = await personsApi.updatePerson(personId, data);
        await loadPersons();
        return updated;
    };

    useEffect(() => {
        loadPersons();
    }, [loadPersons]);

    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    return (
        <PersonsContext.Provider
            value={{
                persons,
                pagination,
                catalogs,
                loading,
                filters,
                appliedFilters,
                setFilters,
                loadPersons,
                getPersonById,
                createPerson,
                updatePerson,
                loadCatalogs,
            }
            }
        >
            {children}
        </PersonsContext.Provider>
    );
}