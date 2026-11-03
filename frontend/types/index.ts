/**
 * TypeScript Data Models for Tatkal/IRCTC Next-Gen Railway Booking
 */

export type TravelClassCode = "1A" | "2A" | "3A" | "SL" | "CC" | "EC";

export type QuotaType = "GENERAL" | "TATKAL" | "PREMIUM_TATKAL" | "LADIES";

export type SeatAvailabilityStatus = "AVAILABLE" | "RAC" | "WL" | "REGRET";

export interface ClassAvailability {
  classCode: TravelClassCode;
  className: string;
  fare: number;
  status: SeatAvailabilityStatus;
  statusText: string; // e.g. "AVAILABLE - 24", "WL 12", "RAC 6", "REGRET"
  availableSeats: number;
  updatedAt: string;
}

export interface Station {
  code: string;
  name: string;
  city: string;
  state?: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: "VANDE_BHARAT" | "RAJDHANI" | "SHATABDI" | "TEJAS" | "SUPERFAST" | "EXPRESS";
  fromStation: Station;
  toStation: Station;
  departureTime: string; // "16:55"
  arrivalTime: string;   // "08:35"
  duration: string;      // "15h 40m"
  dayOffset: number;     // 0 = same day, 1 = next day
  runningDays: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[];
  classes: ClassAvailability[];
  hasPantry: boolean;
  onTimePercentage: number;
}

export interface SearchQueryParams {
  fromStation: string;
  toStation: string;
  journeyDate: string;
  quota: QuotaType;
  selectedClass?: TravelClassCode;
}

export interface FilterState {
  departureTime: string[]; // "morning", "afternoon", "evening", "night"
  classes: TravelClassCode[];
  trainTypes: string[];
  sortBy: "departure" | "duration" | "availability";
}
