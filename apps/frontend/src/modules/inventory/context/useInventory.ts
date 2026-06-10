import { useContext } from "react";
import { InventoryContext } from "./inventory.context";

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context)
    throw new Error("useInventory debe usarse dentro de InventoryProvider");
  return context;
}
