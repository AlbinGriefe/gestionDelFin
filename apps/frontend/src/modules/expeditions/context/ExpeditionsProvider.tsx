import { useState, useCallback, useEffect } from "react";
import { ExpeditionsContext } from "./expeditions.context";
import { expeditionApi } from "../api/expedition.api";

import type {
  ExpeditionSummary,
  ExpeditionsList,
  ExpeditionListFilters,
  ExpeditionCatalogFilters,
  ExpeditionCatalogs,
  ExpeditionDetail,
  ExpeditionCreateInput,
  ExpeditionStateUpdateInput,
} from "../types/expeditions.types";

export function ExpeditionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expeditions, setExpeditions] = useState<ExpeditionSummary[]>([]);
  const [pagination, setPagination] = useState<
    ExpeditionsList["pagination"] | null
  >(null);
  const [appliedExpeditionsFilters, setAppliedExpeditionsFilters] = useState<
    ExpeditionsList["appliedFilters"] | null
  >(null);
  const [catalogs, setCatalogs] = useState<ExpeditionCatalogs | null>(null);

  const [loading, setLoading] = useState(false);

  const [expeditionsFilters, setExpeditionsFilters] =
    useState<ExpeditionListFilters>({
      page: 1,
      pageSize: 20,
    });

  const [catalogsFilters, setCatalogsFilters] =
    useState<ExpeditionCatalogFilters>({});

  const loadExpeditions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expeditionApi.listExpeditions(expeditionsFilters);
      setExpeditions(data.items);
      setPagination(data.pagination);
      setAppliedExpeditionsFilters(data.appliedFilters);
    } finally {
      setLoading(false);
    }
  }, [expeditionsFilters]);

  const loadCatalogs = useCallback(async () => {
    const data = await expeditionApi.loadCatalogs(catalogsFilters);
    setCatalogs(data);
  }, [catalogsFilters]);

  const getExpeditionById = async (
    expeditionId: number,
  ): Promise<ExpeditionDetail> => {
    return expeditionApi.getExpeditionById(expeditionId);
  };

  const createExpedition = async (
    data: ExpeditionCreateInput,
  ): Promise<ExpeditionDetail> => {
    const created = await expeditionApi.createExpedition(data);
    await loadExpeditions();
    return created;
  };

  const updateExpeditionState = async (
    expeditionId: number,
    data: ExpeditionStateUpdateInput,
  ): Promise<ExpeditionDetail> => {
    const updated = await expeditionApi.updateExpeditionState(
      expeditionId,
      data,
    );
    await loadExpeditions();
    return updated;
  };

  useEffect(() => {
    loadExpeditions();
  }, [loadExpeditions]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  return (
    <ExpeditionsContext.Provider
      value={{
        expeditions,
        pagination,
        expeditionsFilters,
        appliedExpeditionsFilters,
        catalogsFilters,
        catalogs,
        loading,
        setExpeditionsFilters,
        setCatalogsFilters,
        loadExpeditions,
        loadCatalogs,
        getExpeditionById,
        createExpedition,
        updateExpeditionState,
      }}
    >
      {children}
    </ExpeditionsContext.Provider>
  );
}
