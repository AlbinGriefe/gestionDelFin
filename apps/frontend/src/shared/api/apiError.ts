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

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: {
      serverCode?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.code = code;
    this.serverCode = options?.serverCode;
    this.details = options?.details;
    this.name = "ApiError";
  }
}
