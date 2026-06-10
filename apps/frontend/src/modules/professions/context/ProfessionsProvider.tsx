import { useState, useCallback, useEffect } from "react";
import { ProfessionsContext } from "./professions.context";
import { professionsApi } from "../api/profession.api";

import type {
  ProfessionSummary,
  ProfessionList,
  ProfessionListFilters,
  ProfessionWriteInput,
  ProfessionCoverageResult,
  TemporaryReassignmentInput,
  ReassignmentResult,
  RevertReassignmentInput,
} from "../types/professions.types";

export function ProfessionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [professions, setProfessions] = useState<ProfessionSummary[]>([]);
  const [pagination, setPagination] = useState<
    ProfessionList["pagination"] | null
  >(null);
  const [appliedFilters, setAppliedFilters] = useState<
    ProfessionList["appliedFilters"] | null
  >(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<ProfessionListFilters>({
    page: 1,
    pageSize: 20,
  });

  const loadProfessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professionsApi.listProfessions(filters);
      setProfessions(data.items);
      setPagination(data.pagination);
      setAppliedFilters(data.appliedFilters);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getProfessionById = async (
    professionId: number,
  ): Promise<ProfessionSummary> => {
    return professionsApi.getProfessionById(professionId);
  };

  const createProfession = async (
    data: ProfessionWriteInput,
  ): Promise<ProfessionSummary> => {
    const created = await professionsApi.createProfession(data);
    await loadProfessions();
    return created;
  };

  const updateProfession = async (
    professionId: number,
    data: ProfessionWriteInput,
  ): Promise<ProfessionSummary> => {
    const updated = await professionsApi.updateProfession(professionId, data);
    await loadProfessions();
    return updated;
  };

  const getProfessionCoverage = async (
    campId: number,
  ): Promise<ProfessionCoverageResult> => {
    return professionsApi.getProfessionCoverage(campId);
  };

  const createTemporaryReassignment = async (
    data: TemporaryReassignmentInput,
  ): Promise<ReassignmentResult> => {
    return professionsApi.createTemporaryReassignment(data);
  };

  const revertTemporaryReassignment = async (
    data: RevertReassignmentInput,
  ): Promise<ReassignmentResult> => {
    return professionsApi.revertTemporaryReassignment(data);
  };

  useEffect(() => {
    loadProfessions();
  }, [loadProfessions]);

  return (
    <ProfessionsContext.Provider
      value={{
        professions,
        pagination,
        loading,
        filters,
        appliedFilters,
        setFilters,
        loadProfessions,
        getProfessionById,
        createProfession,
        updateProfession,
        getProfessionCoverage,
        createTemporaryReassignment,
        revertTemporaryReassignment,
      }}
    >
      {children}
    </ProfessionsContext.Provider>
  );
}
