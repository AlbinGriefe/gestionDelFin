import { createContext } from "react";

export type IdleSessionContextType = {
  remainingSeconds: number | null;
  isWarning: boolean;
};

export const IdleSessionContext = createContext<IdleSessionContextType | null>(
  null,
);
