import { useState, useCallback, useEffect } from "react";
import { TransfersContext } from "./transfers.context";
import { transfersApi } from "../api/transfer.api";

import type {
    TransferSummary,
    TransfersList,
    TransferListFilters,
    TransferCatalogFilters,
    TransferCatalogs,
    TransferDetail,
    TransferCreateInput,
    TransferStateUpdateInput,
} from "../types/transfers.types";

export function TransfersProvider({ children }: { children: React.ReactNode }) {
    const [transfers, setTransfers] = useState<TransferSummary[]>([]);
    const [pagination, setPagination] = useState<TransfersList["pagination"] | null>(null);
    const [appliedTransfersFilters, setAppliedTransfersFilters] = useState<TransfersList["appliedFilters"] | null>(null);
    const [catalogs, setCatalogs] = useState<TransferCatalogs | null>(null);

    const [loading, setLoading] = useState(false);

    const [transfersFilters, setTransfersFilters] = useState<TransferListFilters>({
        page: 1,
        pageSize: 20,
    });

    const [catalogsFilters, setCatalogsFilters] = useState<TransferCatalogFilters>({});

    const loadTransfers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await transfersApi.listTransfers(transfersFilters);
            setTransfers(data.items);
            setPagination(data.pagination);
            setAppliedTransfersFilters(data.appliedFilters);
        } finally {
            setLoading(false);
        }
    }, [transfersFilters]);

    const loadCatalogs = useCallback(async () => {
        const data = await transfersApi.loadCatalogs(catalogsFilters);
        setCatalogs(data);
    }, [catalogsFilters]);

    const getTransferById = async (transferId: number): Promise<TransferDetail> => {
        return transfersApi.getTransferById(transferId);
    };

    const createTransfer = async (data: TransferCreateInput): Promise<TransferDetail> => {
        const created = await transfersApi.createTransfer(data);
        await loadTransfers();
        return created;
    };

    const updateTransferState = async (
        transferId: number,
        data: TransferStateUpdateInput
    ): Promise<TransferDetail> => {
        const updated = await transfersApi.updateTransferState(transferId, data);
        await loadTransfers();
        return updated;
    };

    useEffect(() => {
        loadTransfers();
    }, [loadTransfers]);

    useEffect(() => {
        loadCatalogs();
    }, [loadCatalogs]);

    return (
        <TransfersContext.Provider
            value={{
                transfers,
                pagination,
                transfersFilters,
                appliedTransfersFilters,
                catalogsFilters,
                catalogs,
                loading,
                setTransfersFilters,
                setCatalogsFilters,
                loadTransfers,
                loadCatalogs,
                getTransferById,
                createTransfer,
                updateTransferState,
            }}
        >
            {children}
        </TransfersContext.Provider>
    );
}