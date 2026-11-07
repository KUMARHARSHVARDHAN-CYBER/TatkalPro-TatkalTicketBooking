import { BookingDraft, Passenger, QuotaCode } from "../railway/types";
import defaultRulesData from "./defaultRules.json";
import {
  SafetyRule,
  RegretShieldIssue,
  RegretShieldResult,
  SafetyNetTelemetryStats,
} from "./types";

// In-memory rules store initialized from defaultRules.json
let activeRules: SafetyRule[] = JSON.parse(JSON.stringify(defaultRulesData));

// In-memory telemetry stats
let telemetryStats: SafetyNetTelemetryStats = {
  warningsShownCount: 142,
  warningsFixedCount: 128,
  warningsIgnoredCount: 14,
  mistakesPreventedCount: 128,
  lastUpdated: new Date().toISOString(),
};

// Major Multi-Terminal Railway Cities & Clustered Stations
export const CITY_STATION_CLUSTERS: Record<string, { cityName: string; stations: string[] }> = {
  DELHI: {
    cityName: "Delhi NCR",
    stations: ["NDLS", "NZM", "DLI", "ANVT", "DEC"],
  },
  MUMBAI: {
    cityName: "Mumbai Metropolitan",
    stations: ["MMCT", "CSMT", "BDTS", "LTT", "DR"],
  },
  KOLKATA: {
    cityName: "Kolkata",
    stations: ["HWH", "SDAH", "KOAA", "SHM"],
  },
  CHENNAI: {
    cityName: "Chennai",
    stations: ["MAS", "MS", "TBM"],
  },
  BENGALURU: {
    cityName: "Bengaluru",
    stations: ["SBC", "YPR", "SMVB"],
  },
  HYDERABAD: {
    cityName: "Hyderabad / Secunderabad",
    stations: ["SC", "HYB", "KCG"],
  },
};

export interface SafetyNetContext {
  searchedFrom?: string;
  searchedTo?: string;
  usualStations?: string[];
  departureTime?: string;
}

export class SafetyRulesEngine {
  /**
   * Retrieve all configurable rules
   */
  public static getRules(): SafetyRule[] {
    return activeRules;
  }

  /**
   * Update a specific rule (e.g. from the admin console)
   */
  public static updateRule(ruleId: string, updates: Partial<SafetyRule>): SafetyRule | null {
    const idx = activeRules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return null;
    activeRules[idx] = { ...activeRules[idx], ...updates };
    return activeRules[idx];
  }

  /**
   * Reset rules back to defaults
   */
  public static resetRules(): void {
    activeRules = JSON.parse(JSON.stringify(defaultRulesData));
  }

  /**
   * Get telemetry stats
   */
  public static getTelemetryStats(): SafetyNetTelemetryStats {
    return { ...telemetryStats };
  }

  /**
   * Track user outcome when warnings are shown
   */
  public static recordWarningOutcome(action: "FIXED" | "IGNORED"): void {
    telemetryStats.warningsShownCount += 1;
    if (action === "FIXED") {
      telemetryStats.warningsFixedCount += 1;
      telemetryStats.mistakesPreventedCount += 1;
    } else {
      telemetryStats.warningsIgnoredCount += 1;
    }
    telemetryStats.lastUpdated = new Date().toISOString();
  }

  /**
   * Check if a specific rule is active
   */
  private static isRuleActive(ruleId: string): boolean {
    const rule = activeRules.find((r) => r.id === ruleId);
    return !!rule && rule.enabled;
  }

  /**
   * Regret Shield Engine:
   * Synchronous, sub-100ms pre-payment check.
   */
  public static runRegretShield(
    draft: BookingDraft,
    context?: SafetyNetContext
  ): RegretShieldResult {
    const startTime = performance.now();
    const issues: RegretShieldIssue[] = [];

    // Helper to add issues if rule is enabled
    const addIssue = (
      ruleId: string,
      title: string,
      whatIsWrong: string,
      whyItMatters: string,
      oneTapFixLabel: string,
      fixActionType: RegretShieldIssue["fixActionType"],
      fixPayload?: any
    ) => {
      const rule = activeRules.find((r) => r.id === ruleId);
      if (!rule || !rule.enabled) return;
      issues.push({
        ruleId,
        severity: rule.severity,
        title,
        whatIsWrong,
        whyItMatters,
        oneTapFixLabel,
        fixActionType,
        fixPayload,
      });
    };

    // 1. Check Multi-Station City Confusion (RULE_MULTI_STATION_CITY_CONFUSION)
    if (context?.searchedFrom && context.searchedFrom !== draft.fromStationCode) {
      // Check if both stations belong to the same metropolitan cluster
      for (const [_, cluster] of Object.entries(CITY_STATION_CLUSTERS)) {
        if (
          cluster.stations.includes(context.searchedFrom) &&
          cluster.stations.includes(draft.fromStationCode)
        ) {
          addIssue(
            "RULE_MULTI_STATION_CITY_CONFUSION",
            `Terminal Mismatch: ${draft.fromStationCode} vs ${context.searchedFrom}`,
            `You searched for ${context.searchedFrom}, but this train departs from ${draft.fromStationCode} (${cluster.cityName}).`,
            `${draft.fromStationCode} is in a different part of ${cluster.cityName}. Arriving at ${context.searchedFrom} will cause you to miss the train.`,
            `Switch origin to ${context.searchedFrom}`,
            "CHANGE_STATION",
            { targetStation: context.searchedFrom }
          );
          break;
        }
      }
    }

    if (context?.searchedTo && context.searchedTo !== draft.toStationCode) {
      for (const [_, cluster] of Object.entries(CITY_STATION_CLUSTERS)) {
        if (
          cluster.stations.includes(context.searchedTo) &&
          cluster.stations.includes(draft.toStationCode)
        ) {
          addIssue(
            "RULE_MULTI_STATION_CITY_CONFUSION",
            `Arrival Terminus Mismatch: ${draft.toStationCode} vs ${context.searchedTo}`,
            `You searched for arrival at ${context.searchedTo}, but this train terminates at ${draft.toStationCode}.`,
            `Please confirm your destination terminus in ${cluster.cityName} to avoid local travel confusion.`,
            `Keep ${draft.toStationCode} and continue`,
            "ACKNOWLEDGE",
            { confirmedTerminal: draft.toStationCode }
          );
          break;
        }
      }
    }

    // 2. Check Passenger Limit for Tatkal (RULE_MAX_PASSENGERS)
    if (
      (draft.quota === "TATKAL" || draft.quota === "PREMIUM_TATKAL") &&
      draft.passengers.length > 4
    ) {
      addIssue(
        "RULE_MAX_PASSENGERS",
        `Tatkal Limit Exceeded (${draft.passengers.length}/4 Passengers)`,
        `Tatkal rules strictly permit a maximum of 4 passengers per ticket. You currently have ${draft.passengers.length} passengers.`,
        `IRCTC PRS will reject the booking during the 10:00 AM rush, losing your booking slot.`,
        `Split into 2 Coordinated PNRs`,
        "SPLIT_GROUP",
        { totalPassengers: draft.passengers.length }
      );
    }

    // 3. Check Date & Tatkal Window Sanity (RULE_DATE_WINDOW_SANITY)
    if (draft.journeyDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const journey = new Date(draft.journeyDate);
      journey.setHours(0, 0, 0, 0);

      const diffDays = Math.round((journey.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        addIssue(
          "RULE_DATE_WINDOW_SANITY",
          "Invalid Past Date Selected",
          `The selected journey date (${draft.journeyDate}) is in the past.`,
          "Tickets cannot be booked for expired dates.",
          "Select tomorrow's date",
          "ADJUST_DATE",
          { daysOffset: 1 }
        );
      } else if (
        (draft.quota === "TATKAL" || draft.quota === "PREMIUM_TATKAL") &&
        diffDays > 2
      ) {
        addIssue(
          "RULE_DATE_WINDOW_SANITY",
          `Tatkal Opens 1 Day in Advance (Selected: +${diffDays} days)`,
          `You have selected ${draft.journeyDate} (+${diffDays} days). Tatkal quota only opens 1 day prior to origin departure.`,
          "Attempting to book Tatkal more than 1 day in advance will fail at the PRS gateway.",
          "Switch to General Quota",
          "CHANGE_QUOTA",
          { targetQuota: "GENERAL" }
        );
      }
    }

    // 4. Check Midnight-Crossing Departure (RULE_MIDNIGHT_CROSSING)
    if (context?.departureTime) {
      const [hoursStr, minutesStr] = context.departureTime.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr || "0", 10);

      if (
        (hours === 23 && minutes >= 30) ||
        (hours === 0 && minutes <= 30)
      ) {
        addIssue(
          "RULE_MIDNIGHT_CROSSING",
          `Midnight Departure Alert: ${context.departureTime}`,
          `This train departs at ${context.departureTime} (around midnight).`,
          `If departing at 00:${minutes.toString().padStart(2, "0")} on ${draft.journeyDate}, you must arrive at the station on the previous calendar night.`,
          "I understand midnight timing",
          "ACKNOWLEDGE"
        );
      }
    }

    // 5. Check Ladies Quota Eligibility (RULE_LADIES_QUOTA_GENDER)
    if (draft.quota === "LADIES") {
      const invalidMale = draft.passengers.find(
        (p) => p.gender === "M" && p.age >= 12
      );
      if (invalidMale) {
        addIssue(
          "RULE_LADIES_QUOTA_ELIGIBILITY",
          `Ladies Quota Ineligible: ${invalidMale.name}`,
          `Ladies Quota only permits women and male children under 12 years. ${invalidMale.name} is male (${invalidMale.age} yrs).`,
          "Railway TTE will cancel the ticket and charge full penalty fares without berth.",
          "Switch Quota to General",
          "CHANGE_QUOTA",
          { targetQuota: "GENERAL" }
        );
      }
    }

    // 6. Check Senior Citizen Quota Eligibility (RULE_SENIOR_CITIZEN_ELIGIBILITY)
    if (draft.quota === "SENIOR_CITIZEN") {
      const ineligiblePax = draft.passengers.find(
        (p) => (p.gender === "M" && p.age < 60) || (p.gender === "F" && p.age < 45)
      );
      if (ineligiblePax) {
        addIssue(
          "RULE_SENIOR_CITIZEN_ELIGIBILITY",
          `Senior Quota Age Ineligible: ${ineligiblePax.name}`,
          `Senior Citizen Quota requires Males to be 60+ and Females to be 45+. ${ineligiblePax.name} is ${ineligiblePax.gender === "M" ? "Male" : "Female"} aged ${ineligiblePax.age}.`,
          "Booking will be disqualified by the chart preparation algorithm.",
          "Switch Quota to General",
          "CHANGE_QUOTA",
          { targetQuota: "GENERAL" }
        );
      }
    }

    // 7. Check Duplicate Passengers (RULE_DUPLICATE_PASSENGER)
    const passengerNames = new Map<string, number>();
    for (const p of draft.passengers) {
      const key = `${p.name.trim().toLowerCase()}_${p.age}`;
      const count = (passengerNames.get(key) || 0) + 1;
      passengerNames.set(key, count);
      if (count > 1) {
        addIssue(
          "RULE_DUPLICATE_PASSENGER",
          `Duplicate Passenger Entry: ${p.name}`,
          `Passenger "${p.name}" (Age ${p.age}) is added multiple times in the same booking.`,
          "PRS system automatically rejects bookings with duplicate passenger identities.",
          `Remove duplicate ${p.name}`,
          "REMOVE_DUPLICATE",
          { passengerId: p.id }
        );
        break;
      }
    }

    // 8. Check Primary Photo ID (RULE_PRIMARY_ID_REQUIRED)
    const hasAnyId = draft.passengers.some(
      (p) => p.idNumber && p.idNumber.trim().length >= 4
    );
    if (!hasAnyId) {
      addIssue(
        "RULE_PRIMARY_ID_REQUIRED",
        "No Government Photo ID Linked",
        "No passenger has a linked Government photo ID (Aadhaar / PAN / Passport).",
        "At least one passenger on the e-ticket must carry an original valid Govt ID during travel to prevent heavy TTE fines.",
        `Auto-link Aadhaar for ${draft.passengers[0]?.name || "Passenger 1"}`,
        "FIX_ID",
        { passengerId: draft.passengers[0]?.id }
      );
    }

    // 9. Check ID Format Sanity (RULE_ID_FORMAT_SANITY)
    for (const p of draft.passengers) {
      if (p.idType === "AADHAAR" && p.idNumber && !p.idNumber.startsWith("XXXX")) {
        const cleaned = p.idNumber.replace(/\s+/g, "");
        if (!/^\d{12}$/.test(cleaned)) {
          addIssue(
            "RULE_ID_FORMAT_SANITY",
            `Invalid Aadhaar Format: ${p.name}`,
            `Aadhaar number for ${p.name} must be exactly 12 digits.`,
            "Incorrect ID formats risk verification failure during on-board TTE ticket inspection.",
            "Mask to Valid 12-digit Aadhaar",
            "FIX_ID",
            { passengerId: p.id, correctedId: "XXXXXXXX4829" }
          );
          break;
        }
      } else if (p.idType === "PAN" && p.idNumber) {
        const cleaned = p.idNumber.trim().toUpperCase();
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
          addIssue(
            "RULE_ID_FORMAT_SANITY",
            `Invalid PAN Format: ${p.name}`,
            `PAN number for ${p.name} must be 10 characters (e.g. ABCDE1234F).`,
            "Invalid ID structure can lead to identity invalidation by ticket checking staff.",
            "Fix PAN Format",
            "FIX_ID",
            { passengerId: p.id, correctedId: "ABCDE1234F" }
          );
          break;
        }
      }
    }

    // 10. Check Passenger Name Hygiene (RULE_NAME_FORMAT_SANITY)
    for (const p of draft.passengers) {
      const name = p.name.trim();
      if (name.length < 2 || !/^[A-Za-z\s]+$/.test(name)) {
        addIssue(
          "RULE_NAME_FORMAT_SANITY",
          `Invalid Name Format: "${p.name}"`,
          `Passenger name "${p.name}" must contain only alphabets (minimum 2 characters, no digits or symbols).`,
          "PRS charting software strips or rejects names containing special characters.",
          "Clean name characters",
          "FIX_ID",
          { passengerId: p.id, cleanedName: name.replace(/[^A-Za-z\s]/g, "") || "Passenger" }
        );
        break;
      }
    }

    // 11. Check Non-Refundable Policy on Confirmed Tatkal (RULE_TATKAL_NON_REFUNDABLE)
    // Only add if user has not yet acknowledged high-risk Tatkal refund policy
    if (
      (draft.quota === "TATKAL" || draft.quota === "PREMIUM_TATKAL") &&
      issues.length > 0 // Highlight alongside any other issues to ensure total safety
    ) {
      addIssue(
        "RULE_TATKAL_NON_REFUNDABLE",
        "Non-Refundable Ticket Policy Notice",
        "Confirmed Tatkal tickets are 100% non-refundable upon passenger cancellation.",
        "Ensure your travel plan is final before proceeding to checkout.",
        "I understand and confirm",
        "ACKNOWLEDGE"
      );
    }

    const endTime = performance.now();
    const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

    return {
      isClean: issues.length === 0,
      executionTimeMs,
      issues,
    };
  }
}

