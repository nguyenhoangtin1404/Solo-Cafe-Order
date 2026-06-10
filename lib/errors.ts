export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function errorResponse(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status });
}

// Catch-all cho API routes: AppError giữ nguyên code/status, lỗi lạ log đầy đủ rồi trả 500 generic
export function handleRouteError(err: unknown): Response {
  if (isAppError(err)) {
    return errorResponse(err.code, err.message, err.httpStatus);
  }
  console.error("[api] unhandled error", err);
  return errorResponse("INTERNAL_ERROR", "Server error", 500);
}
