import { ApiError } from "../api/apiError";
import type { ApiErrorCode } from "../api/apiError";

export function getErrorMessage(code: ApiErrorCode): string {
    switch (code) {
        case "UNAUTHORIZED":
            return "Credenciales incorrectas";

        case "BAD_REQUEST":
            return "Datos inválidos";

        case "UNKNOWN":
        default:
            return "Ocurrió un error inesperado";
    }
}

export function mapErrorToMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return getErrorMessage(error.code);
    }

    return "Ocurrió un error inesperado";
}