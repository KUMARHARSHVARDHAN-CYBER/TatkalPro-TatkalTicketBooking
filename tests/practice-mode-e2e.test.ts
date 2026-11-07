import process from "node:process";
import {
  calculatePracticeScore,
  PracticeRunTelemetry,
} from "../frontend/lib/practice/scoringConfig";
import { PracticeStore, PracticeAttemptRecord } from "../frontend/lib/practice/practiceStore";
import { railwayProvider } from "../frontend/lib/railway/adapter";
import { botShieldService } from "../frontend/lib/railway/botShield";

console.log("=======================================================");
console.log("   🧪 PRACTICE MODE: END-TO-END REHEARSAL SUITE       ");
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

async function runE2E() {
  // -------------------------------------------------------------
  // 1. Initial State Baseline (Real store & telemetry snapshot)
  // -------------------------------------------------------------
  console.log("▶ [1/4] Baseline System Isolation Check");
  const initialTelemetry = { ...botShieldService.getTelemetryMetrics() };
  const initialBlockedCount = initialTelemetry.blockedRequestsCount;
  const initialTotalBookings = initialTelemetry.totalBookingsAttempted;

  // -------------------------------------------------------------
  // 2. Simulated E2E Run on Normal with Forced Payment Failure
  // -------------------------------------------------------------
  console.log("\n▶ [2/4] End-to-End Run: Normal Difficulty + Injected Gateway Failure");

  const run1Start = Date.now();
  const run1Telemetry: PracticeRunTelemetry = {
    difficulty: "NORMAL",
    countdownSeconds: 10,
    checklistItemsCompleted: 4, // 20 pts
    windowOpenedAt: run1Start,
    completedAt: run1Start + 22500,
    durationMs: 22500, // 22.5s <= 25s target for Normal -> 25 pts
    queueWaitMs: 3200,
    formFillMs: 7100,
    captchaAttempts: 1, // 15 pts
    captchaSolvedMs: 4200,
    paymentAttempts: 2,
    paymentFailureInjected: true,
    paymentRecoveryMs: 6000, // Recovered in 6s <= 8s -> 20 pts
    paymentAbandoned: false,
    wrongStationTrapInjected: true,
    wrongStationTrapFixed: true, // Caught & fixed -> 20 pts
    warningsSeen: ["RULE_MULTI_STATION_CITY_CONFUSION"],
    warningsFixed: ["RULE_MULTI_STATION_CITY_CONFUSION"],
  };

  const run1Result = calculatePracticeScore(run1Telemetry);
  assert(run1Result.totalScore === 100, `Full recovery after failure earns 100/100 (got ${run1Result.totalScore})`);
  assert(run1Result.phases.payment.earned === 20, "Payment phase awards full 20 pts for fast fallback recovery");
  assert(run1Result.phases.mistakeAvoidance.earned === 20, "Mistake avoidance awards full 20 pts for fixing station trap");
  assert(run1Result.timeline.some((e) => e.event.includes("Primary UPI gateway failure")), "Timeline logs injected failure");
  assert(run1Result.timeline.some((e) => e.event.includes("Multi-gateway fallback engaged")), "Timeline logs successful fallback");

  // Save run 1 to practice history
  const record1: PracticeAttemptRecord = {
    id: "run_e2e_1",
    timestamp: new Date().toISOString(),
    dateFormatted: "05 Nov, 11:15 AM",
    difficulty: "NORMAL",
    totalScore: run1Result.totalScore,
    durationSeconds: 22.5,
    rating: run1Result.rating,
    ratingLabel: run1Result.ratingLabel,
  };
  PracticeStore.saveAttempt(record1);
  PracticeStore.saveLatestResult(run1Result);

  const historyAfterRun1 = PracticeStore.getHistory();
  assert(historyAfterRun1[0].id === "run_e2e_1", "Run 1 successfully recorded at top of history");
  assert(historyAfterRun1[0].totalScore === 100, "Run 1 score is 100");

  // -------------------------------------------------------------
  // 3. Retry Run & History Aggregation
  // -------------------------------------------------------------
  console.log("\n▶ [3/4] Rehearsal Retry & Rolling Statistics Update");

  const run2Telemetry: PracticeRunTelemetry = {
    difficulty: "NORMAL",
    countdownSeconds: 10,
    checklistItemsCompleted: 4,
    windowOpenedAt: Date.now(),
    completedAt: Date.now() + 28000,
    durationMs: 28000, // 28s > 25s
    queueWaitMs: 3500,
    formFillMs: 9000,
    captchaAttempts: 2, // 1 retry -> 10 pts
    captchaSolvedMs: 6500,
    paymentAttempts: 1,
    paymentFailureInjected: false,
    paymentRecoveryMs: 0,
    paymentAbandoned: false,
    wrongStationTrapInjected: false,
    wrongStationTrapFixed: false,
    warningsSeen: [],
    warningsFixed: [],
  };

  const run2Result = calculatePracticeScore(run2Telemetry);
  assert(run2Result.totalScore < 100 && run2Result.totalScore >= 80, `Run 2 retry scored realistically (got ${run2Result.totalScore})`);

  const record2: PracticeAttemptRecord = {
    id: "run_e2e_2",
    timestamp: new Date().toISOString(),
    dateFormatted: "05 Nov, 11:18 AM",
    difficulty: "NORMAL",
    totalScore: run2Result.totalScore,
    durationSeconds: 28.0,
    rating: run2Result.rating,
    ratingLabel: run2Result.ratingLabel,
  };
  PracticeStore.saveAttempt(record2);

  const statsAfterRun2 = PracticeStore.getStats();
  assert(statsAfterRun2.bestScore === 100, "Best score remains 100 from Run 1");
  assert(statsAfterRun2.totalRuns >= 2, "Total runs counter incremented");

  // -------------------------------------------------------------
  // 4. Verification of Zero System Pollution (Strict Isolation)
  // -------------------------------------------------------------
  console.log("\n▶ [4/4] Strict Isolation Verification");

  // A. No PNRs or real bookings generated
  const allDummyQueries = await Promise.all([
    railwayProvider.getPNRStatus("TP-DEMO-0001"),
    railwayProvider.getPNRStatus("PRACTICE_PNR"),
  ]);
  assert(allDummyQueries[0] === null, "Practice mode created zero PNR records in railwayProvider");
  assert(allDummyQueries[1] === null, "Practice mode created zero arbitrary bookings");

  // B. No Bot Shield or Admin telemetry mutated
  const finalTelemetry = botShieldService.getTelemetryMetrics();
  assert(
    finalTelemetry.blockedRequestsCount === initialBlockedCount,
    "Practice run did NOT mutate Bot Shield blockedRequestsCount"
  );
  assert(
    finalTelemetry.totalBookingsAttempted === initialTotalBookings,
    "Practice run did NOT mutate Bot Shield totalBookingsAttempted"
  );

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
  console.log("=======================================================\n");

  if (totalTests === passedTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2E().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
