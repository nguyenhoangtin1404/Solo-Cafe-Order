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
