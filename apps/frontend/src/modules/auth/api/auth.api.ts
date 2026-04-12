import { httpClient } from '../../../shared/api/httpClient';
import type { AuthenticatedUser } from '../types/auth.types';
import type { SessionConfig } from "../types/auth.types";

type LoginData = {
    accessToken: string;
    tokenType: string;
    expiresInHours: number;
    sessionTimeoutMinutes: number;
    serverTime: string;
    user: {
        id: number;
        username: string;
        email: string;
        roleName: string;
        campId: number;
        campName: string;
        personId: number;
    };
};

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

export const authApi = {
    login,
    me,
    logout,
    getSessionConfig,
};