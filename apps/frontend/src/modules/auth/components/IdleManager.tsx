import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/useAuth";
import { useIdleTimer } from "../hooks/useIdleTimer";
import { authApi } from "../api/auth.api";

const FALLBACK_TIMEOUT_MINUTES = 20;
const WARNING_SECONDS = 60;

export function IdleManager() {
    const { isAuthenticated, sessionConfig, logout } = useAuth();
    const navigate = useNavigate();

    const timeoutMinutes =
        sessionConfig?.sessionTimeoutMinutes ?? FALLBACK_TIMEOUT_MINUTES;
    const timeoutMs = timeoutMinutes * 60_000;
    const warningMs = Math.min(WARNING_SECONDS * 1000, timeoutMs / 2);
    const keepAliveMs = Math.max(60_000, timeoutMs / 3);

    const handleIdle = useCallback(async () => {
        await logout();
        navigate("/login", { replace: true });
        toast.warning(
            `Sesion bloqueada tras ${timeoutMinutes} minutos de inactividad. Inicia sesion nuevamente.`,
        );
    }, [logout, navigate, timeoutMinutes]);

    const handleWarning = useCallback(() => {
        toast.warning("Tu sesion se cerrara pronto por inactividad.");
    }, []);

    const handleActivity = useCallback(() => {
        authApi.me().catch(() => undefined);
    }, []);

    useIdleTimer({
        enabled: isAuthenticated,
        timeoutMs,
        warningMs,
        keepAliveMs,
        onIdle: handleIdle,
        onWarning: handleWarning,
        onActivity: handleActivity,
    });

    return null;
}
