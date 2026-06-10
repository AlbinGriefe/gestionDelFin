import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./auth.context";
import { tokenStorage } from "../../../shared/api/tokenStorage";
import { authApi } from "../api/auth.api";
import type { AuthenticatedUser, SessionConfig } from "../types/auth.types";
import { registerLogout } from "../../../shared/services/authService";

type User = AuthenticatedUser;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(
    null,
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenStorage.get();

        if (!token) {
          setLoading(false);
          return;
        }

        const me = await authApi.me();
        setUser(me);

        const config = await authApi.getSessionConfig();
        setSessionConfig(config);
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          tokenStorage.remove();
          setUser(null);
          setSessionConfig(null);
        } else {
          console.error("Error cargando sesión:", error);
          tokenStorage.remove();
          setUser(null);
          setSessionConfig(null);
        }
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (identity: string, password: string) => {
    const res = await authApi.login({ identity, password });

    tokenStorage.set(res.accessToken);

    const me = await authApi.me();
    setUser(me);

    const config = await authApi.getSessionConfig();
    setSessionConfig(config);
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error(error);
    }

    tokenStorage.remove();
    setUser(null);
    setSessionConfig(null);
  }, []);

  const switchCamp = useCallback(async (campId: number) => {
    const result = await authApi.switchCamp(campId);
    tokenStorage.set(result.accessToken);
    setUser(await authApi.me());
  }, []);

  useEffect(() => {
    registerLogout(logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchCamp,
        isAuthenticated: !!user,
        loading,
        sessionConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
