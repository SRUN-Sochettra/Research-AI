export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
    this.name = "AuthorizationError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests", "RATE_LIMITED", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: unknown) {
    super(
      `External service error: ${service}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
      originalError
    );
    this.name = "ExternalServiceError";
  }
}

// Safe error response - never expose internals
export function toErrorResponse(error: unknown): {
  code: string;
  message: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  // Unknown errors - don't leak details
  console.error("Unhandled error:", error);
  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}
