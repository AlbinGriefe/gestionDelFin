import { useContext } from "react";
import { EventsContext } from "./events.context";

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvent debe usarse dentro de EventProvider");
  return context;
}
