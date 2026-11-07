import { STATIONS, TRAINS } from "./data";
import {
  Station,
  TrainSchedule,
  QuotaCode,
  TravelClassCode,
  SeatHold,
  BookingDraft,
  BookingRecord,
  PaymentTransaction,
  SplitTicketAlternative,
  Passenger,
} from "./types";

/**
 * Clean Interface Contract for Railway GDS Provider.
 * Real IRCTC or CRIS partner APIs could be plugged in here in production.
 */
export interface IRailwayProvider {
  searchStations(query: string, lang?: "en" | "hi"): Promise<Station[]>;
  searchTrains(fromCode: string, toCode: string, journeyDate: string, quota?: QuotaCode): Promise<TrainSchedule[]>;
  holdSeats(params: {
    trainNumber: string;
    journeyDate: string;
    classCode: TravelClassCode;
    quota: QuotaCode;
    seatCount: number;
    ttlSeconds?: number;
  }): Promise<SeatHold>;
  releaseHold(holdToken: string): Promise<boolean>;
  confirmBooking(params: {
    holdToken: string;
    draft: BookingDraft;
    payment: PaymentTransaction;
  }): Promise<BookingRecord>;
  simulatePayment(params: {
    amount: number;
    method: "UPI" | "CARD" | "NETBANKING" | "WALLET";
    shouldFail?: boolean;
    gateway?: "RAZORPAY_MOCK" | "PAYU_MOCK" | "UPI_INTENT";
  }): Promise<PaymentTransaction>;
  reconcileAndRefund(transactionId: string): Promise<{
    reconciled: boolean;
    refundId: string;
    refundUtr: string;
    amount: number;
    status: "PROCESSED";
    message: string;
  }>;
  getPNRStatus(pnr: string): Promise<BookingRecord | null>;
  findSplitTicketAlternatives(fromCode: string, toCode: string, quota: QuotaCode): Promise<SplitTicketAlternative[]>;
}

// In-memory atomic store for seat holds and bookings
const activeHolds = new Map<string, SeatHold>();
const confirmedBookings = new Map<string, BookingRecord>();

/**
 * Generates fallback Express and Passenger trains for any route,
 * ensuring no route is ever empty and every route has at least 1-2 trains
 * with classes in serial order: SL, 3A, 2A, First Class (1A).
 */
function generateFallbackTrains(srcStation: Station, dstStation: Station): TrainSchedule[] {
  const seed = (srcStation.code + dstStation.code)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const baseKm = 240 + (seed % 950);
  const expHours = Math.max(3, Math.round(baseKm / 60));
  const expMins = (seed * 7) % 60;
  const pasHours = Math.round(expHours * 1.35);

  const expArrHour = (7 + expHours) % 24;
  const pasArrHour = (17 + pasHours) % 24;

  const expressTrain: TrainSchedule = {
    id: `train-exp-${srcStation.code}-${dstStation.code}`,
    trainNumber: `12${(seed % 700 + 100)}`,
    trainName: `${srcStation.name} - ${dstStation.name} Express`,
    trainNameHindi: `${srcStation.nameHindi || srcStation.name} - ${dstStation.nameHindi || dstStation.name} एक्सप्रेस`,
    trainType: "EXPRESS",
    fromStation: srcStation,
    toStation: dstStation,
    departureTime: "07:15",
    arrivalTime: `${expArrHour.toString().padStart(2, "0")}:${((15 + expMins) % 60).toString().padStart(2, "0")}`,
    duration: `${expHours.toString().padStart(2, "0")}h ${expMins.toString().padStart(2, "0")}m`,
    durationMinutes: expHours * 60 + expMins,
    dayOffset: Math.floor((7 + expHours) / 24),
    distanceKm: baseKm,
    runningDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    hasPantry: true,
    onTimePercentage: 94 + (seed % 5),
    stops: [
      {
        stationCode: srcStation.code,
        stationName: srcStation.name,
        stationNameHindi: srcStation.nameHindi || srcStation.name,
        stopSequence: 1,
        arrivalTime: null,
        departureTime: "07:15",
        dayOffset: 0,
        distanceKm: 0,
        platform: 1,
      },
      {
        stationCode: dstStation.code,
        stationName: dstStation.name,
        stationNameHindi: dstStation.nameHindi || dstStation.name,
        stopSequence: 2,
        arrivalTime: `${expArrHour.toString().padStart(2, "0")}:${((15 + expMins) % 60).toString().padStart(2, "0")}`,
        departureTime: null,
        dayOffset: Math.floor((7 + expHours) / 24),
        distanceKm: baseKm,
        platform: 2,
      },
    ],
    classes: {
      GENERAL: [
        {
          classCode: "SL",
          className: "Sleeper Class",
          classNameHindi: "शयनयान श्रेणी",
          baseFare: Math.round(baseKm * 0.42),
          tatkalCharge: 0,
          superfastCharge: 30,
          gstAmount: 0,
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.42) + 45,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 58",
          availableSeats: 58,
          updatedAt: "Just now",
        },
        {
          classCode: "3A",
          className: "AC 3-Tier",
          classNameHindi: "वातानुकूलित 3 टियर",
          baseFare: Math.round(baseKm * 1.15),
          tatkalCharge: 0,
          superfastCharge: 45,
          gstAmount: Math.round((Math.round(baseKm * 1.15) + 45) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.15) + 45 + Math.round((Math.round(baseKm * 1.15) + 45) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 28",
          availableSeats: 28,
          updatedAt: "Just now",
        },
        {
          classCode: "2A",
          className: "AC 2-Tier",
          classNameHindi: "वातानुकूलित 2 टियर",
          baseFare: Math.round(baseKm * 1.65),
          tatkalCharge: 0,
          superfastCharge: 45,
          gstAmount: Math.round((Math.round(baseKm * 1.65) + 45) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.65) + 45 + Math.round((Math.round(baseKm * 1.65) + 45) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 14",
          availableSeats: 14,
          updatedAt: "Just now",
        },
        {
          classCode: "1A",
          className: "First Class",
          classNameHindi: "प्रथम वातानुकूलित श्रेणी",
          baseFare: Math.round(baseKm * 2.8),
          tatkalCharge: 0,
          superfastCharge: 75,
          gstAmount: Math.round((Math.round(baseKm * 2.8) + 75) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 2.8) + 75 + Math.round((Math.round(baseKm * 2.8) + 75) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 06",
          availableSeats: 6,
          updatedAt: "Just now",
        },
      ],
      TATKAL: [
        {
          classCode: "SL",
          className: "Sleeper Class",
          classNameHindi: "शयनयान श्रेणी",
          baseFare: Math.round(baseKm * 0.42),
          tatkalCharge: 100,
          superfastCharge: 30,
          gstAmount: 0,
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.42) + 145,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 24",
          availableSeats: 24,
          updatedAt: "Tatkal Active",
        },
        {
          classCode: "3A",
          className: "AC 3-Tier",
          classNameHindi: "वातानुकूलित 3 टियर",
          baseFare: Math.round(baseKm * 1.15),
          tatkalCharge: Math.round(baseKm * 1.15 * 0.25),
          superfastCharge: 45,
          gstAmount: Math.round((Math.round(baseKm * 1.15) + Math.round(baseKm * 1.15 * 0.25) + 45) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.15) + Math.round(baseKm * 1.15 * 0.25) + 45 + Math.round((Math.round(baseKm * 1.15) + Math.round(baseKm * 1.15 * 0.25) + 45) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 16",
          availableSeats: 16,
          updatedAt: "Tatkal Active",
        },
        {
          classCode: "2A",
          className: "AC 2-Tier",
          classNameHindi: "वातानुकूलित 2 टियर",
          baseFare: Math.round(baseKm * 1.65),
          tatkalCharge: Math.round(baseKm * 1.65 * 0.25),
          superfastCharge: 45,
          gstAmount: Math.round((Math.round(baseKm * 1.65) + Math.round(baseKm * 1.65 * 0.25) + 45) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.65) + Math.round(baseKm * 1.65 * 0.25) + 45 + Math.round((Math.round(baseKm * 1.65) + Math.round(baseKm * 1.65 * 0.25) + 45) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 08",
          availableSeats: 8,
          updatedAt: "Tatkal Active",
        },
        {
          classCode: "1A",
          className: "First Class",
          classNameHindi: "प्रथम श्रेणी",
          baseFare: Math.round(baseKm * 2.8),
          tatkalCharge: Math.round(baseKm * 2.8 * 0.25),
          superfastCharge: 75,
          gstAmount: Math.round((Math.round(baseKm * 2.8) + Math.round(baseKm * 2.8 * 0.25) + 75) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 2.8) + Math.round(baseKm * 2.8 * 0.25) + 75 + Math.round((Math.round(baseKm * 2.8) + Math.round(baseKm * 2.8 * 0.25) + 75) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 04",
          availableSeats: 4,
          updatedAt: "Tatkal Active",
        },
      ],
      PREMIUM_TATKAL: [],
      LADIES: [],
      SENIOR_CITIZEN: [],
      DIVYANGJAN: [],
    },
  };

  const passengerTrain: TrainSchedule = {
    id: `train-pas-${srcStation.code}-${dstStation.code}`,
    trainNumber: `54${(seed % 700 + 200)}`,
    trainName: `${srcStation.name} - ${dstStation.name} Fast Passenger`,
    trainNameHindi: `${srcStation.nameHindi || srcStation.name} - ${dstStation.nameHindi || dstStation.name} पैसेंजर`,
    trainType: "PASSENGER",
    fromStation: srcStation,
    toStation: dstStation,
    departureTime: "17:45",
    arrivalTime: `${pasArrHour.toString().padStart(2, "0")}:${((45 + expMins) % 60).toString().padStart(2, "0")}`,
    duration: `${pasHours.toString().padStart(2, "0")}h ${expMins.toString().padStart(2, "0")}m`,
    durationMinutes: pasHours * 60 + expMins,
    dayOffset: Math.floor((17 + pasHours) / 24),
    distanceKm: baseKm,
    runningDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    hasPantry: false,
    onTimePercentage: 92,
    stops: [
      {
        stationCode: srcStation.code,
        stationName: srcStation.name,
        stationNameHindi: srcStation.nameHindi || srcStation.name,
        stopSequence: 1,
        arrivalTime: null,
        departureTime: "17:45",
        dayOffset: 0,
        distanceKm: 0,
        platform: 3,
      },
      {
        stationCode: dstStation.code,
        stationName: dstStation.name,
        stationNameHindi: dstStation.nameHindi || dstStation.name,
        stopSequence: 2,
        arrivalTime: `${pasArrHour.toString().padStart(2, "0")}:${((45 + expMins) % 60).toString().padStart(2, "0")}`,
        departureTime: null,
        dayOffset: Math.floor((17 + pasHours) / 24),
        distanceKm: baseKm,
        platform: 1,
      },
    ],
    classes: {
      GENERAL: [
        {
          classCode: "SL",
          className: "Sleeper Class",
          classNameHindi: "शयनयान श्रेणी",
          baseFare: Math.round(baseKm * 0.28),
          tatkalCharge: 0,
          superfastCharge: 0,
          gstAmount: 0,
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.28) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 95",
          availableSeats: 95,
          updatedAt: "Just now",
        },
        {
          classCode: "3A",
          className: "AC 3-Tier",
          classNameHindi: "वातानुकूलित 3 टियर",
          baseFare: Math.round(baseKm * 0.78),
          tatkalCharge: 0,
          superfastCharge: 0,
          gstAmount: Math.round(Math.round(baseKm * 0.78) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.78) + Math.round(Math.round(baseKm * 0.78) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 42",
          availableSeats: 42,
          updatedAt: "Just now",
        },
        {
          classCode: "2A",
          className: "AC 2-Tier",
          classNameHindi: "वातानुकूलित 2 टियर",
          baseFare: Math.round(baseKm * 1.18),
          tatkalCharge: 0,
          superfastCharge: 0,
          gstAmount: Math.round(Math.round(baseKm * 1.18) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.18) + Math.round(Math.round(baseKm * 1.18) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 18",
          availableSeats: 18,
          updatedAt: "Just now",
        },
        {
          classCode: "1A",
          className: "First Class",
          classNameHindi: "प्रथम श्रेणी",
          baseFare: Math.round(baseKm * 1.95),
          tatkalCharge: 0,
          superfastCharge: 0,
          gstAmount: Math.round(Math.round(baseKm * 1.95) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 1.95) + Math.round(Math.round(baseKm * 1.95) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 06",
          availableSeats: 6,
          updatedAt: "Just now",
        },
      ],
      TATKAL: [
        {
          classCode: "SL",
          className: "Sleeper Class",
          classNameHindi: "शयनयान श्रेणी",
          baseFare: Math.round(baseKm * 0.28),
          tatkalCharge: 50,
          superfastCharge: 0,
          gstAmount: 0,
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.28) + 65,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 35",
          availableSeats: 35,
          updatedAt: "Tatkal Active",
        },
        {
          classCode: "3A",
          className: "AC 3-Tier",
          classNameHindi: "वातानुकूलित 3 टियर",
          baseFare: Math.round(baseKm * 0.78),
          tatkalCharge: Math.round(baseKm * 0.78 * 0.25),
          superfastCharge: 0,
          gstAmount: Math.round((Math.round(baseKm * 0.78) + Math.round(baseKm * 0.78 * 0.25)) * 0.05),
          pgFee: 15,
          totalFare: Math.round(baseKm * 0.78) + Math.round(baseKm * 0.78 * 0.25) + Math.round((Math.round(baseKm * 0.78) + Math.round(baseKm * 0.78 * 0.25)) * 0.05) + 15,
          status: "AVAILABLE",
          statusText: "AVAILABLE - 16",
          availableSeats: 16,
          updatedAt: "Tatkal Active",
        },
      ],
      PREMIUM_TATKAL: [],
      LADIES: [],
      SENIOR_CITIZEN: [],
      DIVYANGJAN: [],
    },
  };

  return [expressTrain, passengerTrain];
}

/**
 * Production-Grade Mock Railway Adapter
 * Provides high-fidelity simulation of Indian Railways Tatkal mechanics.
 */
export class MockRailwayAdapter implements IRailwayProvider {
  /**
   * Fuzzy station search in English, Hindi, and station code.
   */
  async searchStations(query: string, lang: "en" | "hi" = "en"): Promise<Station[]> {
    const q = query.trim().toLowerCase();
    if (!q) return STATIONS.slice(0, 8);

    return STATIONS.filter((station) => {
      return (
        station.code.toLowerCase().includes(q) ||
        station.name.toLowerCase().includes(q) ||
        station.nameHindi.includes(q) ||
        station.city.toLowerCase().includes(q) ||
        station.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Searches trains running between two stations.
   * Performs direct stop sequence matching, metropolitan terminal alias clustering,
   * and fallback schedule generation so that EVERY route has at least 1-2 trains available.
   */
  async searchTrains(
    fromCode: string,
    toCode: string,
    journeyDate: string,
    quota: QuotaCode = "TATKAL"
  ): Promise<TrainSchedule[]> {
    const src = fromCode.trim().toUpperCase();
    const dst = toCode.trim().toUpperCase();

    const srcStation = STATIONS.find((s) => s.code === src) || {
      code: src,
      name: src,
      nameHindi: src,
      city: src,
      state: "India",
      aliases: [src.toLowerCase()],
    };

    const dstStation = STATIONS.find((s) => s.code === dst) || {
      code: dst,
      name: dst,
      nameHindi: dst,
      city: dst,
      state: "India",
      aliases: [dst.toLowerCase()],
    };

    // 1. Direct route match: train visits source before destination in stops
    let matched = TRAINS.filter((train) => {
      const srcIdx = train.stops.findIndex((s) => s.stationCode === src);
      const dstIdx = train.stops.findIndex((s) => s.stationCode === dst);
      return srcIdx !== -1 && dstIdx !== -1 && srcIdx < dstIdx;
    });

    // 2. City-level terminal alias matching (e.g. Delhi terminals NDLS/NZM/DLI to Mumbai terminals MMCT/CSMT/BDTS)
    if (matched.length === 0 && srcStation.city !== dstStation.city) {
      matched = TRAINS.filter((train) => {
        const srcIdx = train.stops.findIndex((stop) => {
          const st = STATIONS.find((s) => s.code === stop.stationCode);
          return st?.city === srcStation.city;
        });
        const dstIdx = train.stops.findIndex((stop) => {
          const st = STATIONS.find((s) => s.code === stop.stationCode);
          return st?.city === dstStation.city;
        });
        return srcIdx !== -1 && dstIdx !== -1 && srcIdx < dstIdx;
      });
    }

    // 3. Availability Engine:
    // Ensures that EVERY route has at least 1-2 trains available (Express + Passenger),
    // and nothing is ever empty!
    if (matched.length === 0) {
      const fallbacks = generateFallbackTrains(srcStation, dstStation);
      matched = fallbacks;
    } else if (matched.length === 1) {
      // If only 1 train is available, add a complementary Passenger train so user has 2 options
      const fallbacks = generateFallbackTrains(srcStation, dstStation);
      matched = [matched[0], fallbacks[1]]; // Pair with Passenger train
    }

    // Ensure all classes on matched trains are in serial order: SL, 3A, 2A, First Class (1A)
    const serial: Record<string, number> = { SL: 1, "3A": 2, "2A": 3, "1A": 4, CC: 5, EC: 6, "2S": 7 };
    matched.forEach((t) => {
      Object.keys(t.classes).forEach((qKey) => {
        const qList = (t.classes as any)[qKey];
        if (Array.isArray(qList)) {
          qList.sort((a, b) => (serial[a.classCode] || 99) - (serial[b.classCode] || 99));
        }
      });
    });

    return matched;
  }

  /**
   * Holds seats with a Redis-style TTL (default 8 minutes = 480 seconds).
   * Prevents seat stealing during captcha solving and payment.
   */
  async holdSeats(params: {
    trainNumber: string;
    journeyDate: string;
    classCode: TravelClassCode;
    quota: QuotaCode;
    seatCount: number;
    ttlSeconds?: number;
  }): Promise<SeatHold> {
    const { trainNumber, journeyDate, classCode, quota, seatCount, ttlSeconds = 480 } = params;

    const holdToken = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const hold: SeatHold = {
      holdToken,
      trainNumber,
      journeyDate,
      classCode,
      quota,
      seatCount,
      expiresAt,
      remainingSeconds: ttlSeconds,
    };

    activeHolds.set(holdToken, hold);
    return hold;
  }

  /**
   * Releases an unconfirmed seat hold.
   */
  async releaseHold(holdToken: string): Promise<boolean> {
    return activeHolds.delete(holdToken);
  }

  /**
   * Atomically commits a booking and issues a genuine 10-digit PNR.
   */
  async confirmBooking(params: {
    holdToken: string;
    draft: BookingDraft;
    payment: PaymentTransaction;
  }): Promise<BookingRecord> {
    const { holdToken, draft, payment } = params;

    // Stateless seat hold verification: checks TTL if hold has timestamp, or checks in-memory hold if present
    let isExpired = false;
    if (holdToken) {
      if (activeHolds.has(holdToken)) {
        const memoryHold = activeHolds.get(holdToken)!;
        if (memoryHold.expiresAt && Date.now() > memoryHold.expiresAt) {
          isExpired = true;
          activeHolds.delete(holdToken);
        }
      } else if (holdToken.startsWith("hold_")) {
        const parts = holdToken.split("_");
        const tokenTime = parseInt(parts[1], 10);
        // Valid timestamp older than 8 minutes (480,000ms) is expired
        if (!isNaN(tokenTime) && tokenTime > 1000000000000) {
          if (Date.now() - tokenTime > 8 * 60 * 1000) {
            isExpired = true;
          }
        }
      }
    }

    if (isExpired) {
      throw new Error("Seat hold has expired. Please select your seats again.");
    }

    // Generate unique 10-digit Indian Railways PNR (e.g. 8203948571)
    const pnrPrefix = Math.floor(100 + Math.random() * 900); // Zone identifier
    const pnrSuffix = Math.floor(1000000 + Math.random() * 9000000);
    const pnr = `${pnrPrefix}${pnrSuffix}`;

    // Allocate coach and berth (e.g. B2-18, B2-19)
    const coachPrefix = draft.classCode === "SL" ? "S" : draft.classCode === "2A" ? "A" : draft.classCode === "1A" ? "H" : "B";
    const coachNumber = `${coachPrefix}${Math.floor(1 + Math.random() * 6)}`;

    const passengersWithBerths: Passenger[] = draft.passengers.map((p, idx) => {
      const seatNum = Math.floor(12 + idx * 2);
      const berth = p.berthPreference !== "NO_PREFERENCE" ? p.berthPreference : idx % 2 === 0 ? "LOWER" : "UPPER";
      return {
        ...p,
        allocatedCoach: coachNumber,
        allocatedSeat: `${coachNumber}-${seatNum} (${berth})`,
      };
    });

    const fromStation = STATIONS.find((s) => s.code === draft.fromStationCode) || STATIONS[0];
    const toStation = STATIONS.find((s) => s.code === draft.toStationCode) || STATIONS[1];

    const booking: BookingRecord = {
      pnr,
      bookingId: `BK_${Date.now()}_${pnrSuffix.toString().substring(0, 4)}`,
      bookingTime: new Date().toISOString(),
      trainNumber: draft.trainNumber,
      trainName: draft.trainName,
      fromStation,
      toStation,
      journeyDate: draft.journeyDate,
      departureTime: "16:55",
      arrivalTime: "08:35",
      classCode: draft.classCode,
      quota: draft.quota,
      status: "CONFIRMED",
      chartStatus: "CHART_NOT_PREPARED",
      passengers: passengersWithBerths,
      totalFare: draft.fareBreakdown.grandTotal,
      paymentDetails: payment,
      qrCodeData: `IRCTC|PNR:${pnr}|TRAIN:${draft.trainNumber}|DOJ:${draft.journeyDate}|STATUS:CONFIRMED|CLASS:${draft.classCode}|PASSENGERS:${passengersWithBerths.length}`,
    };

    confirmedBookings.set(pnr, booking);
    activeHolds.delete(holdToken);

    return booking;
  }

  /**
   * Multi-gateway payment simulator. Supports intentional failure to demo auto-fallback
   * and auto-refund reconciliation.
   */
  async simulatePayment(params: {
    amount: number;
    method: "UPI" | "CARD" | "NETBANKING" | "WALLET";
    shouldFail?: boolean;
    gateway?: "RAZORPAY_MOCK" | "PAYU_MOCK" | "UPI_INTENT";
  }): Promise<PaymentTransaction> {
    const { amount, method, shouldFail = false, gateway = "UPI_INTENT" } = params;

    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const orderId = `ORD_${Math.floor(100000 + Math.random() * 900000)}`;

    if (shouldFail) {
      return {
        transactionId,
        orderId,
        amount,
        currency: "INR",
        status: "FAILED",
        gateway,
        method,
        failureReason: "Bank Gateway Timeout / Network Disruption during 10:00 AM rush.",
        createdAt: new Date().toISOString(),
      };
    }

    const utrNumber = `3${Math.floor(10000000000 + Math.random() * 90000000000)}`;

    return {
      transactionId,
      orderId,
      amount,
      currency: "INR",
      status: "SUCCESS",
      gateway,
      method,
      upiVpa: method === "UPI" ? "user@okaxis" : undefined,
      utrNumber,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Automatic reconciliation and auto-refund engine for failed payments.
   */
  async reconcileAndRefund(transactionId: string): Promise<{
    reconciled: boolean;
    refundId: string;
    refundUtr: string;
    amount: number;
    status: "PROCESSED";
    message: string;
  }> {
    const refundId = `RFD_${Date.now()}`;
    const refundUtr = `RBIP_${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return {
      reconciled: true,
      refundId,
      refundUtr,
      amount: 1540,
      status: "PROCESSED",
      message: "Payment successfully reconciled with banking switch. 100% refund initiated to source UPI account within 2 minutes.",
    };
  }

  /**
   * Looks up PNR status and current chart state.
   */
  async getPNRStatus(pnr: string): Promise<BookingRecord | null> {
    const cleanPnr = pnr.replace(/[\s-]/g, "");
    if (confirmedBookings.has(cleanPnr)) {
      return confirmedBookings.get(cleanPnr)!;
    }

    // Return a realistic simulated PNR for any requested valid 10-digit number
    if (/^\d{10}$/.test(cleanPnr)) {
      return {
        pnr: cleanPnr,
        bookingId: `BK_${cleanPnr.substring(0, 6)}`,
        bookingTime: "2026-11-03T10:00:14Z",
        trainNumber: "12952",
        trainName: "Mumbai Rajdhani Express",
        fromStation: STATIONS[0],
        toStation: STATIONS[1],
        journeyDate: "2026-11-10",
        departureTime: "16:55",
        arrivalTime: "08:35",
        classCode: "3A",
        quota: "TATKAL",
        status: "CONFIRMED",
        chartStatus: "CHART_NOT_PREPARED",
        passengers: [
          {
            id: "p1",
            name: "Rahul Sharma",
            age: 32,
            gender: "M",
            berthPreference: "LOWER",
            allocatedCoach: "B2",
            allocatedSeat: "B2-19 (LOWER)",
          },
        ],
        totalFare: 2708,
        paymentDetails: {
          transactionId: `TXN_${cleanPnr}`,
          orderId: `ORD_${cleanPnr.substring(4)}`,
          amount: 2708,
          currency: "INR",
          status: "SUCCESS",
          gateway: "UPI_INTENT",
          method: "UPI",
          utrNumber: "329048104829",
          createdAt: "2026-11-03T10:00:14Z",
        },
        qrCodeData: `IRCTC|PNR:${cleanPnr}|TRAIN:12952|STATUS:CONFIRMED|COACH:B2-19`,
      };
    }

    return null;
  }

  /**
   * Split-Ticket Graph Algorithm: Discovers confirmed 2-leg routes via intermediate stations.
   */
  async findSplitTicketAlternatives(
    fromCode: string,
    toCode: string,
    quota: QuotaCode = "TATKAL"
  ): Promise<SplitTicketAlternative[]> {
    const src = fromCode.trim().toUpperCase();
    const dst = toCode.trim().toUpperCase();
    const srcStation = STATIONS.find((s) => s.code === src);
    const dstStation = STATIONS.find((s) => s.code === dst);

    const isDelhi = src === "NDLS" || src === "NZM" || src === "DLI" || srcStation?.city === "Delhi";
    const isMumbai = dst === "MMCT" || dst === "CSMT" || dst === "BDTS" || dstStation?.city === "Mumbai";
    const isKolkata = dst === "HWH" || dst === "SDAH" || dstStation?.city === "Kolkata";
    const isBengaluru = dst === "SBC" || dst === "YPR" || dstStation?.city === "Bengaluru";

    if (isDelhi && isMumbai) {
      const intermediateKota = STATIONS.find((s) => s.code === "KOTA") || STATIONS[6];
      const intermediateBpl = STATIONS.find((s) => s.code === "BPL") || STATIONS[7];

      return [
        {
          intermediateStation: intermediateKota,
          leg1: {
            trainNumber: "12952",
            trainName: "Mumbai Rajdhani Express",
            fromCode: "NDLS",
            toCode: "KOTA",
            departureTime: "16:55",
            arrivalTime: "21:30",
            classCode: "3A",
            availableSeats: 12,
            fare: 1080,
          },
          leg2: {
            trainNumber: "12954",
            trainName: "August Kranti Tejas Rajdhani",
            fromCode: "KOTA",
            toCode: "MMCT",
            departureTime: "22:55",
            arrivalTime: "10:05",
            classCode: "3A",
            availableSeats: 16,
            fare: 1580,
          },
          layoverMinutes: 85,
          totalDurationMinutes: 1030,
          totalFare: 2660,
          summary: `Take Train 12952 from NDLS to KOTA (12 seats available), transfer platforms during a comfortable 1h 25m layover, then board Train 12954 to MMCT (16 seats available). Both legs have seats available now!`,
        },
        {
          intermediateStation: intermediateBpl,
          leg1: {
            trainNumber: "12904",
            trainName: "Golden Temple Mail",
            fromCode: "NDLS",
            toCode: "BPL",
            departureTime: "07:20",
            arrivalTime: "17:40",
            classCode: "3A",
            availableSeats: 8,
            fare: 920,
          },
          leg2: {
            trainNumber: "12138",
            trainName: "Punjab Mail",
            fromCode: "BPL",
            toCode: "MMCT",
            departureTime: "19:15",
            arrivalTime: "07:35",
            classCode: "3A",
            availableSeats: 14,
            fare: 1480,
          },
          layoverMinutes: 95,
          totalDurationMinutes: 1455,
          totalFare: 2400,
          summary: `Take Train 12904 from NDLS to Bhopal, enjoy a 1h 35m layover, then take Train 12138 to MMCT. Confirmed seats available on both segments.`,
        },
      ];
    }

    if (isDelhi && isKolkata) {
      const intermediateCnb = STATIONS.find((s) => s.code === "CNB") || STATIONS[15];
      return [
        {
          intermediateStation: intermediateCnb,
          leg1: {
            trainNumber: "12004",
            trainName: "Lucknow Swarna Shatabdi",
            fromCode: "NDLS",
            toCode: "CNB",
            departureTime: "06:10",
            arrivalTime: "11:20",
            classCode: "CC",
            availableSeats: 24,
            fare: 980,
          },
          leg2: {
            trainNumber: "12304",
            trainName: "Poorva Express",
            fromCode: "CNB",
            toCode: "HWH",
            departureTime: "13:00",
            arrivalTime: "06:40",
            classCode: "3A",
            availableSeats: 18,
            fare: 1420,
          },
          layoverMinutes: 100,
          totalDurationMinutes: 1470,
          totalFare: 2400,
          summary: `Take Train 12004 from NDLS to Kanpur Central (24 seats available), enjoy 1h 40m layover, then board Poorva Express 12304 to Howrah (18 seats available). Seats available on both legs!`,
        },
      ];
    }

    if (isDelhi && isBengaluru) {
      const intermediateNgp = STATIONS.find((s) => s.code === "NGP") || STATIONS[20];
      return [
        {
          intermediateStation: intermediateNgp,
          leg1: {
            trainNumber: "12616",
            trainName: "Grand Trunk Express",
            fromCode: "NDLS",
            toCode: "NGP",
            departureTime: "16:10",
            arrivalTime: "07:20",
            classCode: "3A",
            availableSeats: 15,
            fare: 1520,
          },
          leg2: {
            trainNumber: "22692",
            trainName: "Bengaluru Rajdhani Express",
            fromCode: "NGP",
            toCode: "SBC",
            departureTime: "09:30",
            arrivalTime: "05:20",
            classCode: "3A",
            availableSeats: 9,
            fare: 1850,
          },
          layoverMinutes: 130,
          totalDurationMinutes: 2230,
          totalFare: 3370,
          summary: `Take Grand Trunk Express 12616 to Nagpur (15 seats available), smooth 2h 10m platform transfer, then board Bengaluru Rajdhani 22692 to KSR Bengaluru. Confirmed travel on busy corridor!`,
        },
      ];
    }

    return [];
  }
}

export const railwayProvider: IRailwayProvider = new MockRailwayAdapter();
export default railwayProvider;

