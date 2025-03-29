// src/utils/ResponseHandler.ts

import { Response } from "express";

export interface ApiResponse<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  code: number;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHandler {
  // Success response
  static success<T>(
    res: Response,
    data: T,
    message = "Operation successful",
    code = 200,
    meta?: ApiResponse<T>["meta"]
  ): Response {
    const response: ApiResponse<T> = {
      status: "success",
      message,
      data,
      code,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(code).json(response);
  }

  // Created response (201)
  static created<T>(
    res: Response,
    data: T,
    message = "Resource created successfully"
  ): Response {
    return ResponseHandler.success(res, data, message, 201);
  }

  // No content response (204)
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  // Error response
  static error(
    res: Response,
    message = "An error occurred",
    code = 500
  ): Response {
    return res.status(code).json({
      status: "error",
      message,
      code,
    });
  }

  // Bad request response (400)
  static badRequest(
    res: Response,
    message = "Bad request",
    errors: Record<string, string> | null = null
  ): Response {
    return res.status(400).json({
      status: "error",
      message,
      code: 400,
      ...(errors ? { errors } : {}),
    });
  }

  // Unauthorized response (401)
  static unauthorized(
    res: Response,
    message = "Authentication required"
  ): Response {
    return ResponseHandler.error(res, message, 401);
  }

  // Forbidden response (403)
  static forbidden(
    res: Response,
    message = "You do not have permission to perform this action"
  ): Response {
    return ResponseHandler.error(res, message, 403);
  }

  // Not found response (404)
  static notFound(res: Response, resource = "Resource"): Response {
    return ResponseHandler.error(res, `${resource} not found`, 404);
  }

  // Conflict response (409)
  static conflict(
    res: Response,
    message = "Resource already exists"
  ): Response {
    return ResponseHandler.error(res, message, 409);
  }

  // Pagination helper
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = "Resources retrieved successfully"
  ): Response {
    const totalPages = Math.ceil(total / limit);

    return ResponseHandler.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  }
}
