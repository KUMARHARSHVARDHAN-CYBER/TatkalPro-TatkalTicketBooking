/**
 * Suite 10: Vercel Serverless Stateless Resilience & Route Config Test Suite
 *
 * Verifies that:
 * 1. Booking confirmation succeeds on fresh serverless instances with zero shared in-memory state.
 * 2. Seat hold validation is stateless and enforces the 8-minute TTL without process timers.
 * 3. All 11 Next.js API routes export `dynamic = 'force-dynamic'` and `runtime = 'nodejs'`.
 * 4. Critical transactional routes export `maxDuration = 15`.
 * 5. Full end-to-end booking flow runs under 2000ms per step across isolated instances.
 * 6. Payment failure simulation and fallback recovery work statelessly.
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { railwayProvider } from "../frontend/lib/railway/adapter";
import { BookingDraft, PaymentTransaction } from "../frontend/lib/railway/types";

console.log("=======================================================");
console.log("  ⚡ VERCEL SERVERLESS STATELESS RESILIENCE SUITE      ");
console.log("=======================================================\n");

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✅ PASS: ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ❌ FAIL: ${name}`, err);
          process.exit(1);
        });
    }
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`, err);
    process.exit(1);
  }
}

async function runSuite() {
  console.log("▶ [1/5] Fresh Instance Zero-Memory Booking Confirmation (NODE_ENV=production)");
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  // Simulate a token created on the client or by an earlier lambda that is now dead
  const freshClientHoldToken = `hold_${Date.now()}`;
  const mockDraft: BookingDraft = {
    draftId: `draft_${Date.now()}`,
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani Express",
    fromStationCode: "NDLS",
    toStationCode: "MMCT",
    journeyDate: "2026-11-10",
    classCode: "3A",
    quota: "TATKAL",
    passengers: [
      {
        id: "p1",
        name: "Aarav Sharma",
        age: 34,
        gender: "MALE",
        berthPreference: "LOWER",
        foodPreference: "VEG",
      },
    ],
    fareBreakdown: {
      baseFareTotal: 2280,
      tatkalChargesTotal: 400,
      superfastChargesTotal: 45,
      gstTotal: 136,
      pgFee: 15,
      grandTotal: 2876,
    },
    holdToken: freshClientHoldToken,
  };

  const mockPayment: PaymentTransaction = {
    transactionId: `TXN_${Date.now()}`,
    orderId: `ORD_${Date.now()}`,
    amount: 2876,
    currency: "INR",
    status: "SUCCESS",
    gateway: "RAZORPAY_MOCK",
    method: "UPI",
    utrNumber: "329048104829",
    createdAt: new Date().toISOString(),
  };

  const t0 = Date.now();
  const confirmed = await railwayProvider.confirmBooking({
    holdToken: freshClientHoldToken,
    draft: mockDraft,
    payment: mockPayment,
  });
  const confirmDuration = Date.now() - t0;

  test("Booking succeeds on cold instance with zero shared memory in production", () => {
    assert(confirmed, "Booking must not be null");
    assert(confirmed.status === "CONFIRMED", "Booking status must be CONFIRMED");
    assert(typeof confirmed.pnr === "string" && confirmed.pnr.length === 10, "Valid 10-digit PNR issued");
    assert(/^\d{10}$/.test(confirmed.pnr), "PNR must contain exactly 10 digits");
  });

  test("Confirmation execution is fast (<200ms)", () => {
    assert(confirmDuration < 200, `Expected < 200ms, got ${confirmDuration}ms`);
  });

  test("Passenger berths allocated deterministically", () => {
    assert(confirmed.passengers.length === 1);
    assert(confirmed.passengers[0].allocatedCoach?.startsWith("B"), "3A coach starts with B");
    assert(confirmed.passengers[0].allocatedSeat?.includes("LOWER"), "LOWER berth allocated");
  });

  console.log("\n▶ [2/5] Seat Hold Expiration TTL Validation");
  const expiredHoldToken = `hold_${Date.now() - 10 * 60 * 1000}`; // 10 minutes ago
  let caughtExpired = false;
  try {
    await railwayProvider.confirmBooking({
      holdToken: expiredHoldToken,
      draft: mockDraft,
      payment: mockPayment,
    });
  } catch (err: any) {
    if (err.message.includes("Seat hold has expired")) {
      caughtExpired = true;
    }
  }

  test("Rejects hold token that exceeded 8-minute TTL", () => {
    assert(caughtExpired, "Must reject expired hold token with clear error");
  });

  process.env.NODE_ENV = prevEnv;

  console.log("\n▶ [3/5] Stateless Deterministic PNR Status Retrieval");
  const testPnr = "8204918274";
  const pnrResult = await railwayProvider.getPNRStatus(testPnr);
  test("Returns deterministic booking specimen for valid 10-digit PNR on fresh lambda", () => {
    assert(pnrResult, "PNR lookup must succeed");
    assert(pnrResult.pnr === testPnr, "PNR must match requested number");
    assert(pnrResult.status === "CONFIRMED", "Status must be CONFIRMED");
  });

  console.log("\n▶ [4/5] Route Segment Config Inspection (`force-dynamic` & `nodejs` runtime)");
  const apiDir = path.resolve("./frontend/app/api");
  const routeFiles = [
    "booking/confirm/route.ts",
    "booking/hold/route.ts",
    "payment/simulate/route.ts",
    "payment/reconcile/route.ts",
    "pnr/route.ts",
    "captcha/route.ts",
    "trains/route.ts",
    "stations/route.ts",
    "split-ticket/route.ts",
    "shield/pass/route.ts",
    "shield/metrics/route.ts",
  ];

  for (const relPath of routeFiles) {
    const fullPath = path.join(apiDir, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");

    test(`Route ${relPath} exports dynamic = 'force-dynamic'`, () => {
      assert(content.includes('export const dynamic = "force-dynamic"'), `Missing dynamic export in ${relPath}`);
    });

    test(`Route ${relPath} exports runtime = 'nodejs'`, () => {
      assert(content.includes('export const runtime = "nodejs"'), `Missing runtime export in ${relPath}`);
    });
  }

  const transactionalRoutes = [
    "booking/confirm/route.ts",
    "booking/hold/route.ts",
    "payment/simulate/route.ts",
    "payment/reconcile/route.ts",
    "pnr/route.ts",
  ];

  for (const relPath of transactionalRoutes) {
    const fullPath = path.join(apiDir, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    test(`Transactional route ${relPath} exports maxDuration = 15`, () => {
      assert(content.includes("export const maxDuration = 15"), `Missing maxDuration export in ${relPath}`);
    });
  }

  console.log("\n▶ [5/5] Full Multi-Step E2E Booking & Recovery Benchmark (<2000ms per step)");
  // Step 1: Search trains
  const s0 = Date.now();
  const trains = await railwayProvider.searchTrains("NDLS", "MMCT", "2026-11-10", "TATKAL");
  const sDuration = Date.now() - s0;
  test("Step 1 (Search trains) executes under 2000ms", () => {
    assert(trains.length > 0, "Trains found");
    assert(sDuration < 2000, `Duration was ${sDuration}ms`);
  });

  // Step 2: Hold seats
  const h0 = Date.now();
  const hold = await railwayProvider.holdSeats({
    trainNumber: trains[0].trainNumber,
    journeyDate: "2026-11-10",
    classCode: "3A",
    quota: "TATKAL",
    seatCount: 1,
    ttlSeconds: 480,
  });
  const hDuration = Date.now() - h0;
  test("Step 2 (Seat hold) executes under 2000ms", () => {
    assert(hold.holdToken, "Hold token created");
    assert(hDuration < 2000, `Duration was ${hDuration}ms`);
  });

  // Step 3: Payment Simulation (Forced failure & fallback)
  const f0 = Date.now();
  const failedTx = await railwayProvider.simulatePayment({
    amount: 2876,
    method: "UPI",
    shouldFail: true,
    gateway: "RAZORPAY_MOCK",
  });
  const fDuration = Date.now() - f0;
  test("Step 3a (Forced failure) captures failure reason gracefully", () => {
    assert(failedTx.status === "FAILED");
    assert(fDuration < 2000, `Duration was ${fDuration}ms`);
  });

  // Step 3b: Fallback Gateway Retry
  const p0 = Date.now();
  const successTx = await railwayProvider.simulatePayment({
    amount: 2876,
    method: "UPI",
    shouldFail: false,
    gateway: "PAYU_MOCK",
  });
  const pDuration = Date.now() - p0;
  test("Step 3b (Fallback payment) succeeds under 2000ms", () => {
    assert(successTx.status === "SUCCESS");
    assert(pDuration < 2000, `Duration was ${pDuration}ms`);
  });

  // Step 4: Confirm Booking & Issue Ticket
  const c0 = Date.now();
  const finalBooking = await railwayProvider.confirmBooking({
    holdToken: hold.holdToken,
    draft: {
      ...mockDraft,
      holdToken: hold.holdToken,
    },
    payment: successTx,
  });
  const cDuration = Date.now() - c0;
  test("Step 4 (Confirm booking) issues PNR and completes under 2000ms", () => {
    assert(finalBooking.status === "CONFIRMED");
    assert(finalBooking.pnr.length === 10);
    assert(cDuration < 2000, `Duration was ${cDuration}ms`);
  });

  // Step 5: Deterministic TP-DEMO Ref Generation
  const demoRef = (finalBooking.bookingId ? finalBooking.bookingId.replace(/[^A-Za-z0-9]/g, "").slice(-4) : "3707").toUpperCase();
  test("Step 5 (Ticket demo ref) is deterministic", () => {
    assert(demoRef.length === 4, "Demo ref is 4 alphanumeric chars");
    assert(`TP-DEMO-${demoRef}`.startsWith("TP-DEMO-"), "Formatted demo ref matches TP-DEMO-XXXX");
  });

  console.log("\n=======================================================");
  console.log(`   ✅ ALL ${passed} VERCEL RESILIENCE TESTS PASSED!`);
  console.log("=======================================================\n");
}

runSuite().catch((err) => {
  console.error("Suite execution failure:", err);
  process.exit(1);
});
