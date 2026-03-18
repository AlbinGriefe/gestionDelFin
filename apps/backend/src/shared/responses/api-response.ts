export function createSuccessResponse<T>(data: T, requestId?: string) {
  return {
    success: true,
    data,
    meta: {
      requestId: requestId ?? null,
      serverTime: new Date().toISOString(),
    },
  };
}

export function createErrorResponse(input: {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}) {
  return {
    success: false,
    error: {
      code: input.code,
      message: input.message,
      details: input.details ?? null,
    },
    meta: {
      requestId: input.requestId ?? null,
      serverTime: new Date().toISOString(),
    },
  };
}
