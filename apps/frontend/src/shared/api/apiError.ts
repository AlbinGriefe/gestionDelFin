export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR"
  | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  serverCode?: string;
  details?: unknown;
  requestId?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: {
      serverCode?: string;
      details?: unknown;
      requestId?: string | null;
    },
  ) {
    super(message);
    this.code = code;
    this.serverCode = options?.serverCode;
    this.details = options?.details;
    this.requestId = options?.requestId ?? undefined;
    this.name = "ApiError";
  }
}
