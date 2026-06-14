import { useContext } from "react";

import { IdleSessionContext } from "./idle-session.context";

export function useIdleSession() {
  const context = useContext(IdleSessionContext);

  if (!context) {
    throw new Error("useIdleSession debe usarse dentro de IdleManager");
  }

  return context;
}
