import { ApiError } from "../api/apiError";
import type { ApiErrorCode } from "../api/apiError";

export function getErrorMessage(code: ApiErrorCode): string {
    switch (code) {
        case "UNAUTHORIZED":
            return "Credenciales incorrectas";

        case "BAD_REQUEST":
            return "Datos inválidos";

        case "NOT_FOUND":
            return "No se encontró el registro";

        case "UNKNOWN":
            return "Ocurrió un error inesperado";

        default: {
            const _exhaustive: never = code;
            return _exhaustive;
        }
    }
}

export function mapErrorToMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return getErrorMessage(error.code);
    }

    return "Ocurrió un error inesperado";
}