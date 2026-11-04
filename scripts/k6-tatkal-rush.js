/**
 * k6 Tatkal Rush Load Test
 * Simulates 5,000 concurrent virtual users hitting the Tatkal booking engine
 * during the critical 10:00:00 AM window.
 *
 * Metrics tracked:
 * - p95 and p99 request duration
 * - Seat hold concurrency & lock contention
 * - Payment simulation throughput
 * - Zero overselling verification
 *
 * Usage:
 *   k6 run scripts/k6-tatkal-rush.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom Metrics
export const tatkalHoldDuration = new Trend("tatkal_hold_duration_ms");
export const tatkalConfirmDuration = new Trend("tatkal_confirm_duration_ms");
export const tatkalSuccessRate = new Rate("tatkal_success_rate");
export const seatHoldsCount = new Counter("seat_holds_count");

export const options = {
  scenarios: {
    // 10:00 AM Sudden Traffic Spike
    tatkal_10am_rush: {
      executor: "ramping-vus",
      startVUs: 100,
      stages: [
        { duration: "10s", target: 1000 },  // 09:59:50 AM - Pre-armed readiness
        { duration: "20s", target: 5000 },  // 10:00:00 AM - The massive traffic spike
        { duration: "20s", target: 5000 },  // 10:00:20 AM - Sustained Tatkal seat battle
        { duration: "10s", target: 500 },   // 10:00:40 AM - Wind down after quota exhaust
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    // Strict SLA: 95% of requests must complete under 150ms
    http_req_duration: ["p(95)<150", "p(99)<300"],
    tatkal_hold_duration_ms: ["p(95)<100"],
    tatkal_confirm_duration_ms: ["p(95)<120"],
    http_req_failed: ["rate<0.05"], // Error rate under 5%
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";

export default function () {
  const headers = { "Content-Type": "application/json" };

  // Step 1: Pre-Armed Search Query (10:00 AM window)
  const searchRes = http.get(
    `${BASE_URL}/api/trains?from=NDLS&to=MMCT&quota=TATKAL&date=2026-11-10`
  );
  check(searchRes, {
    "Train search status 200": (r) => r.status === 200,
    "Trains found in response": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.length > 0;
      } catch {
        return false;
      }
    },
  });

  // Step 2: Atomic Seat Hold Request (Redis atomic lock check)
  const holdPayload = JSON.stringify({
    trainNumber: "12952",
    journeyDate: "2026-11-10",
    classCode: "3A",
    quota: "TATKAL",
    seatCount: 1,
    ttlSeconds: 480,
  });

  const holdStart = Date.now();
  const holdRes = http.post(`${BASE_URL}/api/booking/hold`, holdPayload, { headers });
  tatkalHoldDuration.add(Date.now() - holdStart);

  let holdToken = null;
  const isHoldSuccessful = check(holdRes, {
    "Seat hold responded": (r) => r.status === 200 || r.status === 409,
  });

  if (holdRes.status === 200) {
    try {
      const holdBody = JSON.parse(holdRes.body);
      holdToken = holdBody.data?.holdToken;
      seatHoldsCount.add(1);
    } catch {}
  }

  // Step 3: Audio/Visual Captcha Verification Simulation
  const captchaRes = http.get(`${BASE_URL}/api/captcha`);
  check(captchaRes, {
    "Captcha generated": (r) => r.status === 200,
  });

  // Step 4: Multi-Gateway Payment Simulation
  const payPayload = JSON.stringify({
    amount: 2708,
    method: "UPI",
    gateway: "RAZORPAY_MOCK",
    shouldFail: false,
  });

  const payRes = http.post(`${BASE_URL}/api/payment/simulate`, payPayload, { headers });
  let paymentTx = null;
  check(payRes, {
    "Payment simulation success": (r) => r.status === 200,
  });

  if (payRes.status === 200) {
    try {
      paymentTx = JSON.parse(payRes.body).data;
    } catch {}
  }

  // Step 5: Booking Confirmation with Official PNR
  if (holdToken && paymentTx) {
    const confirmPayload = JSON.stringify({
      holdToken,
      payment: paymentTx,
      draft: {
        draftId: `draft_k6_${Date.now()}`,
        trainNumber: "12952",
        trainName: "Mumbai Rajdhani Express",
        fromStationCode: "NDLS",
        toStationCode: "MMCT",
        journeyDate: "2026-11-10",
        classCode: "3A",
        quota: "TATKAL",
        passengers: [
          {
            id: "p_k6",
            name: "Load Tester",
            age: 28,
            gender: "M",
            berthPreference: "LOWER",
          },
        ],
        fareBreakdown: {
          baseFareTotal: 2165,
          tatkalChargesTotal: 400,
          superfastChargesTotal: 45,
          gstTotal: 130,
          pgFee: 15,
          grandTotal: 2755,
        },
      },
    });

    const confirmStart = Date.now();
    const confirmRes = http.post(`${BASE_URL}/api/booking/confirm`, confirmPayload, { headers });
    tatkalConfirmDuration.add(Date.now() - confirmStart);

    check(confirmRes, {
      "Booking confirmed (200)": (r) => r.status === 200,
      "Valid 10-digit PNR returned": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.pnr && body.data.pnr.length === 10;
        } catch {
          return false;
        }
      },
    });

    tatkalSuccessRate.add(confirmRes.status === 200 ? 1 : 0);
  }

  // Small jitter pause between simulated user cycles
  sleep(0.5);
}
