import { ErrorCode } from "@quiz/shared";

export { ErrorCode } from "@quiz/shared";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, ErrorCode.BadRequest);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, ErrorCode.Unauthorized);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, ErrorCode.Forbidden);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, ErrorCode.NotFound);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, ErrorCode.Conflict);
  }
}

export class NotImplementedError extends AppError {
  constructor(message = "Not implemented") {
    super(message, 501, ErrorCode.NotImplemented);
  }
}
