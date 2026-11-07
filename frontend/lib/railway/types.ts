/**
 * TatkalPro Domain Types & Contracts
 * Realistic Indian Railways (IRCTC/CRIS) domain model for mock backend & future live integration.
 */

export type TravelClassCode = "1A" | "2A" | "3A" | "SL" | "CC" | "EC" | "2S";

export type QuotaCode =
  | "GENERAL"
  | "TATKAL"
  | "PREMIUM_TATKAL"
  | "LADIES"
  | "SENIOR_CITIZEN"
  | "DIVYANGJAN";

export type AvailabilityStatus = "AVAILABLE" | "RAC" | "WL" | "REGRET";

export interface Station {
  code: string;
  name: string;
  nameHindi: string;
  city: string;
  state: string;
  aliases: string[];
}

export interface RouteStop {
  stationCode: string;
  stationName: string;
  stationNameHindi: string;
  stopSequence: number;
  arrivalTime: string | null;   // "HH:mm"
  departureTime: string | null; // "HH:mm"
  dayOffset: number;
  distanceKm: number;
  platform?: number;
}

export interface ClassFareAndAvailability {
  classCode: TravelClassCode;
  className: string;
  classNameHindi: string;
  baseFare: number;
  tatkalCharge: number;
  superfastCharge: number;
  gstAmount: number;
  pgFee: number;
  totalFare: number;
  status: AvailabilityStatus;
  statusText: string;
  availableSeats: number;
  currentWL?: number;
  currentRAC?: number;
  confirmationProbability?: number; // 0-100%
  confirmationRationale?: string;
  updatedAt: string;
}

export interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  trainNameHindi: string;
  trainType: "VANDE_BHARAT" | "RAJDHANI" | "TEJAS" | "SHATABDI" | "SUPERFAST" | "EXPRESS" | "PASSENGER";
  fromStation: Station;
  toStation: Station;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  dayOffset: number;
  distanceKm: number;
  runningDays: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[];
  hasPantry: boolean;
  onTimePercentage: number;
  stops: RouteStop[];
  classes: Record<QuotaCode, ClassFareAndAvailability[]>;
}

export interface Passenger {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "O";
  berthPreference: "LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER" | "WINDOW" | "NO_PREFERENCE";
  foodPreference?: "VEG" | "NON_VEG" | "NO_FOOD";
  idType?: "AADHAAR" | "PAN" | "PASSPORT" | "VOTER_ID";
  idNumber?: string;
  nationality?: string;
  allocatedCoach?: string;
  allocatedSeat?: string;
}

export interface SeatHold {
  holdToken: string;
  trainNumber: string;
  journeyDate: string;
  classCode: TravelClassCode;
  quota: QuotaCode;
  seatCount: number;
  expiresAt: number; // Unix timestamp
  remainingSeconds: number;
}

export interface BookingDraft {
  draftId: string;
  trainNumber: string;
  trainName: string;
  fromStationCode: string;
  toStationCode: string;
  journeyDate: string;
  classCode: TravelClassCode;
  quota: QuotaCode;
  passengers: Passenger[];
  fareBreakdown: {
    baseFareTotal: number;
    tatkalChargesTotal: number;
    superfastChargesTotal: number;
    gstTotal: number;
    pgFee: number;
    grandTotal: number;
  };
  holdToken?: string;
  holdExpiresAt?: number;
  paymentMethod?: "UPI" | "CARD" | "NETBANKING" | "WALLET";
}

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "INITIATED" | "HOLD_CONFIRMED" | "PROCESSING" | "SUCCESS" | "FAILED" | "RECONCILING" | "REFUNDED";
  gateway: "RAZORPAY_MOCK" | "PAYU_MOCK" | "UPI_INTENT";
  method: "UPI" | "CARD" | "NETBANKING" | "WALLET";
  upiVpa?: string;
  utrNumber?: string;
  failureReason?: string;
  refundId?: string;
  refundUtr?: string;
  refundAmount?: number;
  refundStatus?: "PENDING" | "PROCESSED";
  createdAt: string;
}

export interface BookingRecord {
  pnr: string;
  bookingId: string;
  bookingTime: string;
  trainNumber: string;
  trainName: string;
  fromStation: Station;
  toStation: Station;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  classCode: TravelClassCode;
  quota: QuotaCode;
  status: "CONFIRMED" | "RAC" | "WL" | "CANCELLED";
  chartStatus: "CHART_NOT_PREPARED" | "CHART_PREPARED";
  passengers: Passenger[];
  totalFare: number;
  paymentDetails: PaymentTransaction;
  qrCodeData: string;
}

export interface SplitTicketAlternative {
  intermediateStation: Station;
  leg1: {
    trainNumber: string;
    trainName: string;
    fromCode: string;
    toCode: string;
    departureTime: string;
    arrivalTime: string;
    classCode: TravelClassCode;
    availableSeats: number;
    fare: number;
  };
  leg2: {
    trainNumber: string;
    trainName: string;
    fromCode: string;
    toCode: string;
    departureTime: string;
    arrivalTime: string;
    classCode: TravelClassCode;
    availableSeats: number;
    fare: number;
  };
  layoverMinutes: number;
  totalDurationMinutes: number;
  totalFare: number;
  summary: string;
}

