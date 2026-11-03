/**
 * Production-grade custom error hierarchy for Tatkal High-Concurrency Booking.
 * Specifically distinguishes between:
 * - Seat Unavailable (409 Conflict / Quota Exhausted)
 * - Server Overload (503 Service Unavailable / Concurrency or Redis lock timeouts)
 * - Validation Error (400 Bad Request / Zod payload failure)
 * - Duplicate Request (409 Conflict / Idempotency)
 * - Database Sync / Internal Errors (500 with compensation)
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly isOperational: boolean = true;
  readonly timestamp: string = new Date().toISOString();
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        details: this.details,
      },
    };
  }
}

/**
 * Seat Unavailable: Returned when Tatkal quota has reached 0 or remaining seats < requested.
 * HTTP 409 Conflict
 */
export class SeatUnavailableError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "SEAT_UNAVAILABLE";

  constructor(
    message: string = "Tatkal quota exhausted. Requested number of seats is not available.",
    details?: {
      trainId?: string;
      journeyDate?: string;
      travelClass?: string;
      quota?: string;
      requestedSeats?: number;
      availableSeats?: number;
    }
  ) {
    super(message, details);
  }
}

/**
 * Server Overload: Returned when Redis connection pool is saturated, lock contention
 * timeouts occur, rate limits trigger, or backpressure exceeds safe thresholds at 10:00 AM.
 * HTTP 503 Service Unavailable (with Retry-After header)
 */
export class ServerOverloadError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = "SERVER_OVERLOAD";
  readonly retryAfterSeconds: number;

  constructor(
    message: string = "Booking engine is currently experiencing extreme traffic spike. Please retry.",
    retryAfterSeconds: number = 2,
    details?: {
      subsystem?: "redis_lock" | "redis_pool" | "database_pool" | "rate_limiter";
      activeRequests?: number;
      queueWaitTimeMs?: number;
      [key: string]: unknown;
    }
  ) {
    super(message, { ...details, retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Validation Error: Returned when Zod schema validation fails on incoming payload.
 * HTTP 400 Bad Request
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "VALIDATION_ERROR";

  constructor(
    message: string = "Invalid booking payload format or parameters.",
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}

/**
 * Duplicate Booking Error: Returned when the same idempotency key is concurrently or
 * previously processed.
 * HTTP 409 Conflict
 */
export class DuplicateBookingError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = "DUPLICATE_IDEMPOTENCY_KEY";

  constructor(
    idempotencyKey: string,
    message: string = "A booking request with this idempotency key is already in progress or completed."
  ) {
    super(message, { idempotencyKey });
  }
}

/**
 * Database Persistence Error: Seat was reserved in Redis, but PostgreSQL write failed.
 * Signals to caller that compensation/rollback of Redis inventory was initiated.
 * HTTP 500 Internal Server Error
 */
export class DatabaseSyncError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = "DATABASE_SYNC_FAILURE";

  constructor(
    message: string = "Seat reserved in atomic cache, but database confirmation failed. Reservation rolled back.",
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}
