import { useState, useCallback, useEffect } from "react";
import { CampsContext } from "./camps.context";
import { campsApi } from "../api/camp.api";
import type {
    CampSummary,
    CampList,
    CampListFilters,
    CampWriteInput,
    CampDetail,
} from "../types/camps.types";

export function CampsProvider({ children }: { children: React.ReactNode }) {
    const [camps, setCamps] = useState<CampSummary[]>([]);
    const [pagination, setPagination] = useState<CampList["pagination"] | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<CampList["appliedFilters"] | null>(null);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<CampListFilters>({
        page: 1,
        pageSize: 20,
    });

    const loadCamps = useCallback(async () => {
        setLoading(true);
        try {
            const data = await campsApi.listCamps(filters);
            setCamps(data.items);
            setPagination(data.pagination);
            setAppliedFilters(data.appliedFilters);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const getCampById = async (campId: number): Promise<CampDetail> => {
        return campsApi.getCampById(campId);
    };

    const createCamp = async (data: CampWriteInput): Promise<CampDetail> => {
        const created = await campsApi.createCamp(data);
        await loadCamps();
        return created;
    };

    const updateCamp = async (campId: number, data: CampWriteInput): Promise<CampDetail> => {
        const updated = await campsApi.updateCamp(campId, data);
        await loadCamps();
        return updated;
    };

    useEffect(() => {
        loadCamps();
    }, [loadCamps]);

    return (
        <CampsContext.Provider
            value={{
                camps,
                pagination,
                loading,
                filters,
                appliedFilters,
                setFilters,
                loadCamps,
                getCampById,
                createCamp,
                updateCamp,
            }
            }
        >
            {children}
        </CampsContext.Provider>
    );
}