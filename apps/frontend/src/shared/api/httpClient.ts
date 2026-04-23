import { tokenStorage } from './tokenStorage';
import type { ApiResponse } from './apiResponse';
import { ApiError } from './apiError';
import type { ApiErrorCode } from './apiError';
import { triggerLogout } from '../services/authService';
import { toast } from "sonner";
import { mapErrorToMessage } from '../errors/errorMapper';

const API_BASE_URL = import.meta.env.VITE_API_URL;

type HttpOptions = RequestInit & {
    showError?: boolean;
};

export async function httpClient<T>(
    endpoint: string,
    options: HttpOptions = {}
): Promise<T> {
    const token = tokenStorage.get();

    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        });
    } catch {
        if (options.showError !== false) {
            toast.error("Error de conexión con el servidor");
        }
        throw new ApiError("UNKNOWN", "Network error");
    }

    if (response.status === 401) {
        const hadToken = !!token;

        tokenStorage.remove();

        if (hadToken) {
            if (options.showError !== false) {
                toast.error("Sesión expirada, inicia sesión nuevamente");
            }
            await triggerLogout();
        }

        throw new ApiError("UNAUTHORIZED", "Unauthorized");
    }

    let result: ApiResponse<T>;

    try {
        result = await response.json();
    } catch {
        if (options.showError !== false) {
            toast.error("Respuesta inválida del servidor");
        }
        throw new ApiError("UNKNOWN", "Invalid JSON response");
    }

    if (!result.success) {
        let code: ApiErrorCode = "UNKNOWN";

        switch (response.status) {
            case 400:
                code = "BAD_REQUEST";
                break;
            case 404:
                code = "NOT_FOUND";
                break;
            case 401:
                code = "UNAUTHORIZED";
                break;
            default:
                code = "UNKNOWN";
        }

        const error = new ApiError(code, result.error.message);

        if (options.showError !== false) {
            toast.error(mapErrorToMessage(error));
        }

        throw error;
    }

    return result.data;
}