import { Request, Response, NextFunction } from "express";
import { AppError, ServerOverloadError } from "../errors/customErrors";

/**
 * Production-grade error handling middleware.
 * Ensures zero generic 500 errors for known business failure scenarios.
 * Specifically handles:
 * - 409 Conflict: Seat Unavailable / Duplicate Idempotency Key
 * - 503 Service Unavailable: Server Overload / Lock Saturated (with Retry-After header)
 * - 400 Bad Request: Zod Validation Failure
 * - 500 Internal Server Error: Unhandled exceptions
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    // If it's a Server Overload error, set standard HTTP Retry-After header
    if (err instanceof ServerOverloadError) {
      res.setHeader("Retry-After", String(err.retryAfterSeconds));
    }

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle SyntaxError (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON",
        message: "Request body contains invalid JSON.",
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Unhandled / Unexpected Errors
  console.error("[CRITICAL UNHANDLED ERROR]:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while processing the Tatkal booking.",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  });
}

