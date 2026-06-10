import { useState } from "react";
import { useTransfers } from "../context/useTransfers";
import TransferRow from "./TransferRow";
import styles from "./TransfersList.module.css";
import type { TransferSummary } from "../types/transfers.types";

interface TransfersListProps {
  onManage: (transfer: TransferSummary) => void;
}

type StateFilter = "" | TransferSummary["state"];
type TypeFilter = "" | TransferSummary["type"];

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "accepted", label: "Aceptada" },
  { value: "declined", label: "Rechazada" },
  { value: "scheduled", label: "Agendada" },
  { value: "in_transit", label: "En tránsito" },
  { value: "delivered", label: "Entregada" },
  { value: "returned", label: "Devuelta" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "", label: "Todos los tipos" },
  { value: "resources", label: "Recursos" },
  { value: "people", label: "Personas" },
  { value: "mixed", label: "Mixta" },
];

export default function TransfersList({ onManage }: TransfersListProps) {
  const {
    transfers,
    loading,
    pagination,
    transfersFilters,
    setTransfersFilters,
  } = useTransfers();
  const [search, setSearch] = useState(transfersFilters.search ?? "");

  const handlePage = (page: number) => {
    setTransfersFilters({ ...transfersFilters, page });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTransfersFilters({
      ...transfersFilters,
      page: 1,
      search: search.trim() || undefined,
    });
  };

  const handleState = (state: StateFilter) => {
    setTransfersFilters({
      ...transfersFilters,
      page: 1,
      state: state || undefined,
    });
  };

  const handleType = (type: TypeFilter) => {
    setTransfersFilters({
      ...transfersFilters,
      page: 1,
      type: type || undefined,
    });
  };

  if (loading) return <p className={styles.empty}>Cargando solicitudes...</p>;

  return (
    <div>
      <div className={styles.filterBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
          />
          <button type="submit" className={styles.searchBtn}>
            Buscar
          </button>
        </form>
        <select
          className={styles.select}
          value={transfersFilters.state ?? ""}
          onChange={(e) => handleState(e.target.value as StateFilter)}
        >
          {STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={transfersFilters.type ?? ""}
          onChange={(e) => handleType(e.target.value as TypeFilter)}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {transfers.length === 0 ? (
        <p className={styles.empty}>No hay solicitudes disponibles.</p>
      ) : (
        <div>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Origen → Destino</th>
                  <th>Tipo</th>
                  <th>Contenido</th>
                  <th>Solicitada</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <TransferRow
                    key={transfer.id}
                    transfer={transfer}
                    onManage={onManage}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Página {pagination.page} de {pagination.totalPages} ·{" "}
                {pagination.totalItems} solicitudes
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePage(1)}
                  disabled={pagination.page === 1}
                >
                  «
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  ‹
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`${styles.pageBtn} ${p === pagination.page ? styles.pageBtnActive : ""}`}
                        onClick={() => handlePage(p as number)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  ›
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePage(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
