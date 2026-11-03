import { z } from "zod";

/**
 * Passenger schema for railway booking.
 * In accordance with Tatkal rules, max 4 passengers are allowed per booking.
 */
export const PassengerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Passenger name must be at least 2 characters long." })
    .max(80, { message: "Passenger name cannot exceed 80 characters." }),
  age: z
    .number()
    .int({ message: "Age must be an integer." })
    .min(1, { message: "Age must be at least 1." })
    .max(125, { message: "Age cannot exceed 125." }),
  gender: z.enum(["M", "F", "O"], {
    errorMap: () => ({ message: "Gender must be 'M', 'F', or 'O'." }),
  }),
  berthPreference: z
    .enum(["LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "WINDOW", "NO_PREFERENCE"])
    .optional()
    .default("NO_PREFERENCE"),
});

/**
 * Supported travel classes for Indian Railways
 */
export const TravelClassEnum = z.enum(["1A", "2A", "3A", "SL", "CC", "EC"]);

/**
 * Supported quotas
 */
export const QuotaEnum = z.enum(["TATKAL", "PREMIUM_TATKAL", "GENERAL"]);

/**
 * Zod schema for POST /api/book endpoint
 */
export const BookingPayloadSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(10, { message: "Idempotency key must be at least 10 characters." })
    .max(64, { message: "Idempotency key cannot exceed 64 characters." }),
  userId: z
    .string()
    .trim()
    .min(1, { message: "userId is required." }),
  trainId: z
    .string()
    .trim()
    .min(1, { message: "trainId is required." }),
  fromStationCode: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .transform((val) => val.toUpperCase()),
  toStationCode: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .transform((val) => val.toUpperCase()),
  journeyDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "journeyDate must be in YYYY-MM-DD format." }),
  travelClass: TravelClassEnum,
  quota: QuotaEnum.default("TATKAL"),
  passengers: z
    .array(PassengerSchema)
    .min(1, { message: "At least 1 passenger is required." })
    .max(4, { message: "IRCTC Tatkal rules limit maximum 4 passengers per booking transaction." }),
  farePerSeat: z
    .number()
    .positive({ message: "farePerSeat must be a positive number." })
    .optional()
    .default(1250.0),
});

export type BookingPayload = z.infer<typeof BookingPayloadSchema>;
export type PassengerInput = z.infer<typeof PassengerSchema>;

