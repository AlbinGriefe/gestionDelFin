import { createContext } from "react";
import type { AuthenticatedUser, SessionConfig } from "../types/auth.types";

type User = AuthenticatedUser;

export interface AuthContextType {
  user: User | null;
  login: (identity: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCamp: (campId: number) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  sessionConfig: SessionConfig | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
