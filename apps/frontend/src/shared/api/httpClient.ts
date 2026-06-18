import { tokenStorage } from "./tokenStorage";
import type { ApiResponse } from "./apiResponse";
import { ApiError } from "./apiError";
import type { ApiErrorCode } from "./apiError";
import { triggerLogout } from "../services/authService";
import { toast } from "sonner";
import { mapErrorToMessage } from "../errors/errorMapper";

const API_BASE_URL = import.meta.env.VITE_API_URL;

type HttpOptions = RequestInit & {
  showError?: boolean;
};

function requestIdFromResponse(response: Response) {
  return response.headers.get("X-Request-Id");
}

function apiErrorCodeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 404:
      return "NOT_FOUND";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 409:
      return "CONFLICT";
    case 500:
      return "SERVER_ERROR";
    default:
      return "UNKNOWN";
  }
}

export async function httpClient<T>(
  endpoint: string,
  options: HttpOptions = {},
): Promise<T> {
  const token = tokenStorage.get();

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    if (options.showError !== false) {
      toast.error("Error de conexion con el servidor");
    }
    throw new ApiError("UNKNOWN", "Network error");
  }

  if (response.status === 401) {
    const hadToken = !!token;
    const requestId = requestIdFromResponse(response);

    tokenStorage.remove();

    if (hadToken) {
      if (options.showError !== false) {
        toast.error("Sesion expirada, inicia sesion nuevamente");
      }
      await triggerLogout();
    }

    throw new ApiError("UNAUTHORIZED", "Unauthorized", { requestId });
  }

  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    const requestId = requestIdFromResponse(response);
    const error = new ApiError("UNKNOWN", "Invalid JSON response", {
      requestId,
    });

    if (options.showError !== false) {
      toast.error(mapErrorToMessage(error));
    }

    throw error;
  }

  if (!result.success) {
    const code = apiErrorCodeFromStatus(response.status);
    const requestId = result.meta.requestId ?? requestIdFromResponse(response);

    const error = new ApiError(code, result.error.message, {
      serverCode: result.error.code,
      details: result.error.details,
      requestId,
    });

    if (options.showError !== false) {
      toast.error(mapErrorToMessage(error));
    }

    throw error;
  }

  return result.data;
}
