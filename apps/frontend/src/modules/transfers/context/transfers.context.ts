import { createContext } from "react";
import type {
  TransferCatalogs,
  TransferListFilters,
  TransferCatalogFilters,
  TransfersList,
  TransferDetail,
  TransferStateUpdateInput,
  TransferCreateInput,
  TransferSummary,
} from "../types/transfers.types.ts";

export interface TransfersContextType {
  transfers: TransferSummary[];
  pagination: TransfersList["pagination"] | null;
  transfersFilters: TransferListFilters;
  appliedTransfersFilters: TransfersList["appliedFilters"] | null;
  catalogsFilters: TransferCatalogFilters;
  catalogs: TransferCatalogs | null;
  loading: boolean;
  setTransfersFilters: (filters: TransferListFilters) => void;
  setCatalogsFilters: (filters: TransferCatalogFilters) => void;
  loadTransfers: () => Promise<void>;
  loadCatalogs: () => Promise<void>;
  getTransferById: (transferId: number) => Promise<TransferDetail>;
  createTransfer: (data: TransferCreateInput) => Promise<TransferDetail>;
  updateTransferState: (
    transferId: number,
    data: TransferStateUpdateInput,
  ) => Promise<TransferDetail>;
}

export const TransfersContext = createContext<TransfersContextType | null>(
  null,
);
