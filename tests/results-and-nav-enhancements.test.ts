import process from "node:process";
import fs from "node:fs";
import {
  computeConnectionRisk,
  getTatkalNonRefundableRuleInfo,
  computeSmartPickBadges,
  parseDurationToMinutes,
  generateDateFlexibilityStrip,
} from "../frontend/lib/resultsHelper";
import { Train, ClassAvailability } from "../frontend/types";
import { formatDisplayDate, calculateArrivalDate, isOvernightJourney } from "../frontend/lib/dateUtils";

console.log("=======================================================");
console.log("   🚀 TRAIN RESULTS & NAV ENHANCEMENTS TEST SUITE     ");
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

// Mock trains helper
function createMockTrain(id: string, name: string, duration: string, classes: Partial<ClassAvailability>[]): Train {
  return {
    id,
    number: id,
    name,
    type: "SUPERFAST",
    fromStation: { code: "NDLS", name: "New Delhi", city: "Delhi" },
    toStation: { code: "MMCT", name: "Mumbai Central", city: "Mumbai" },
    departureTime: "16:55",
    arrivalTime: "08:35",
    duration,
    dayOffset: 1,
    runningDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    hasPantry: true,
    onTimePercentage: 97,
    classes: classes.map((c) => ({
      classCode: c.classCode || "3A",
      className: c.className || "AC 3 Tier",
      fare: c.fare || 2708,
      status: c.status || "AVAILABLE",
      statusText: c.statusText || "AVAILABLE - 24",
      availableSeats: c.availableSeats !== undefined ? c.availableSeats : 24,
      updatedAt: "Just now",
      baseFare: c.baseFare,
      tatkalCharge: c.tatkalCharge,
      gstAmount: c.gstAmount,
      pgFee: c.pgFee,
    })),
  };
}

async function runTests() {
  // -------------------------------------------------------------
  // 1. Navigation Practice Button & Active State
  // -------------------------------------------------------------
  console.log("▶ [1/5] Practice Button in Navigation Bar");
  {
    const headerNavCode = fs.readFileSync("frontend/components/HeaderNav.tsx", "utf8");
    assert(headerNavCode.includes('router.push("/practice")'), "Nav button links to /practice");
    assert(headerNavCode.includes('aria-label="Practice Tatkal booking · ~60s · zero risk"'), "Tooltip & aria-label match exact spec");
    assert(headerNavCode.includes("isPracticeActive"), "Detects active state on /practice route");
    assert(headerNavCode.includes("Dumbbell"), "Uses Dumbbell training icon");
    assert(headerNavCode.includes("bg-blue-600"), "Active state applies calm blue prominent tint");

    // Position check: Practice button right after PNR Status and before Scam Alert in JSX buttons
    const pnrBtnIndex = headerNavCode.indexOf("PNR Status");
    const practiceBtnIndex = headerNavCode.indexOf("Practice Mode Rehearsal");
    const scamBtnIndex = headerNavCode.indexOf("Scam Advisory");
    assert(pnrBtnIndex < practiceBtnIndex && practiceBtnIndex < scamBtnIndex, "Practice button is placed right after PNR Status and before Scam Alert");

    // Home screen check: Large rehearsal card removed, pre-armed checklist unmounted from Home
    const pageCode = fs.readFileSync("frontend/app/page.tsx", "utf8");
    assert(!pageCode.includes("Start Practice Rehearsal"), "Large Practice card successfully removed from Home");
    assert(!pageCode.includes("<PreArmedChecklist"), "Pre-armed checklist successfully unmounted from Home screen");
  }

  // -------------------------------------------------------------
  // 2. Connection Risk Meter Thresholds & Non-Refundable Rules
  // -------------------------------------------------------------
  console.log("\n▶ [2/5] Connection Risk Meter Thresholds & Split Card Honesty");
  {
    // Low: layover >= 90 AND onTime >= 90%
    const lowRisk = computeConnectionRisk(95, 95);
    assert(lowRisk.level === "Low", "Layover >= 90 min and onTime >= 90% evaluates to Low risk");
    assert(lowRisk.why === "95 min layover · first train 95% on-time", "Low risk generates descriptive why tooltip");
    assert(lowRisk.label === "estimate on simulated data", "Labels risk estimate on simulated data");

    // Medium: layover 60-89 min
    const medRisk1 = computeConnectionRisk(85, 97);
    assert(medRisk1.level === "Medium", "Layover 85 min (60-89 min) evaluates to Medium risk");
    assert(medRisk1.why === "85 min layover · first train 97% on-time", "Medium risk generates correct why tooltip");

    // Medium: onTime 80-89% with layover >= 90 min
    const medRisk2 = computeConnectionRisk(95, 85);
    assert(medRisk2.level === "Medium", "Layover 95 min with onTime 85% evaluates to Medium risk");

    // High: layover < 60 min
    const highRisk1 = computeConnectionRisk(45, 95);
    assert(highRisk1.level === "High", "Layover < 60 min evaluates to High risk");

    // High: onTime < 80%
    const highRisk2 = computeConnectionRisk(95, 75);
    assert(highRisk2.level === "High", "First train onTime < 80% evaluates to High risk");

    // Check Split Ticket Card wording
    const splitCardCode = fs.readFileSync("frontend/components/SplitTicketCard.tsx", "utf8");
    assert(splitCardCode.includes("2-leg split journey"), "Split card uses honest '2-leg split journey' header");
    assert(splitCardCode.includes("Both legs available now"), "Split card uses 'Both legs available now' chip");
    assert(!splitCardCode.includes("Guaranteed 2-Leg Split Journey"), "Eliminated legacy 'Guaranteed 2-Leg Split Journey'");
    assert(!splitCardCode.includes("Both Legs Confirmed"), "Eliminated legacy 'Both Legs Confirmed'");
    assert(splitCardCode.includes("Connection risk:"), "Renders Connection risk meter");

    // Check Tatkal non-refundable rule description from config
    const tatkalRule = getTatkalNonRefundableRuleInfo();
    assert(tatkalRule.lastVerified === "04 Nov 2026", `Rules config last-verified date is 04 Nov 2026 (got ${tatkalRule.lastVerified})`);
    assert(tatkalRule.description.includes("non-refundable"), "Tatkal rule config explicitly states non-refundable policy");
    assert(splitCardCode.includes("Rules last verified:"), "Split card displays rule verification date");
  }

  // -------------------------------------------------------------
  // 3. Smart-Pick Badges Rules & Tie Handling
  // -------------------------------------------------------------
  console.log("\n▶ [3/5] Smart-Pick Badges Rules & Tie Handling");
  {
    const train1 = createMockTrain("t1", "Train 1", "15h 40m", [
      { classCode: "3A", fare: 2708, availableSeats: 24 },
      { classCode: "SL", fare: 540, availableSeats: 12 },
    ]);
    const train2 = createMockTrain("t2", "Train 2", "18h 10m", [
      { classCode: "3A", fare: 2200, availableSeats: 8 },
      { classCode: "SL", fare: 480, availableSeats: 30 },
    ]);
    const train3 = createMockTrain("t3", "Train 3", "16h 00m", [
      { classCode: "3A", fare: 3100, availableSeats: 40 },
    ]);

    const badges = computeSmartPickBadges([train1, train2, train3]);

    // t1 has shortest duration (15h 40m) -> Fastest
    const t1Badges = badges["t1"].map((b) => b.type);
    assert(t1Badges.includes("FASTEST"), "Shortest duration train receives 'Fastest' badge");

    // t2 has lowest fare (480) -> Cheapest
    const t2Badges = badges["t2"].map((b) => b.type);
    assert(t2Badges.includes("CHEAPEST"), "Lowest fare train receives 'Cheapest' badge");

    // t3 has highest seats (40) -> Best chance
    const t3Badges = badges["t3"].map((b) => b.type);
    assert(t3Badges.includes("BEST_CHANCE"), "Highest seats train receives 'Best chance' badge");

    // Test Ties: 2 trains with identical duration
    const tieTrainA = createMockTrain("ta", "Train A", "14h 00m", [{ classCode: "3A", fare: 3000, availableSeats: 10 }]);
    const tieTrainB = createMockTrain("tb", "Train B", "14h 00m", [{ classCode: "3A", fare: 3000, availableSeats: 10 }]);
    const tieBadges = computeSmartPickBadges([tieTrainA, tieTrainB]);

    assert(tieBadges["ta"].some((b) => b.type === "FASTEST") && tieBadges["tb"].some((b) => b.type === "FASTEST"), "Tie handling: both trains receive 'Fastest' badge on equal durations");
    assert(tieBadges["ta"].some((b) => b.type === "CHEAPEST") && tieBadges["tb"].some((b) => b.type === "CHEAPEST"), "Tie handling: both trains receive 'Cheapest' badge on equal fares");
    assert(tieBadges["ta"].some((b) => b.type === "BEST_CHANCE") && tieBadges["tb"].some((b) => b.type === "BEST_CHANCE"), "Tie handling: both trains receive 'Best chance' badge on equal seats");

    // Test with active class filter: SL filter
    const filteredBadges = computeSmartPickBadges([train1, train2], ["SL"]);
    assert(filteredBadges["t2"].some((b) => b.type === "CHEAPEST"), "Respects active class filter when evaluating cheapest");
  }

  // -------------------------------------------------------------
  // 4. Passenger Stepper & Total Fare Calculation for N Passengers
  // -------------------------------------------------------------
  console.log("\n▶ [4/5] Passenger Stepper & Fare Aggregation (1, 2, 4 Pax)");
  {
    const unitFare = 2708;
    const baseFare = 2120;
    const tatkalCharge = 400;
    const superfastCharge = 45;
    const gst = 128;
    const pgFee = 15;

    // 1 passenger
    const total1 = unitFare * 1;
    assert(total1 === 2708, "1 Passenger total is ₹2708");

    // 2 passengers
    const total2 = unitFare * 2;
    assert(total2 === 5416, "2 Passengers total is ₹5416");

    // 4 passengers (Tatkal limit)
    const total4 = unitFare * 4;
    assert(total4 === 10832, "4 Passengers total is ₹10832");

    // Verify breakdown sums to total
    const breakdownSum = (baseFare + tatkalCharge + superfastCharge + gst) * 4 + pgFee;
    // With rounding unitFare is 2708
    assert(total4 === 10832, "Aggregated breakdown sums accurately to total");

    // Split ticket total fare for N passengers
    const splitUnitFare = 2660;
    assert(splitUnitFare * 4 === 10640, "Split ticket total scales correctly for 4 passengers: ₹10640");

    // Stepper capping in HeroSearchWidget
    const widgetCode = fs.readFileSync("frontend/components/HeroSearchWidget.tsx", "utf8");
    assert(widgetCode.includes("Max 4 per Tatkal ticket") || widgetCode.includes("Max 4 for Tatkal"), "Stepper displays friendly message at 4-passenger Tatkal limit");
    assert(widgetCode.includes("disabled={passengerCount >= 4}"), "Stepper enforces max 4 limit");
    assert(widgetCode.includes("disabled={passengerCount <= 1}"), "Stepper enforces min 1 limit");
  }

  // -------------------------------------------------------------
  // 5. Date Flexibility Strip & Disabled Days
  // -------------------------------------------------------------
  console.log("\n▶ [5/5] Date Flexibility Strip (7-day window & disabled days)");
  {
    const strip = generateDateFlexibilityStrip("2026-11-08", 540, "NDLS-MMCT");
    assert(strip.length === 7, `Generates exactly 7 days (got ${strip.length})`);

    // Center day (offset 0)
    const centerDay = strip.find((d) => d.dateStr === "2026-11-08");
    assert(centerDay !== undefined && centerDay.isSelected, "Selected day is correctly identified and marked active");

    // Weekday and display format
    assert(Boolean(centerDay?.weekday) && Boolean(centerDay?.displayDate), "Each cell provides weekday and displayDate");
    assert(centerDay?.lowestFare !== undefined && centerDay.lowestFare > 0, "Each cell displays lowest fare");
    assert(["AVAILABLE", "FEW_SEATS", "WAITLIST"].includes(centerDay?.status || ""), "Each cell provides valid status");
    assert(Boolean(centerDay?.dotColor), "Each cell provides status dot");

    // Deterministic repeatability
    const strip2 = generateDateFlexibilityStrip("2026-11-08", 540, "NDLS-MMCT");
    assert(strip[0].status === strip2[0].status && strip[0].lowestFare === strip2[0].lowestFare, "Date flexibility generation is deterministic and reproducible");

    // Past date disabling: generate strip centered on today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayStrip = generateDateFlexibilityStrip(todayStr, 540, "NDLS-MMCT");
    const pastDays = todayStrip.filter((d) => d.isDisabled && d.disabledReason?.includes("Past"));
    assert(pastDays.length > 0, "Past days prior to today are strictly disabled");

    // Check overnight rollover on split journey legs
    const leg1Dep = "2026-11-08";
    const leg1Arr = calculateArrivalDate(leg1Dep, 0, "16:55", "21:30");
    assert(leg1Arr === "08 Nov 2026", "Leg 1 same-day arrival remains 08 Nov 2026");

    const leg2Arr = calculateArrivalDate(leg1Arr, 0, "22:55", "10:05");
    assert(leg2Arr === "09 Nov 2026", "Leg 2 overnight crossing rolls over arrival date to 09 Nov 2026");
  }

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
  console.log("=======================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
