import { tokenStorage } from './tokenStorage';
import type { ApiResponse } from './apiResponse';
import { ApiError } from './apiError';
import type { ApiErrorCode } from './apiError';
import { toast } from '../services/toastService';
import { triggerLogout } from '../services/authService';
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

        toast("Error de conexión con el servidor", "error");
        throw error;
    }

    if (response.status === 401) {
        const hadToken = !!token;

        tokenStorage.remove();

        if (hadToken) {
            toast("Sesión expirada, inicia sesión nuevamente", "error");
            await triggerLogout();
        }

        throw new Error("Unauthorized");
    }

    let result: ApiResponse<T>;

    try {
        result = await response.json();
    } catch {
        toast("Respuesta inválida del servidor", "error");
        throw new Error("Invalid JSON response");
    }

    if (!result.success) {
        const message = result.error.message;

        let code: ApiErrorCode = "UNKNOWN";
        if (response.status === 400) code = "BAD_REQUEST";

        const error = new ApiError(code, message);

        if (options.showError !== false) {
            toast(mapErrorToMessage(error), "error");
        }

        throw error;
    }

    return result.data;
}