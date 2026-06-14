import { httpClient } from "../../../shared/api/httpClient";
import type { AuthenticatedUser, LoginData } from "../types/auth.types";
import type { SessionConfig } from "../types/auth.types";

async function login(data: { identity: string; password: string }) {
  return httpClient<LoginData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    showError: false,
  });
}

async function me() {
  return httpClient<AuthenticatedUser>("/auth/me");
}

async function logout() {
  return httpClient("/auth/logout", {
    method: "POST",
  });
}

async function getSessionConfig() {
  return httpClient<SessionConfig>("/auth/session-config");
}

async function switchCamp(campId: number) {
  return httpClient<LoginData>("/auth/switch-camp", {
    method: "POST",
    body: JSON.stringify({ campId }),
  });
}

export const authApi = {
  login,
  me,
  logout,
  getSessionConfig,
  switchCamp,
};
