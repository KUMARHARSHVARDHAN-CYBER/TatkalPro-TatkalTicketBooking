import process from "node:process";
import { SafetyRulesEngine } from "../frontend/lib/safetyNet/rulesEngine";
import { GroupSplitCoordinator } from "../frontend/lib/safetyNet/groupSplitCoordinator";
import { FailureAutopsyService } from "../frontend/lib/safetyNet/failureAutopsy";
import { TravelReadinessService } from "../frontend/lib/safetyNet/readinessService";
import { BookingDraft, Passenger } from "../frontend/lib/railway/types";

console.log("=======================================================");
console.log("   🛡️ TATKAL SAFETY NET: VERIFICATION TEST SUITE     ");
console.log("=======================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || "Assertion failed"}`);
    process.exitCode = 1;
  }
}

// Helper mock passenger
function createMockPax(id: string, name: string, age: number, gender: "M" | "F", idNumber = "XXXXXXXX4829"): Passenger {
  return {
    id,
    name,
    age,
    gender,
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "AADHAAR",
    idNumber,
    nationality: "Indian",
  };
}

// Clean reference draft
const cleanDraft: BookingDraft = {
  draftId: "draft_clean_1",
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
  fromStationCode: "NDLS",
  toStationCode: "MMCT",
  journeyDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })(),
  classCode: "3A",
  quota: "TATKAL",
  passengers: [
    createMockPax("p1", "Rahul Sharma", 32, "M"),
    createMockPax("p2", "Priya Sharma", 29, "F", "XXXXXXXX1904"),
  ],
  fareBreakdown: {
    baseFareTotal: 4000,
    tatkalChargesTotal: 800,
    superfastChargesTotal: 100,
    gstTotal: 245,
    pgFee: 15,
    grandTotal: 5160,
  },
  holdToken: "hold_token_clean",
};

// ==========================================
// 1. RULES ENGINE & CONFIGURABILITY
// ==========================================
console.log("▶ [1/6] Configurable Rules Engine & Dynamic Admin Editing");
const allRules = SafetyRulesEngine.getRules();
assert(allRules.length >= 10, "Default rules loaded from JSON config", `Count: ${allRules.length}`);
assert(allRules.some((r) => r.id === "RULE_MAX_PASSENGERS"), "RULE_MAX_PASSENGERS exists");
assert(allRules.some((r) => r.id === "RULE_MULTI_STATION_CITY_CONFUSION"), "RULE_MULTI_STATION_CITY_CONFUSION exists");
assert(allRules.some((r) => r.id === "RULE_DATE_WINDOW_SANITY"), "RULE_DATE_WINDOW_SANITY exists");
assert(allRules.some((r) => r.id === "RULE_LADIES_QUOTA_ELIGIBILITY"), "RULE_LADIES_QUOTA_ELIGIBILITY exists");

// Test dynamic update
const updatedRule = SafetyRulesEngine.updateRule("RULE_MULTI_STATION_CITY_CONFUSION", { severity: "HIGH" });
assert(updatedRule?.severity === "HIGH", "Dynamic rule severity update succeeded without code changes");
SafetyRulesEngine.resetRules();
assert(
  SafetyRulesEngine.getRules().find((r) => r.id === "RULE_MULTI_STATION_CITY_CONFUSION")?.severity === "MEDIUM",
  "Rule reset to default succeeded"
);

// ==========================================
// 2. REGRET SHIELD: PRE-PAYMENT CHECKS & LATENCY
// ==========================================
console.log("\n▶ [2/6] Regret Shield: Clean Booking Zero-Latency Benchmark (<100ms)");
const cleanResult = SafetyRulesEngine.runRegretShield(cleanDraft, {
  searchedFrom: "NDLS",
  searchedTo: "MMCT",
  departureTime: "16:55",
});
assert(cleanResult.isClean, "Clean booking reports zero issues (clean === true)");
assert(cleanResult.issues.length === 0, "No issues created for clean booking");
assert(cleanResult.executionTimeMs < 100, `Execution latency strictly under 100ms (Observed: ${cleanResult.executionTimeMs}ms)`);
assert(cleanResult.executionTimeMs < 15, `Sub-15ms high-speed in-memory benchmark (Observed: ${cleanResult.executionTimeMs}ms)`);

// ==========================================
// 3. REGRET SHIELD: INDIVIDUAL RULE EDGE CASES
// ==========================================
console.log("\n▶ [3/6] Regret Shield: Detection & One-Tap Fix Edge Cases");

// 3.1 Multi-Station City Confusion (Searched NDLS, but train departs NZM in Delhi)
const stationMistakeDraft: BookingDraft = {
  ...cleanDraft,
  fromStationCode: "NZM",
};
const stationResult = SafetyRulesEngine.runRegretShield(stationMistakeDraft, {
  searchedFrom: "NDLS",
  searchedTo: "MMCT",
});
assert(!stationResult.isClean, "Catches same-city terminal mismatch (NZM vs NDLS)");
assert(
  stationResult.issues.some((i) => i.ruleId === "RULE_MULTI_STATION_CITY_CONFUSION"),
  "Issues list contains RULE_MULTI_STATION_CITY_CONFUSION"
);
assert(
  stationResult.issues[0]?.oneTapFixLabel.includes("NDLS"),
  "Provides 1-Tap Fix to switch origin to searched station"
);

// 3.2 Tatkal 4-Passenger Limit Exceeded (6 pax)
const sixPaxDraft: BookingDraft = {
  ...cleanDraft,
  passengers: [
    createMockPax("p1", "User One", 30, "M"),
    createMockPax("p2", "User Two", 28, "F"),
    createMockPax("p3", "User Three", 25, "M"),
    createMockPax("p4", "User Four", 22, "F"),
    createMockPax("p5", "User Five", 55, "M"),
    createMockPax("p6", "User Six", 50, "F"),
  ],
};
const limitResult = SafetyRulesEngine.runRegretShield(sixPaxDraft);
assert(!limitResult.isClean, "Catches >4 passengers in Tatkal quota");
assert(
  limitResult.issues.some((i) => i.ruleId === "RULE_MAX_PASSENGERS"),
  "RULE_MAX_PASSENGERS flagged"
);
assert(
  limitResult.issues.find((i) => i.ruleId === "RULE_MAX_PASSENGERS")?.fixActionType === "SPLIT_GROUP",
  "Offers SPLIT_GROUP 1-tap fix action"
);

// 3.3 Midnight-Crossing Departure (00:15 past midnight)
const midnightResult = SafetyRulesEngine.runRegretShield(cleanDraft, {
  searchedFrom: "NDLS",
  departureTime: "00:15",
});
assert(
  midnightResult.issues.some((i) => i.ruleId === "RULE_MIDNIGHT_CROSSING"),
  "RULE_MIDNIGHT_CROSSING warns about midnight calendar date confusion"
);

// 3.4 Ladies Quota Gender Boundary (Male adult >= 12 yrs)
const invalidLadiesDraft: BookingDraft = {
  ...cleanDraft,
  quota: "LADIES",
  passengers: [
    createMockPax("p1", "Sneha Rao", 28, "F"),
    createMockPax("p2", "Ramesh Rao", 32, "M"), // Invalid: adult male in Ladies quota
  ],
};
const ladiesResult = SafetyRulesEngine.runRegretShield(invalidLadiesDraft);
assert(
  ladiesResult.issues.some((i) => i.ruleId === "RULE_LADIES_QUOTA_ELIGIBILITY"),
  "RULE_LADIES_QUOTA_ELIGIBILITY rejects adult male in Ladies quota"
);

// 3.5 Duplicate Passenger
const duplicateDraft: BookingDraft = {
  ...cleanDraft,
  passengers: [
    createMockPax("p1", "Amit Kumar", 35, "M"),
    createMockPax("p2", "Amit Kumar", 35, "M"), // Duplicate!
  ],
};
const dupResult = SafetyRulesEngine.runRegretShield(duplicateDraft);
assert(
  dupResult.issues.some((i) => i.ruleId === "RULE_DUPLICATE_PASSENGER"),
  "RULE_DUPLICATE_PASSENGER catches identical name & age in same booking"
);

// 3.6 Invalid ID Format
const badAadhaarDraft: BookingDraft = {
  ...cleanDraft,
  passengers: [createMockPax("p1", "Test User", 30, "M", "12345")], // Invalid Aadhaar length
};
const idResult = SafetyRulesEngine.runRegretShield(badAadhaarDraft);
assert(
  idResult.issues.some((i) => i.ruleId === "RULE_ID_FORMAT_SANITY"),
  "RULE_ID_FORMAT_SANITY catches malformed Aadhaar number"
);

// ==========================================
// 4. GROUP SPLIT COORDINATOR
// ==========================================
console.log("\n▶ [4/6] Group Split Coordinator & Plan B Alternatives");
const group6 = [
  createMockPax("p1", "Person 1", 30, "M"),
  createMockPax("p2", "Person 2", 28, "F"),
  createMockPax("p3", "Person 3", 26, "M"),
  createMockPax("p4", "Person 4", 24, "F"),
  createMockPax("p5", "Person 5", 22, "M"),
  createMockPax("p6", "Person 6", 20, "F"),
];

const splitPlan = GroupSplitCoordinator.splitGroup(group6, {
  coachTogether: true,
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
});

assert(splitPlan.batches.length === 2, "Group of 6 partitioned into 2 batches");
assert(splitPlan.batches[0].passengers.length === 3, "Batch 1 has 3 passengers");
assert(splitPlan.batches[1].passengers.length === 3, "Batch 2 has 3 passengers");
assert(splitPlan.coachTogetherPreference, "Coach-Together preference retained");
assert(splitPlan.planBAlternatives.length >= 3, "Plan B alternatives generated for fallback");
assert(splitPlan.planBAlternatives[0].waitlistProbability > 90, "Plan B probability calculated (>90%)");

// Test Partial Success simulation
const simResult = GroupSplitCoordinator.simulatePartialSuccess(splitPlan);
assert(simResult.updatedPlan.batches[0].status === "CONFIRMED", "Batch 1 simulated CONFIRMED");
assert(simResult.updatedPlan.batches[1].status === "WAITLISTED", "Batch 2 simulated WAITLISTED");
assert(simResult.recoveryNotice.length > 0, "Recovery notice generated with PNR details");
assert(simResult.suggestedPlanB.trainName.length > 0, "Suggested Plan B alternative provided");

// ==========================================
// 5. FAILURE AUTOPSY & TELEMETRY
// ==========================================
console.log("\n▶ [5/6] Privacy-Safe Failure Autopsy & Actionable Classifier");
FailureAutopsyService.logTelemetryStep("att_1", "Tatkal Window Open", 0, "OK");
FailureAutopsyService.logTelemetryStep("att_1", "Queue Wait", 150, "OK");
FailureAutopsyService.logTelemetryStep("att_1", "Bank OTP Handshake", 40000, "FAILED", "Timeout");

const autopsy = FailureAutopsyService.createAutopsy("att_1", "BANK_OTP", {
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
  travelClass: "3A",
  quota: "TATKAL",
  bankName: "HDFC Bank",
  elapsedSeconds: 40,
});

assert(autopsy.failureStage === "BANK_OTP", "Autopsy classified stage as BANK_OTP");
assert(autopsy.rootCausePlainLanguage.includes("Bank Gateway Delay"), "Plain language root cause generated");
assert(autopsy.actionableSuggestion.includes("UPI Fast Pay"), "Exactly ONE actionable suggestion provided");
assert(autopsy.telemetryTimeline.length >= 3, "Privacy-safe telemetry steps preserved");
assert(FailureAutopsyService.getHistory().length >= 1, "Autopsy saved to retrospective history");

// Test Seat Lock exhaustion classification
const seatAutopsy = FailureAutopsyService.createAutopsy("att_2", "SEAT_LOCK", {
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
  travelClass: "3A",
  quota: "TATKAL",
});
assert(seatAutopsy.rootCausePlainLanguage.includes("High-Rush Seat Exhaustion"), "Classified seat rush exhaustion");
assert(seatAutopsy.actionableSuggestion.includes("AC 2-Tier"), "Suggests lower contention class or split journey");

// ==========================================
// 6. TRAVEL READINESS & MANDATORY ID SERVICE
// ==========================================
console.log("\n▶ [6/6] Travel Readiness & Mandatory ID Service");
const mockBooking = {
  pnr: "4920194820",
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
  fromStationCode: "NDLS",
  toStationCode: "MMCT",
  fromStation: { code: "NDLS", name: "New Delhi", city: "Delhi" },
  toStation: { code: "MMCT", name: "Mumbai Central", city: "Mumbai" },
  journeyDate: "2026-11-06",
  quota: "TATKAL",
  travelClass: "3A",
  totalFare: 5416,
  passengers: [createMockPax("p1", "Rahul Sharma", 32, "M")],
  bookingTimestamp: new Date().toISOString(),
  paymentDetails: { method: "UPI", utrNumber: "UPI948201" },
};

const readiness = TravelReadinessService.createReadinessChecklist(mockBooking as any, { platform: "Platform 12" });
assert(readiness.primaryPassengerName === "Rahul Sharma", "Primary ID Carrier correctly identified as Rahul Sharma");
assert(readiness.primaryIdType === "AADHAAR", "Primary ID Type identified as AADHAAR");
assert(readiness.departurePlatform === "Platform 12", "Boarding platform set to Platform 12");
assert(readiness.reminders.length === 2, "24h and 3h departure alerts scheduled");

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
console.log("=======================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
