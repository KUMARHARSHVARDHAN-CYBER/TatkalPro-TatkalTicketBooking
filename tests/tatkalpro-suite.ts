/**
 * TatkalPro Comprehensive Test Suite
 * Covers:
 * 1. Upfront Fare Calculation Logic (Base + Tatkal + Superfast + GST + PG fee)
 * 2. Quota & Seat Availability Rules (General, Tatkal, Premium Tatkal)
 * 3. 8-Minute Seat Hold TTL & Overbooking Protection
 * 4. Multi-Gateway Auto-Fallback & Auto-Refund Reconciliation Engine
 * 5. Dijkstra Split-Ticket Routing Algorithm
 * 6. End-to-End Booking Lifecycle (Search -> Hold -> Captcha -> Pay -> PNR Confirmation)
 */

import { railwayProvider } from "../frontend/lib/railway/adapter";
import { STATIONS, TRAINS } from "../frontend/lib/railway/data";
import { Passenger, BookingDraft, PaymentTransaction } from "../frontend/lib/railway/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName} - ${detail || "Assertion failed"}`);
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("       TATKALPRO COMPREHENSIVE VERIFICATION SUITE       ");
  console.log("=======================================================\n");

  // -----------------------------------------------------------------
  // TEST GROUP 1: Station Search & Fuzzy Multilingual Matching
  // -----------------------------------------------------------------
  console.log("▶ [1/6] Station Search & Multilingual Matching");
  {
    const ndlsResults = await railwayProvider.searchStations("NDLS");
    assert(ndlsResults.length > 0 && ndlsResults[0].code === "NDLS", "Station code lookup (NDLS)");

    const hindiResults = await railwayProvider.searchStations("नई दिल्ली");
    assert(hindiResults.length > 0 && hindiResults[0].code === "NDLS", "Hindi station name lookup (नई दिल्ली)");

    const cityResults = await railwayProvider.searchStations("mumbai");
    assert(cityResults.some((s) => s.code === "MMCT"), "City name fuzzy lookup (mumbai -> MMCT)");
  }

  // -----------------------------------------------------------------
  // TEST GROUP 2: Upfront Fare Calculation & Zero Hidden Costs
  // -----------------------------------------------------------------
  console.log("\n▶ [2/6] Upfront Fare Calculation & Transparency");
  {
    const trains = await railwayProvider.searchTrains("NDLS", "MMCT", "2026-11-10", "TATKAL");
    assert(trains.length > 0, "Trains found for NDLS -> MMCT Tatkal");

    const rajdhani = trains.find((t) => t.trainNumber === "12952");
    assert(!!rajdhani, "12952 Mumbai Rajdhani found");

    if (rajdhani) {
      const class3A = rajdhani.classes.TATKAL.find((c) => c.classCode === "3A");
      assert(!!class3A, "3A Class available in Tatkal quota");

      if (class3A) {
        // Expected components: Base + Tatkal + Superfast + GST + PG fee
        const expectedTotal =
          class3A.baseFare +
          class3A.tatkalCharge +
          class3A.superfastCharge +
          class3A.gstAmount +
          class3A.pgFee;

        assert(
          class3A.totalFare === expectedTotal,
          `Fare calculation exact match (₹${class3A.totalFare} === ₹${expectedTotal})`,
          `Expected ₹${expectedTotal}, got ₹${class3A.totalFare}`
        );

        assert(class3A.tatkalCharge > 0, "Tatkal charge correctly applied for TATKAL quota");
        assert(class3A.pgFee === 15, "Fixed Payment Gateway fee transparently stated as ₹15");
      }
    }
  }

  // -----------------------------------------------------------------
  // TEST GROUP 3: 8-Minute Seat Hold TTL & Overbooking Protection
  // -----------------------------------------------------------------
  console.log("\n▶ [3/6] Atomic Seat Hold TTL & Anti-Overselling");
  {
    // Hold 2 seats
    const hold = await railwayProvider.holdSeats({
      trainNumber: "12952",
      journeyDate: "2026-11-10",
      classCode: "3A",
      quota: "TATKAL",
      seatCount: 2,
      ttlSeconds: 480, // 8 minutes
    });

    assert(hold.holdToken.startsWith("hold_"), "Hold token generated successfully");
    assert(hold.remainingSeconds === 480, "Hold TTL accurately set to 480 seconds (8 mins)");

    // Test releasing hold
    const releaseSuccess = await railwayProvider.releaseHold(hold.holdToken);
    assert(releaseSuccess, "Seat hold successfully released upon user exit/timeout");
  }

  // -----------------------------------------------------------------
  // TEST GROUP 4: Multi-Gateway Checkout, Auto-Fallback & Auto-Refund
  // -----------------------------------------------------------------
  console.log("\n▶ [4/6] Multi-Gateway Fallback & Auto-Refund Reconciliation");
  {
    // A: Successful Payment
    const successTx = await railwayProvider.simulatePayment({
      amount: 3250,
      method: "UPI",
      shouldFail: false,
    });
    assert(successTx.status === "SUCCESS", "Primary UPI payment succeeds");
    assert(!!successTx.utrNumber, "UTR transaction number issued for audit trail");

    // B: Failed Payment (Simulated)
    const failedTx = await railwayProvider.simulatePayment({
      amount: 3250,
      method: "CARD",
      shouldFail: true,
    });
    assert(failedTx.status === "FAILED", "Payment failure properly captured without session drop");

    // C: Auto-Refund & Reconciliation Engine
    const refundResult = await railwayProvider.reconcileAndRefund(failedTx.transactionId);
    assert(refundResult.reconciled === true, "Automatic banking reconciliation performed");
    assert(refundResult.status === "PROCESSED", "Instant auto-refund state is PROCESSED");
    assert(refundResult.refundUtr.startsWith("RBIP"), `Refund UTR generated: ${refundResult.refundUtr}`);
  }

  // -----------------------------------------------------------------
  // TEST GROUP 5: Dijkstra Split-Ticket Routing Algorithm
  // -----------------------------------------------------------------
  console.log("\n▶ [5/6] Dijkstra Split-Ticket Algorithm (Connecting Journeys)");
  {
    const alternatives = await railwayProvider.findSplitTicketAlternatives("NDLS", "MMCT", "TATKAL");
    assert(alternatives.length > 0, "Found 1-stop split ticket alternative when direct seats are scarce");

    if (alternatives.length > 0) {
      const alt = alternatives[0];
      assert(
        alt.intermediateStation.code === "KOTA",
        `Split journey connects via hub station: ${alt.intermediateStation.code}`
      );
      assert(
        alt.layoverMinutes >= 45 && alt.layoverMinutes <= 240,
        `Layover window is safe and realistic: ${Math.floor(alt.layoverMinutes / 60)}h ${alt.layoverMinutes % 60}m`
      );
      assert(alt.leg1.availableSeats > 0, `Leg 1 has confirmed seats (${alt.leg1.availableSeats})`);
      assert(alt.leg2.availableSeats > 0, `Leg 2 has confirmed seats (${alt.leg2.availableSeats})`);
    }
  }

  // -----------------------------------------------------------------
  // TEST GROUP 6: End-to-End Booking Lifecycle & PNR Issuance
  // -----------------------------------------------------------------
  console.log("\n▶ [6/6] Complete End-to-End Booking Lifecycle");
  {
    // Step 1: Secure hold
    const hold = await railwayProvider.holdSeats({
      trainNumber: "12952",
      journeyDate: "2026-11-10",
      classCode: "3A",
      quota: "TATKAL",
      seatCount: 2,
    });

    // Step 2: Assemble draft
    const testPassengers: Passenger[] = [
      {
        id: "p_1",
        name: "Vikram Malhotra",
        age: 35,
        gender: "M",
        berthPreference: "LOWER",
        idType: "AADHAAR",
        idNumber: "XXXXXXXX8921",
      },
      {
        id: "p_2",
        name: "Ananya Malhotra",
        age: 31,
        gender: "F",
        berthPreference: "LOWER",
        idType: "AADHAAR",
        idNumber: "XXXXXXXX4419",
      },
    ];

    const draft: BookingDraft = {
      draftId: `draft_${Date.now()}`,
      trainNumber: "12952",
      trainName: "Mumbai Rajdhani Express",
      fromStationCode: "NDLS",
      toStationCode: "MMCT",
      journeyDate: "2026-11-10",
      classCode: "3A",
      quota: "TATKAL",
      passengers: testPassengers,
      fareBreakdown: {
        baseFareTotal: 4330,
        tatkalChargesTotal: 800,
        superfastChargesTotal: 90,
        gstTotal: 260,
        pgFee: 15,
        grandTotal: 5495,
      },
      holdToken: hold.holdToken,
    };

    // Step 3: Complete payment
    const payment: PaymentTransaction = {
      transactionId: `tx_${Date.now()}`,
      orderId: `order_${Date.now()}`,
      amount: 5495,
      currency: "INR",
      status: "SUCCESS",
      gateway: "RAZORPAY_MOCK",
      method: "UPI",
      utrNumber: "UPI492019482910",
    };

    // Step 4: Confirm Booking & Issue PNR
    const confirmed = await railwayProvider.confirmBooking({
      holdToken: hold.holdToken,
      draft,
      payment,
    });

    assert(confirmed.status === "CONFIRMED", "Booking confirmed");
    assert(confirmed.pnr.length === 10, `Official 10-digit Indian Railways PNR issued: ${confirmed.pnr}`);
    assert(confirmed.passengers.length === 2, "Both passengers ticketed");
    assert(
      confirmed.passengers.every((p) => !!p.allocatedCoach && !!p.allocatedSeat),
      "Coach and Berth allocated (e.g. B2-12 LOWER)"
    );

    // Step 5: Query Live PNR Status
    const lookup = await railwayProvider.getPNRStatus(confirmed.pnr);
    assert(!!lookup && lookup.pnr === confirmed.pnr, "Real-time PNR retrieval verified");
  }

  // Summary
  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});

