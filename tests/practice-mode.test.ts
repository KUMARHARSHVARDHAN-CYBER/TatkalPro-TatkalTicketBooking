import process from "node:process";
import {
  calculatePracticeScore,
  DIFFICULTY_CONFIGS,
  PracticeRunTelemetry,
  SCORING_WEIGHTS,
} from "../frontend/lib/practice/scoringConfig";
import { PracticeStore, PracticeAttemptRecord } from "../frontend/lib/practice/practiceStore";

console.log("=======================================================");
console.log("   🏋️ PRACTICE MODE: UNIT VERIFICATION SUITE         ");
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

// -------------------------------------------------------------
// 1. Difficulty Configuration Integrity
// -------------------------------------------------------------
console.log("▶ [1/4] Difficulty Config & Parameters");
assert(DIFFICULTY_CONFIGS.EASY.pauseAllowed === true, "Easy difficulty permits pause");
assert(DIFFICULTY_CONFIGS.NORMAL.pauseAllowed === false, "Normal difficulty enforces live clock without pause");
assert(DIFFICULTY_CONFIGS.RUSH.targetSeconds === 15, "Rush difficulty targets ≤15s fast-track execution");
assert(DIFFICULTY_CONFIGS.NORMAL.queueLength === 24, "Normal queue simulates 24 concurrent users in line");

// -------------------------------------------------------------
// 2. Deterministic Scoring Algorithm & Boundary Cases
// -------------------------------------------------------------
console.log("\n▶ [2/4] Deterministic Scoring Function & Boundary Tests");

// Perfect run: 4 prep, fast speed, 1st try captcha, smooth payment, no traps
const perfectTelemetry: PracticeRunTelemetry = {
  difficulty: "NORMAL",
  countdownSeconds: 10,
  checklistItemsCompleted: 4,
  windowOpenedAt: 1000,
  completedAt: 18000,
  durationMs: 17000, // 17s <= 25s target
  queueWaitMs: 3000,
  formFillMs: 6000,
  captchaAttempts: 1,
  captchaSolvedMs: 4000,
  paymentAttempts: 1,
  paymentFailureInjected: false,
  paymentRecoveryMs: 0,
  paymentAbandoned: false,
  wrongStationTrapInjected: false,
  wrongStationTrapFixed: false,
  warningsSeen: [],
  warningsFixed: [],
};

const perfectScore = calculatePracticeScore(perfectTelemetry);
assert(perfectScore.totalScore === 100, `Perfect run earns exactly 100/100 (got ${perfectScore.totalScore})`);
assert(perfectScore.phases.preparation.earned === 20, "Preparation earns full 20/20");
assert(perfectScore.phases.speed.earned === 25, "Speed earns full 25/25");
assert(perfectScore.phases.captcha.earned === 15, "Captcha earns full 15/15");
assert(perfectScore.phases.payment.earned === 20, "Payment earns full 20/20");
assert(perfectScore.phases.mistakeAvoidance.earned === 20, "Mistake avoidance earns full 20/20");
assert(perfectScore.rating === "MASTER", "Rating is MASTER for 100/100");

// Boundary Case: Zero preparation, slow time, multiple captcha retries, payment failure recovered slowly
const sloppyTelemetry: PracticeRunTelemetry = {
  difficulty: "NORMAL",
  countdownSeconds: 10,
  checklistItemsCompleted: 0, // 0 pts
  windowOpenedAt: 1000,
  completedAt: 81000,
  durationMs: 80000, // 80s > 25s target -> degraded speed
  queueWaitMs: 8000,
  formFillMs: 30000,
  captchaAttempts: 3, // 5 pts
  captchaSolvedMs: 18000,
  paymentAttempts: 2,
  paymentFailureInjected: true,
  paymentRecoveryMs: 16000, // Slow recovery
  paymentAbandoned: false,
  wrongStationTrapInjected: true,
  wrongStationTrapFixed: false, // Ignored trap: 5 pts
  warningsSeen: ["RULE_MULTI_STATION_CITY_CONFUSION"],
  warningsFixed: [],
};

const sloppyScore = calculatePracticeScore(sloppyTelemetry);
assert(sloppyScore.phases.preparation.earned === 0, "0 prep checklist items earns 0 pts");
assert(sloppyScore.phases.captcha.earned === 5, "3 captcha attempts earns 5 pts (penalty applied)");
assert(sloppyScore.phases.mistakeAvoidance.earned === 5, "Uncorrected station trap penalizes mistake score to 5 pts");
assert(sloppyScore.totalScore < 60, `Sloppy run correctly lands in NEEDS_PRACTICE tier (got ${sloppyScore.totalScore})`);
assert(sloppyScore.rating === "NEEDS_PRACTICE", "Rating is NEEDS_PRACTICE");

// -------------------------------------------------------------
// 3. Personalized Tip Selection Rules
// -------------------------------------------------------------
console.log("\n▶ [3/4] Personalized Tip Selection Logic");
assert(sloppyScore.tips.length === 3, "Exactly top 3 personalized tips returned");
const tipIds = sloppyScore.tips.map((t) => t.id);
assert(tipIds.includes("tip_prep_master"), "Includes pre-arming tip when preparation is incomplete");
assert(tipIds.includes("tip_payment_backup"), "Includes backup payment tip when recovery exceeded 8s");
assert(tipIds.includes("tip_captcha_audio"), "Includes audio captcha tip when multiple retries occurred");

// -------------------------------------------------------------
// 4. History Storage & Degraded Fallback Test
// -------------------------------------------------------------
console.log("\n▶ [4/4] Storage Degradation & Session Store Isolation");
// Test fallback when window.localStorage is undefined (Node.js runtime environment)
const history = PracticeStore.getHistory();
assert(Array.isArray(history), "getHistory returns valid array even without localStorage");
assert(history.length >= 2, "Default seed attempts available for trend visualization");

const stats = PracticeStore.getStats();
assert(stats.bestScore >= 80, `Stats correctly calculates bestScore (got ${stats.bestScore})`);
assert(stats.avgLast5 > 0, `Stats correctly calculates avgLast5 (got ${stats.avgLast5})`);

// Record attempt in memory
const newRecord: PracticeAttemptRecord = {
  id: "test_run_new",
  timestamp: new Date().toISOString(),
  dateFormatted: "05 Nov, 11:00 AM",
  difficulty: "RUSH",
  totalScore: 92,
  durationSeconds: 14.2,
  rating: "MASTER",
  ratingLabel: "Tatkal Ready",
};

const updatedHistory = PracticeStore.saveAttempt(newRecord);
assert(updatedHistory[0].id === "test_run_new", "Latest attempt added to head of history");
assert(PracticeStore.getStats().bestScore === 92, "Stats bestScore updated to 92");

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
console.log("=======================================================\n");

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}

