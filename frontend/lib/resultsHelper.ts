/**
 * Results Feature Helper Utilities for TatkalPro
 * - Connection risk computation for split journeys
 * - Smart-pick badge evaluation (Fastest, Cheapest, Best chance)
 * - 7-day Date flexibility strip with deterministic simulated availability
 */

import { Train, TravelClassCode, QuotaType } from "../types";
import { parseLocalDate, formatDisplayDate } from "./dateUtils";
import defaultRules from "./safetyNet/defaultRules.json";

// ----------------------------------------------------------------------
// 1. Connection Risk Computation for Split Journeys
// ----------------------------------------------------------------------

export type ConnectionRiskLevel = "Low" | "Medium" | "High";

export interface ConnectionRiskResult {
  level: ConnectionRiskLevel;
  layoverMinutes: number;
  onTimePercentage: number;
  why: string;
  label: string; // "estimate on simulated data"
}

/**
 * Computes connection risk for split journeys:
 * - Low: layover >= 90 min AND onTime >= 90%
 * - Medium: layover 60-89 min OR onTime 80-89% (and neither is below 60 min or 80%)
 * - High: otherwise (layover < 60 min OR onTime < 80%)
 */
export function computeConnectionRisk(
  layoverMinutes: number,
  onTimePercentage: number
): ConnectionRiskResult {
  let level: ConnectionRiskLevel;

  if (layoverMinutes >= 90 && onTimePercentage >= 90) {
    level = "Low";
  } else if (layoverMinutes < 60 || onTimePercentage < 80) {
    level = "High";
  } else {
    // 60-89 min layover or 80-89% on-time
    level = "Medium";
  }

  return {
    level,
    layoverMinutes,
    onTimePercentage,
    why: `${layoverMinutes} min layover · first train ${onTimePercentage}% on-time`,
    label: "estimate on simulated data",
  };
}

/**
 * Retrieves the official Tatkal non-refundable rule description & verification date
 */
export function getTatkalNonRefundableRuleInfo(): { description: string; lastVerified: string; source: string } {
  const rule = (defaultRules as any[]).find((r) => r.id === "RULE_TATKAL_NON_REFUNDABLE");
  return {
    description:
      rule?.description ||
      "Confirmed Tatkal tickets are non-refundable upon cancellation, unless the train is cancelled or delayed by over 3 hours.",
    lastVerified: rule?.last_verified || "04 Nov 2026",
    source: rule?.source_note || "Indian Railways Passenger Fare & Refund Rules 2015",
  };
}

// ----------------------------------------------------------------------
// 2. Smart-Pick Badges Computation
// ----------------------------------------------------------------------

export type SmartPickBadgeType = "FASTEST" | "CHEAPEST" | "BEST_CHANCE";

export interface SmartPickBadge {
  type: SmartPickBadgeType;
  label: string;
  ruleTooltip: string;
}

export function parseDurationToMinutes(durationStr: string): number {
  if (!durationStr) return 9999;
  const hMatch = durationStr.match(/(\d+)\s*h/i);
  const mMatch = durationStr.match(/(\d+)\s*m/i);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
  return hours * 60 + mins;
}

/**
 * Computes smart-pick badges for a list of visible/filtered trains.
 * Handles ties and respects class filters if active.
 */
export function computeSmartPickBadges(
  trains: Train[],
  activeClassFilter?: TravelClassCode[]
): Record<string, SmartPickBadge[]> {
  const result: Record<string, SmartPickBadge[]> = {};
  if (!trains || trains.length === 0) return result;

  trains.forEach((t) => {
    result[t.id] = [];
  });

  // Helper to extract effective class for comparison
  const getEffectiveClasses = (train: Train) => {
    if (activeClassFilter && activeClassFilter.length > 0) {
      const filtered = train.classes.filter((c) => activeClassFilter.includes(c.classCode));
      if (filtered.length > 0) return filtered;
    }
    return train.classes;
  };

  // A. Fastest: shortest duration (durationMinutes)
  let minDuration = Infinity;
  trains.forEach((t) => {
    const mins = parseDurationToMinutes(t.duration);
    if (mins < minDuration) minDuration = mins;
  });

  if (minDuration < Infinity) {
    trains.forEach((t) => {
      const mins = parseDurationToMinutes(t.duration);
      if (mins === minDuration) {
        result[t.id].push({
          type: "FASTEST",
          label: "Fastest",
          ruleTooltip: `Fastest journey · Shortest travel time (${t.duration})`,
        });
      }
    });
  }

  // B. Cheapest: lowest fare among effective classes
  let minFare = Infinity;
  const trainLowestFares: Record<string, number> = {};

  trains.forEach((t) => {
    const effective = getEffectiveClasses(t);
    const lowestForTrain = effective.reduce((min, c) => Math.min(min, c.fare), Infinity);
    trainLowestFares[t.id] = lowestForTrain;
    if (lowestForTrain < minFare) minFare = lowestForTrain;
  });

  if (minFare < Infinity) {
    trains.forEach((t) => {
      if (trainLowestFares[t.id] === minFare) {
        result[t.id].push({
          type: "CHEAPEST",
          label: "Cheapest",
          ruleTooltip: `Cheapest fare · Lowest ticket price (₹${minFare.toLocaleString("en-IN")})`,
        });
      }
    });
  }

  // C. Best chance: highest available seats among effective classes
  let maxSeats = -1;
  const trainMaxSeats: Record<string, number> = {};

  trains.forEach((t) => {
    const effective = getEffectiveClasses(t);
    const maxForTrain = effective.reduce((max, c) => Math.max(max, c.availableSeats || 0), 0);
    trainMaxSeats[t.id] = maxForTrain;
    if (maxForTrain > maxSeats) maxSeats = maxForTrain;
  });

  if (maxSeats > 0) {
    trains.forEach((t) => {
      if (trainMaxSeats[t.id] === maxSeats) {
        result[t.id].push({
          type: "BEST_CHANCE",
          label: "Best chance",
          ruleTooltip: `Best booking chance · Highest seat availability (${maxSeats} seats available)`,
        });
      }
    });
  }

  return result;
}

// ----------------------------------------------------------------------
// 3. Date Flexibility Strip (7-day window with simulated availability)
// ----------------------------------------------------------------------

export type DaySeatStatus = "AVAILABLE" | "FEW_SEATS" | "WAITLIST";

export interface FlexibilityDayItem {
  dateStr: string;        // "YYYY-MM-DD"
  displayDate: string;    // "08 Nov"
  weekday: string;        // "Sun"
  lowestFare: number;     // e.g. 540
  status: DaySeatStatus;
  statusLabel: string;    // "Available", "Few seats", "Waitlist"
  dotColor: string;
  availableSeats: number;
  isSelected: boolean;
  isDisabled: boolean;
  disabledReason?: string;
}

/**
 * Generates 7 days (selected day -3 to +3) with deterministic, seeded variations
 */
export function generateDateFlexibilityStrip(
  selectedDateStr: string,
  baseLowestFare: number = 540,
  routeSeed: string = "NDLS-MMCT"
): FlexibilityDayItem[] {
  const centerDate = parseLocalDate(selectedDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxAllowed = new Date(today);
  maxAllowed.setDate(today.getDate() + 120); // 120-day IRCTC ARP limit

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const items: FlexibilityDayItem[] = [];

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + offset);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;

    const isPast = d.getTime() < today.getTime();
    const isBeyondMax = d.getTime() > maxAllowed.getTime();
    const isDisabled = isPast || isBeyondMax;

    // Simple deterministic pseudo-random hash from isoDate and routeSeed
    let hash = 0;
    const key = `${isoDate}-${routeSeed}`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    let status: DaySeatStatus = "AVAILABLE";
    let statusLabel = "Available";
    let dotColor = "bg-emerald-500";
    let availableSeats = 18 + (seed % 15);

    const variation = seed % 3;
    if (variation === 1) {
      status = "FEW_SEATS";
      statusLabel = "Few seats";
      dotColor = "bg-amber-500";
      availableSeats = 2 + (seed % 5);
    } else if (variation === 2) {
      status = "WAITLIST";
      statusLabel = "Waitlist";
      dotColor = "bg-rose-500";
      availableSeats = 0;
    }

    // Dynamic fare variation between 0.95 and 1.15
    const fareMultiplier = 1 + ((seed % 7) - 3) * 0.03;
    const computedFare = Math.round((baseLowestFare * fareMultiplier) / 5) * 5;

    items.push({
      dateStr: isoDate,
      displayDate: `${day} ${monthNames[d.getMonth()]}`,
      weekday: weekdayNames[d.getDay()],
      lowestFare: computedFare,
      status,
      statusLabel,
      dotColor,
      availableSeats,
      isSelected: isoDate === selectedDateStr,
      isDisabled,
      disabledReason: isPast ? "Past dates unavailable" : isBeyondMax ? "Beyond 120-day advance window" : undefined,
    });
  }

  return items;
}

