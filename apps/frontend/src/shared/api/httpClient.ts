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

    } catch (error) {
        toast.error("Error de conexión con el servidor");
        throw error;
    }

    if (response.status === 401) {
        const hadToken = !!token;

        tokenStorage.remove();

        if (hadToken) {
            toast.error("Sesión expirada, inicia sesión nuevamente");
            await triggerLogout();
        }

        throw new Error("Unauthorized");
    }

    let result: ApiResponse<T>;

    try {
        result = await response.json();
    } catch {
        toast.error("Respuesta inválida del servidor");
        throw new Error("Invalid JSON response");
    }

    if (!result.success) {
        const message = result.error.message;

        let code: ApiErrorCode = "UNKNOWN";
        if (response.status === 400) code = "BAD_REQUEST";

        const error = new ApiError(code, message);

        if (options.showError !== false) {
            toast.error(mapErrorToMessage(error));
        }

        throw error;
    }

    return result.data;
}