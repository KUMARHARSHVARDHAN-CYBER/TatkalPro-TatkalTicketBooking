import { Request, Response, NextFunction } from "express";
import { BookingPayloadSchema } from "../validators/booking.validator";
import { ValidationError, AppError } from "../errors/customErrors";
import redisBookingService from "../services/redisBooking.service";
import databaseBookingService from "../services/databaseBooking.service";

/**
 * Controller for High-Concurrency POST /api/book endpoint
 *
 * Designed specifically for 10:00 AM Tatkal booking rushes:
 * 1. Zod schema validation checks format and passenger limits.
 * 2. Atomic Redis Lua script checks availability and decrements inventory in memory.
 * 3. PostgreSQL database is updated ONLY AFTER the seat is confirmed in Redis.
 * 4. Compensation rollback restores Redis inventory if database write fails.
 * 5. Production-grade error discrimination (Seat Unavailable vs Server Overload).
 */
export async function bookTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // -------------------------------------------------------------------------
  // 1. Zod Schema Validation
  // -------------------------------------------------------------------------
  const validationResult = BookingPayloadSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorIssues = validationResult.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return next(
      new ValidationError("Invalid Tatkal booking payload format.", {
        issues: errorIssues,
      })
    );
  }

  const payload = validationResult.data;
  const requestedSeatCount = payload.passengers.length;

  let reservationResult;

  // -------------------------------------------------------------------------
  // 2. Redis Atomic Lock & Seat Decrement
  // -------------------------------------------------------------------------
  try {
    reservationResult = await redisBookingService.reserveSeatAtomically({
      trainId: payload.trainId,
      journeyDate: payload.journeyDate,
      travelClass: payload.travelClass,
      quota: payload.quota,
      requestedSeats: requestedSeatCount,
      idempotencyKey: payload.idempotencyKey,
      userId: payload.userId,
    });
  } catch (error: any) {
    // Forward custom operational errors directly (SeatUnavailableError, ServerOverloadError, DuplicateBookingError)
    return next(error);
  }

  // -------------------------------------------------------------------------
  // 3. PostgreSQL Database Persistence
  // Only executed AFTER Redis atomic lock confirms seats are secured
  // -------------------------------------------------------------------------
  try {
    const confirmedBooking = await databaseBookingService.persistConfirmedBooking(
      payload,
      reservationResult.remainingSeats
    );

    res.status(201).json({
      success: true,
      message: "Tatkal ticket confirmed successfully.",
      data: {
        pnr: confirmedBooking.pnrNumber,
        bookingId: confirmedBooking.id,
        trainId: confirmedBooking.trainId,
        fromStation: confirmedBooking.fromStationCode,
        toStation: confirmedBooking.toStationCode,
        journeyDate: confirmedBooking.journeyDate,
        travelClass: confirmedBooking.travelClass,
        quota: confirmedBooking.quota,
        totalFare: confirmedBooking.totalFare,
        seatCount: requestedSeatCount,
        passengers: confirmedBooking.passengers,
        status: "CONFIRMED",
        remainingQuotaSeats: reservationResult.remainingSeats,
      },
    });
  } catch (dbError: any) {
    // -----------------------------------------------------------------------
    // 4. Compensation / Rollback on Database Failure
    // Restores reserved seats back to Redis pool to prevent inventory leakage
    // -----------------------------------------------------------------------
    console.error(
      `[Booking Pipeline] Database write failed for PNR intent. Initiating Redis inventory compensation...`,
      dbError.message
    );

    try {
      await redisBookingService.rollbackReservation(
        reservationResult.inventoryKey,
        requestedSeatCount,
        reservationResult.idempotencyKey,
        reservationResult.lockToken
      );
    } catch (compensationErr: any) {
      console.error(
        `[CRITICAL ALERT] Failed to compensate Redis inventory:`,
        compensationErr.message
      );
    }

    // Forward the specific database/server overload error to the error middleware
    return next(dbError);
  }
}

