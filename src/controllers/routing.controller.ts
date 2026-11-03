import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { findSplitTicketJourney, TrainScheduleInfo } from "../algorithms/splitTicket";
import { ValidationError } from "../errors/customErrors";

const RouteQuerySchema = z.object({
  source: z.string().trim().min(2).max(6).toUpperCase(),
  destination: z.string().trim().min(2).max(6).toUpperCase(),
  seats: z.coerce.number().int().positive().default(1),
  minLayoverMinutes: z.coerce.number().int().min(10).max(360).default(30),
  maxLayoverMinutes: z.coerce.number().int().min(60).max(720).default(360),
});

/**
 * Controller to search direct and split-ticket journeys
 */
export async function searchRoutesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const parseResult = RouteQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return next(
      new ValidationError("Invalid route search parameters.", {
        issues: parseResult.error.issues,
      })
    );
  }

  const { source, destination, seats, minLayoverMinutes, maxLayoverMinutes } = parseResult.data;

  // Mock network data representing high-traffic Indian Railways corridors
  // (e.g. New Delhi -> Kota -> Vadodara -> Mumbai Central)
  const networkTrains: TrainScheduleInfo[] = [
    {
      trainId: "train-12952",
      trainNumber: "12952",
      trainName: "New Delhi - Mumbai Rajdhani Express",
      stops: [
        { stationCode: "NDLS", stopSequence: 1, arrivalTime: null, departureTime: "16:55", dayOffset: 0 },
        { stationCode: "KOTA", stopSequence: 2, arrivalTime: "21:30", departureTime: "21:40", dayOffset: 0 },
        { stationCode: "BRC", stopSequence: 3, arrivalTime: "03:20", departureTime: "03:30", dayOffset: 1 },
        { stationCode: "MMCT", stopSequence: 4, arrivalTime: "08:35", departureTime: null, dayOffset: 1 },
      ],
      // Simulated direct seats: 0 (Sold out/Tatkal WL), but NDLS->KOTA has 8 seats
      availableSeats: (from, to) => {
        if (from === "NDLS" && to === "MMCT") return 0; // Direct is FULL
        if (from === "NDLS" && to === "KOTA") return 8; // Available intermediate
        return 0;
      },
    },
    {
      trainId: "train-12954",
      trainNumber: "12954",
      trainName: "August Kranti Tejas Rajdhani",
      stops: [
        { stationCode: "NZM", stopSequence: 1, arrivalTime: null, departureTime: "17:15", dayOffset: 0 },
        { stationCode: "KOTA", stopSequence: 2, arrivalTime: "22:45", departureTime: "22:55", dayOffset: 0 },
        { stationCode: "ST", stopSequence: 3, arrivalTime: "06:10", departureTime: "06:15", dayOffset: 1 },
        { stationCode: "MMCT", stopSequence: 4, arrivalTime: "10:05", departureTime: null, dayOffset: 1 },
      ],
      // KOTA->MMCT has 12 seats available
      availableSeats: (from, to) => {
        if (from === "KOTA" && to === "MMCT") return 12;
        return 0;
      },
    },
    {
      trainId: "train-12904",
      trainNumber: "12904",
      trainName: "Golden Temple Mail",
      stops: [
        { stationCode: "NDLS", stopSequence: 1, arrivalTime: null, departureTime: "07:20", dayOffset: 0 },
        { stationCode: "BPL", stopSequence: 2, arrivalTime: "17:40", departureTime: "17:50", dayOffset: 0 },
        { stationCode: "MMCT", stopSequence: 3, arrivalTime: "05:20", departureTime: null, dayOffset: 1 },
      ],
      availableSeats: (from, to) => {
        if (from === "NDLS" && to === "BPL") return 5;
        return 0;
      },
    },
    {
      trainId: "train-12138",
      trainNumber: "12138",
      trainName: "Punjab Mail",
      stops: [
        { stationCode: "BPL", stopSequence: 1, arrivalTime: null, departureTime: "19:10", dayOffset: 0 },
        { stationCode: "BSL", stopSequence: 2, arrivalTime: "01:25", departureTime: "01:30", dayOffset: 1 },
        { stationCode: "MMCT", stopSequence: 3, arrivalTime: "07:35", departureTime: null, dayOffset: 1 },
      ],
      availableSeats: (from, to) => {
        if (from === "BPL" && to === "MMCT") return 15;
        return 0;
      },
    },
  ];

  const routingResult = findSplitTicketJourney(source, destination, networkTrains, {
    minLayoverMinutes,
    maxLayoverMinutes,
    requestedSeats: seats,
  });

  res.status(200).json({
    success: true,
    data: routingResult,
  });
}

