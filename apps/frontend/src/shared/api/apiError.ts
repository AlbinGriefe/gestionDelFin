export type ApiErrorCode =
    | "UNAUTHORIZED"
    | "BAD_REQUEST"
    | "UNKNOWN";

export class ApiError extends Error {
    code: ApiErrorCode;

    constructor(code: ApiErrorCode, message: string) {
        super(message);
        this.code = code;
    }
}