import { Router, Request, Response } from "express";
import { bookTicketHandler } from "../controllers/booking.controller";
import redisBookingService from "../services/redisBooking.service";

const router = Router();

/**
 * Core High-Concurrency Booking Endpoint
 * POST /api/book
 */
router.post("/book", bookTicketHandler);

/**
 * Helper endpoint to seed or reset seat inventory in Redis
 * POST /api/inventory/seed
 */
router.post("/inventory/seed", async (req: Request, res: Response) => {
  const {
    trainId = "12952",
    journeyDate = "2026-11-10",
    travelClass = "3A",
    quota = "TATKAL",
    seats = 20,
  } = req.body;

  await redisBookingService.initializeInventory(
    trainId,
    journeyDate,
    travelClass,
    quota,
    Number(seats)
  );

  const inventoryKey = redisBookingService.getInventoryKey(
    trainId,
    journeyDate,
    travelClass,
    quota
  );

  res.status(200).json({
    success: true,
    message: `Initialized ${seats} Tatkal seats for Train ${trainId} in Redis.`,
    data: {
      key: inventoryKey,
      availableSeats: Number(seats),
    },
  });
});

/**
 * Helper endpoint to inspect current Redis inventory count
 * GET /api/inventory
 */
router.get("/inventory", async (req: Request, res: Response) => {
  const trainId = (req.query.trainId as string) || "12952";
  const journeyDate = (req.query.journeyDate as string) || "2026-11-10";
  const travelClass = (req.query.travelClass as string) || "3A";
  const quota = (req.query.quota as string) || "TATKAL";

  const availableSeats = await redisBookingService.getAvailableSeats(
    trainId,
    journeyDate,
    travelClass,
    quota
  );

  res.status(200).json({
    success: true,
    data: {
      trainId,
      journeyDate,
      travelClass,
      quota,
      availableSeats,
    },
  });
});

export default router;

