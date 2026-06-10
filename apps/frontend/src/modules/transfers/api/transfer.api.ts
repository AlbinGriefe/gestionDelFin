import type {
  TransferCatalogs,
  TransferListFilters,
  TransferCatalogFilters,
  TransfersList,
  TransferDetail,
  TransferStateUpdateInput,
  TransferCreateInput,
} from "../types/transfers.types.ts";

import { httpClient } from "../../../shared/api/httpClient.ts";

async function loadCatalogs(filters: TransferCatalogFilters) {
  const params = new URLSearchParams();

  if (filters?.originCampId)
    params.append("originCampId", String(filters.originCampId));

  return httpClient<TransferCatalogs>(
    `/transfers/catalogs?${params.toString()}`,
  );
}

async function listTransfers(filters: TransferListFilters) {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.state) params.append("state", filters.state);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.campId) params.append("campId", String(filters.campId));

  return httpClient<TransfersList>(`/transfers?${params.toString()}`);
}

async function getTransferById(transferId: number) {
  return httpClient<TransferDetail>(`/transfers/${transferId}`);
}

async function createTransfer(data: TransferCreateInput) {
  return httpClient<TransferDetail>("/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateTransferState(
  transferId: number,
  data: TransferStateUpdateInput,
) {
  return httpClient<TransferDetail>(`/transfers/${transferId}/state`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export const transfersApi = {
  loadCatalogs,
  listTransfers,
  getTransferById,
  createTransfer,
  updateTransferState,
};
