// src/utils/ErrorHandlers.ts

// Custom error classes for different types of errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for proper instanceof checking
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Authentication related errors
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

// Authorization related errors
export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly errors: Record<string, string> | null;

  constructor(
    message = "Validation failed",
    errors: Record<string, string> | null = null
  ) {
    super(message, 400);
    this.errors = errors;
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, true);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message = "External service error") {
    super(`${service}: ${message}`, 502);
  }
}

// Global error handler middleware
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // If it's our custom AppError, use its status code and message
  if (err instanceof AppError) {
    // For validation errors, include the validation details
    if (err instanceof ValidationError && err.errors) {
      return res.status(err.statusCode).json({
        status: "error",
        message: err.message,
        errors: err.errors,
        code: err.statusCode,
      });
    }

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      code: err.statusCode,
    });
  }

  // Handle Supabase auth errors (they have a specific structure)
  if (err.name === "AuthApiError" || err.name === "AuthError") {
    return res.status(401).json({
      status: "error",
      message: err.message || "Authentication failed",
      code: 401,
    });
  }

  // Handle database constraint errors
  if (
    err.name === "DatabaseError" &&
    err.message.includes("violates unique constraint")
  ) {
    return res.status(409).json({
      status: "error",
      message: "A record with this information already exists",
      code: 409,
    });
  }

  // For unhandled errors in production, don't leak error details
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    status: "error",
    message: isProduction ? "An unexpected error occurred" : err.message,
    code: 500,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

// Async handler to avoid try/catch blocks in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
