import { useContext } from "react";
import { PersonsContext } from "./persons.context";

export function usePersons() {
  const context = useContext(PersonsContext);
  if (!context)
    throw new Error("usePersons debe usarse dentro de PersonsProvider");
  return context;
}
