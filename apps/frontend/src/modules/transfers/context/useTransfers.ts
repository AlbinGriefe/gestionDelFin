import { useContext } from "react";
import { TransfersContext } from "./transfers.context";

export function useTransfers() {
  const context = useContext(TransfersContext);
  if (!context)
    throw new Error("useTransfers debe usarse dentro de TransfersProvider");
  return context;
}
