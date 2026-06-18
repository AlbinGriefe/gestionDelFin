import { ApiError } from "../api/apiError";
import type { ApiErrorCode } from "../api/apiError";

const serverMessages: Record<string, string> = {
  ADMISSION_ADMIN_REQUIRED: "Tu rol no puede gestionar admisiones.",
  ADMISSION_FORBIDDEN_CAMP:
    "La persona pertenece a un campamento fuera de tu alcance.",
  ADMISSION_EVALUATION_FINAL:
    "Esta evaluacion ya fue finalizada. Actualiza el flujo.",
  ADMISSION_CAMP_CAPACITY_EXCEEDED:
    "No hay capacidad disponible en el campamento.",
  ADMISSION_PERSON_NOT_FOUND: "No se encontro la persona seleccionada.",
  ADMISSION_EVALUATION_NOT_FOUND: "No se encontro la evaluacion de admision.",
  PERSONS_FORBIDDEN: "La persona esta fuera de tu campamento activo.",
  FORBIDDEN: "No tienes permiso para realizar esta accion.",
  VALIDATION_ERROR: "Datos invalidos.",
};

export function getErrorMessage(code: ApiErrorCode): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Credenciales incorrectas";

    case "BAD_REQUEST":
      return "Datos invalidos";

    case "FORBIDDEN":
      return "No tienes permiso para realizar esta accion";

    case "NOT_FOUND":
      return "No se encontro el registro";

    case "CONFLICT":
      return "La operacion no se puede completar con el estado actual";

    case "SERVER_ERROR":
      return "El servidor no pudo completar la operacion";

    case "UNKNOWN":
      return "Ocurrio un error inesperado";

    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}

export function mapErrorToMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.serverCode && serverMessages[error.serverCode]) {
      return serverMessages[error.serverCode];
    }

    return getErrorMessage(error.code);
  }

  return "Ocurrio un error inesperado";
}
