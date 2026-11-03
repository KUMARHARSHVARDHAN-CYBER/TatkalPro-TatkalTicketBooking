/**
 * Split-Ticket Graph Algorithm for Tatkal Railway Reservation
 *
 * Problem Statement:
 * During peak Tatkal rush (10:00 AM), direct tickets on popular routes (e.g., New Delhi -> Mumbai)
 * exhaust within seconds, leading to immediate Waitlist. However, intermediate quotas often
 * have vacant seats (e.g., New Delhi -> Kota on Train A, and Kota -> Mumbai on Train B).
 *
 * This utility:
 * 1. Checks if any direct train has confirmed seats.
 * 2. If direct seats are exhausted (0 available or WL), builds a directed railway network graph.
 * 3. Uses a modified Dijkstra's / Priority Search algorithm to find optimal two-leg journeys:
 *    Source (S) -> Intermediate Station (X) -> Destination (D)
 * 4. Strictly validates:
 *    - Both Leg 1 and Leg 2 have confirmed seats (availableSeats >= requestedSeats).
 *    - Connection time at Station X satisfies MIN_LAYOVER_MINUTES <= layover <= MAX_LAYOVER_MINUTES.
 *    - Leg 1 Train != Leg 2 Train (or different departure service).
 *    - Minimized total journey duration and passenger transfer friction.
 */

export interface TrainStopSchedule {
  stationCode: string;
  stationName?: string;
  stopSequence: number;
  arrivalTime: string | null;   // "HH:mm" (24-hour). Null for origin
  departureTime: string | null; // "HH:mm" (24-hour). Null for final destination
  dayOffset: number;            // 0 = Day 1, 1 = Day 2 (+24h), etc.
}

export interface TrainScheduleInfo {
  trainId: string;
  trainNumber: string;
  trainName: string;
  stops: TrainStopSchedule[];
  // Segment-level or train-level seat availability for the given date/class
  // Key: `${fromStation}->${toStation}` or direct lookup function
  availableSeats: number | ((from: string, to: string) => number);
}

export interface JourneyLeg {
  legNumber: 1 | 2;
  trainId: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  departureDayOffset: number;
  arrivalDayOffset: number;
  durationMinutes: number;
  availableSeats: number;
}

export interface SplitTicketOption {
  type: "SPLIT_TICKET";
  source: string;
  destination: string;
  intermediateStation: string;
  leg1: JourneyLeg;
  leg2: JourneyLeg;
  layoverMinutes: number;
  totalDurationMinutes: number;
  summary: string;
}

export interface DirectJourneyOption {
  type: "DIRECT";
  source: string;
  destination: string;
  trainId: string;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  departureDayOffset: number;
  arrivalDayOffset: number;
  durationMinutes: number;
  availableSeats: number;
}

export interface RoutingResult {
  hasDirectSeats: boolean;
  directOptions: DirectJourneyOption[];
  splitTicketOptions: SplitTicketOption[];
  message: string;
}

export interface SplitTicketOptions {
  minLayoverMinutes?: number;  // Default: 30 minutes (minimum safe platform transfer)
  maxLayoverMinutes?: number;  // Default: 360 minutes (6 hours maximum layover)
  maxResults?: number;         // Default: 3 best routes
  requestedSeats?: number;     // Default: 1
}

// ---------------------------------------------------------------------------
// Time Conversion Utilities
// ---------------------------------------------------------------------------

/**
 * Converts "HH:mm" and day offset into cumulative minutes from Day 1 00:00
 */
export function timeToMinutes(timeStr: string, dayOffset: number = 0): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return dayOffset * 24 * 60 + hours * 60 + minutes;
}

/**
 * Converts cumulative minutes back to formatted "HH:mm (+Xd)"
 */
export function minutesToFormattedTime(totalMinutes: number): { time: string; dayOffset: number } {
  const dayOffset = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  const time = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  return { time, dayOffset };
}

// ---------------------------------------------------------------------------
// Helper: Helper to query seat availability
// ---------------------------------------------------------------------------
function getSeatCount(
  train: TrainScheduleInfo,
  fromStation: string,
  toStation: string
): number {
  if (typeof train.availableSeats === "function") {
    return train.availableSeats(fromStation, toStation);
  }
  return train.availableSeats;
}

// ---------------------------------------------------------------------------
// Graph Edge & Dijkstra Search Structures
// ---------------------------------------------------------------------------

interface GraphSegment {
  train: TrainScheduleInfo;
  fromStop: TrainStopSchedule;
  toStop: TrainStopSchedule;
  departureMinutes: number;
  arrivalMinutes: number;
  durationMinutes: number;
  availableSeats: number;
}

/**
 * Min-Priority Queue for Dijkstra exploration
 */
class MinPriorityQueue<T> {
  private items: { priority: number; value: T }[] = [];

  enqueue(value: T, priority: number): void {
    this.items.push({ priority, value });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// ---------------------------------------------------------------------------
// Core Split-Ticket Graph Algorithm
// ---------------------------------------------------------------------------

/**
 * Finds direct or two-leg split-ticket options between source and destination.
 *
 * @param source Source station code (e.g. "NDLS")
 * @param destination Destination station code (e.g. "BCT")
 * @param trains List of all trains and their stop schedules in the network
 * @param options Routing constraints (layover window, seats requested, result limit)
 */
export function findSplitTicketJourney(
  source: string,
  destination: string,
  trains: TrainScheduleInfo[],
  options: SplitTicketOptions = {}
): RoutingResult {
  const {
    minLayoverMinutes = 30,
    maxLayoverMinutes = 360,
    maxResults = 3,
    requestedSeats = 1,
  } = options;

  const src = source.trim().toUpperCase();
  const dst = destination.trim().toUpperCase();

  if (src === dst) {
    return {
      hasDirectSeats: false,
      directOptions: [],
      splitTicketOptions: [],
      message: "Source and destination stations cannot be identical.",
    };
  }

  // =========================================================================
  // STEP 1: Direct Train Seat Availability Check
  // =========================================================================
  const directOptions: DirectJourneyOption[] = [];

  for (const train of trains) {
    const srcIndex = train.stops.findIndex((s) => s.stationCode.toUpperCase() === src);
    const dstIndex = train.stops.findIndex((s) => s.stationCode.toUpperCase() === dst);

    // Train must visit source before destination
    if (srcIndex !== -1 && dstIndex !== -1 && srcIndex < dstIndex) {
      const srcStop = train.stops[srcIndex];
      const dstStop = train.stops[dstIndex];

      const departureStr = srcStop.departureTime || "00:00";
      const arrivalStr = dstStop.arrivalTime || "00:00";

      const depMin = timeToMinutes(departureStr, srcStop.dayOffset);
      const arrMin = timeToMinutes(arrivalStr, dstStop.dayOffset);
      const duration = arrMin - depMin;

      const seats = getSeatCount(train, src, dst);

      if (seats >= requestedSeats) {
        directOptions.push({
          type: "DIRECT",
          source: src,
          destination: dst,
          trainId: train.trainId,
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          departureTime: departureStr,
          arrivalTime: arrivalStr,
          departureDayOffset: srcStop.dayOffset,
          arrivalDayOffset: dstStop.dayOffset,
          durationMinutes: duration,
          availableSeats: seats,
        });
      }
    }
  }

  // If direct seats are available, return them immediately
  if (directOptions.length > 0) {
    // Sort direct trains by duration
    directOptions.sort((a, b) => a.durationMinutes - b.durationMinutes);
    return {
      hasDirectSeats: true,
      directOptions,
      splitTicketOptions: [],
      message: `Found ${directOptions.length} direct train(s) with confirmed seats.`,
    };
  }

  // =========================================================================
  // STEP 2: Graph Algorithm for 2-Leg Split Journey
  // When no direct train has confirmed seats (0 or waitlisted),
  // find Source -> Intermediate (X) -> Destination using graph exploration.
  // =========================================================================

  // Collect all valid Leg 1 candidates: Source -> Intermediate Station X
  // Leg 1 must have: availableSeats >= requestedSeats
  const leg1Candidates: GraphSegment[] = [];

  for (const train of trains) {
    const srcIndex = train.stops.findIndex((s) => s.stationCode.toUpperCase() === src);
    if (srcIndex === -1) continue;

    const srcStop = train.stops[srcIndex];
    if (!srcStop.departureTime) continue; // Cannot board if train terminates here

    // Explore all downstream stops X (where X != destination)
    for (let i = srcIndex + 1; i < train.stops.length; i++) {
      const stopX = train.stops[i];
      const stationX = stopX.stationCode.toUpperCase();

      // Skip if station X is destination (that would be direct train which already failed)
      if (stationX === dst) continue;
      if (!stopX.arrivalTime) continue;

      const seats = getSeatCount(train, src, stationX);
      if (seats < requestedSeats) continue; // Leg 1 seat unavailable

      const depMin = timeToMinutes(srcStop.departureTime, srcStop.dayOffset);
      const arrMin = timeToMinutes(stopX.arrivalTime, stopX.dayOffset);

      if (arrMin <= depMin) continue; // Invalid time sequence

      leg1Candidates.push({
        train,
        fromStop: srcStop,
        toStop: stopX,
        departureMinutes: depMin,
        arrivalMinutes: arrMin,
        durationMinutes: arrMin - depMin,
        availableSeats: seats,
      });
    }
  }

  // If no trains depart from source with confirmed seats to any intermediate stop
  if (leg1Candidates.length === 0) {
    return {
      hasDirectSeats: false,
      directOptions: [],
      splitTicketOptions: [],
      message: "No confirmed seats available on any direct or outward connecting train.",
    };
  }

  // Map of candidate intermediate stations reachable from Source
  // StationCode -> Leg 1 segments
  const leg1ByIntermediate = new Map<string, GraphSegment[]>();
  for (const seg of leg1Candidates) {
    const code = seg.toStop.stationCode.toUpperCase();
    if (!leg1ByIntermediate.has(code)) {
      leg1ByIntermediate.set(code, []);
    }
    leg1ByIntermediate.get(code)!.push(seg);
  }

  // Use a Dijkstra Priority Queue to discover optimal 2-leg routes
  // Priority metric: Total journey time (Leg 1 duration + layover + Leg 2 duration)
  interface PathState {
    leg1: GraphSegment;
    leg2: GraphSegment;
    intermediateStation: string;
    layoverMinutes: number;
    totalDurationMinutes: number;
  }

  const pq = new MinPriorityQueue<PathState>();

  // Now inspect trains departing from candidate Intermediate Stations X -> Destination
  for (const train of trains) {
    const dstIndex = train.stops.findIndex((s) => s.stationCode.toUpperCase() === dst);
    if (dstIndex === -1) continue;

    const dstStop = train.stops[dstIndex];
    if (!dstStop.arrivalTime) continue;

    // Check if this train stops at any candidate intermediate station X before Destination
    for (let i = 0; i < dstIndex; i++) {
      const stopX = train.stops[i];
      const stationX = stopX.stationCode.toUpperCase();

      if (!leg1ByIntermediate.has(stationX)) continue;
      if (!stopX.departureTime) continue;

      const seats = getSeatCount(train, stationX, dst);
      if (seats < requestedSeats) continue; // Leg 2 seat unavailable

      const depMinLeg2 = timeToMinutes(stopX.departureTime, stopX.dayOffset);
      const arrMinLeg2 = timeToMinutes(dstStop.arrivalTime, dstStop.dayOffset);

      if (arrMinLeg2 <= depMinLeg2) continue;

      const leg2Segment: GraphSegment = {
        train,
        fromStop: stopX,
        toStop: dstStop,
        departureMinutes: depMinLeg2,
        arrivalMinutes: arrMinLeg2,
        durationMinutes: arrMinLeg2 - depMinLeg2,
        availableSeats: seats,
      };

      // Match with all valid Leg 1 segments arriving at Station X
      const matchingLeg1List = leg1ByIntermediate.get(stationX)!;
      for (const leg1 of matchingLeg1List) {
        // Condition A: Must not be the same train service
        if (leg1.train.trainId === leg2Segment.train.trainId) continue;

        // Condition B: Layover window validation at Station X
        // Layover = Leg 2 departure time at X - Leg 1 arrival time at X
        const layover = leg2Segment.departureMinutes - leg1.arrivalMinutes;

        if (layover < minLayoverMinutes) continue; // Too short to catch connection
        if (layover > maxLayoverMinutes) continue; // Layover is too long (passenger stranded)

        const totalDuration = leg2Segment.arrivalMinutes - leg1.departureMinutes;

        pq.enqueue(
          {
            leg1,
            leg2: leg2Segment,
            intermediateStation: stationX,
            layoverMinutes: layover,
            totalDurationMinutes: totalDuration,
          },
          totalDuration // Min-heap ordered by total travel duration
        );
      }
    }
  }

  // Extract top split ticket routes from the Priority Queue
  const splitTicketOptions: SplitTicketOption[] = [];
  const seenRouteFingerprints = new Set<string>();

  while (!pq.isEmpty() && splitTicketOptions.length < maxResults) {
    const candidate = pq.dequeue();
    if (!candidate) break;

    // Deduplicate identical train pairs
    const fingerprint = `${candidate.leg1.train.trainNumber}->${candidate.intermediateStation}->${candidate.leg2.train.trainNumber}`;
    if (seenRouteFingerprints.has(fingerprint)) continue;
    seenRouteFingerprints.add(fingerprint);

    const leg1Details: JourneyLeg = {
      legNumber: 1,
      trainId: candidate.leg1.train.trainId,
      trainNumber: candidate.leg1.train.trainNumber,
      trainName: candidate.leg1.train.trainName,
      fromStation: src,
      toStation: candidate.intermediateStation,
      departureTime: candidate.leg1.fromStop.departureTime!,
      arrivalTime: candidate.leg1.toStop.arrivalTime!,
      departureDayOffset: candidate.leg1.fromStop.dayOffset,
      arrivalDayOffset: candidate.leg1.toStop.dayOffset,
      durationMinutes: candidate.leg1.durationMinutes,
      availableSeats: candidate.leg1.availableSeats,
    };

    const leg2Details: JourneyLeg = {
      legNumber: 2,
      trainId: candidate.leg2.train.trainId,
      trainNumber: candidate.leg2.train.trainNumber,
      trainName: candidate.leg2.train.trainName,
      fromStation: candidate.intermediateStation,
      toStation: dst,
      departureTime: candidate.leg2.fromStop.departureTime!,
      arrivalTime: candidate.leg2.toStop.arrivalTime!,
      departureDayOffset: candidate.leg2.fromStop.dayOffset,
      arrivalDayOffset: candidate.leg2.toStop.dayOffset,
      durationMinutes: candidate.leg2.durationMinutes,
      availableSeats: candidate.leg2.availableSeats,
    };

    const layoverHours = Math.floor(candidate.layoverMinutes / 60);
    const layoverMins = candidate.layoverMinutes % 60;
    const layoverStr = `${layoverHours > 0 ? `${layoverHours}h ` : ""}${layoverMins}m`;

    splitTicketOptions.push({
      type: "SPLIT_TICKET",
      source: src,
      destination: dst,
      intermediateStation: candidate.intermediateStation,
      leg1: leg1Details,
      leg2: leg2Details,
      layoverMinutes: candidate.layoverMinutes,
      totalDurationMinutes: candidate.totalDurationMinutes,
      summary: `Take Train ${leg1Details.trainNumber} (${leg1Details.trainName}) from ${src} to ${candidate.intermediateStation}, change trains (${layoverStr} layover), then take Train ${leg2Details.trainNumber} (${leg2Details.trainName}) to ${dst}. Both legs have confirmed seats.`,
    });
  }

  if (splitTicketOptions.length === 0) {
    return {
      hasDirectSeats: false,
      directOptions: [],
      splitTicketOptions: [],
      message:
        "No direct seats available, and no valid 2-leg split-ticket routes satisfy the connection time window.",
    };
  }

  return {
    hasDirectSeats: false,
    directOptions: [],
    splitTicketOptions,
    message: `Direct train seats exhausted. Found ${splitTicketOptions.length} confirmed two-leg split-ticket alternative(s).`,
  };
}

