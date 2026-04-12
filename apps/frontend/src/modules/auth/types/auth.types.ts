export type User = {
    id: number;
    username: string;
    email: string;
    roleName: string;
    campId: number;
    campName: string;
    personId: number;
};

export type PublicUserProfile = {
    id: number;
    username: string;
    email: string | null;
    roleName: string;
    campId: number;
    campName: string;
    personId: number | null;
};

export type AuthenticatedUser = PublicUserProfile & {
    sessionId: string;
    sessionExpiresAt: string;
    sessionTimeoutMinutes: number;
};

export type LoginData = {
    accessToken: string;
    tokenType: "Bearer";
    expiresInHours: number;
    sessionTimeoutMinutes: number;
    serverTime: string;
    user: PublicUserProfile;
};

export type SessionConfig = {
    serverTime: string;
    sessionTimeoutMinutes: number;
};