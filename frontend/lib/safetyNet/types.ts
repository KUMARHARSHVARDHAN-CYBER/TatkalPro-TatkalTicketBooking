import { Passenger, QuotaCode } from "../railway/types";

export type RuleSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RuleCategory =
  | "PASSENGER_LIMIT"
  | "STATION"
  | "DATE"
  | "QUOTA"
  | "ID_DOCUMENT"
  | "REFUND_RISK";

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  severity: RuleSeverity;
  category: RuleCategory;
  source_note: string;
  last_verified: string;
  enabled: boolean;
}

export type FixActionType =
  | "CHANGE_STATION"
  | "CHANGE_QUOTA"
  | "REMOVE_DUPLICATE"
  | "FIX_ID"
  | "SPLIT_GROUP"
  | "ADJUST_DATE"
  | "ACKNOWLEDGE";

export interface RegretShieldIssue {
  ruleId: string;
  severity: RuleSeverity;
  title: string;
  whatIsWrong: string;
  whyItMatters: string;
  oneTapFixLabel: string;
  fixActionType: FixActionType;
  fixPayload?: any;
}

export interface RegretShieldResult {
  isClean: boolean;
  executionTimeMs: number;
  issues: RegretShieldIssue[];
}

export interface TravelReadinessChecklist {
  primaryPassengerId: string;
  primaryPassengerName: string;
  primaryIdType: string;
  primaryIdNumber: string;
  offlineTicketSaved: boolean;
  boardingStationCode: string;
  boardingStationName: string;
  departurePlatform: string;
  scheduledDeparture: string;
  liveStatusUrl: string;
  reminders: {
    type: "24H_BEFORE" | "3H_BEFORE" | "CHART_PREP";
    scheduledTime: string;
    simulatedStatus: "PENDING" | "SCHEDULED" | "DELIVERED";
  }[];
}

export interface GroupBatch {
  batchNumber: number;
  pnrMock: string;
  passengers: Passenger[];
  classCode: string;
  quota: QuotaCode;
  status: "READY" | "CONFIRMED" | "WAITLISTED" | "FAILED";
}

export interface PlanBAlternative {
  trainNumber: string;
  trainName: string;
  departureTime: string;
  classCode: string;
  availableSeats: number;
  waitlistProbability: number;
  fareDifference: number;
}

export interface GroupSplitPlan {
  totalPassengers: number;
  batches: GroupBatch[];
  coachTogetherPreference: boolean;
  planBAlternatives: PlanBAlternative[];
}

export interface TelemetryStep {
  stepName: string;
  timestamp: number;
  durationMs: number;
  status: "OK" | "WARNING" | "FAILED";
  details?: string;
}

export interface FailureAutopsyRecord {
  attemptId: string;
  timestamp: string;
  trainNumber: string;
  trainName: string;
  quota: string;
  travelClass: string;
  failureStage: "SEAT_LOCK" | "CAPTCHA" | "PAYMENT_GATEWAY" | "BANK_OTP" | "RATE_LIMIT";
  rootCausePlainLanguage: string;
  actionableSuggestion: string;
  telemetryTimeline: TelemetryStep[];
}

export interface SafetyNetTelemetryStats {
  warningsShownCount: number;
  warningsFixedCount: number;
  warningsIgnoredCount: number;
  mistakesPreventedCount: number;
  lastUpdated: string;
}

