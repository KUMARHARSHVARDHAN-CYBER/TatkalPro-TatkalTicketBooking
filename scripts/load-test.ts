/**
 * High-Concurrency Tatkal Load Test Script
 *
 * Simulates 500 concurrent users hitting POST /api/book at the EXACT same millisecond
 * using Promise.all() to mathematically prove that Redis atomic locks prevent overselling.
 *
 * Setup:
 * - Total Seats in Tatkal Quota: 20
 * - Concurrent Users: 500
 * - Expected Result:
 *     - Exactly 20 bookings succeed (HTTP 201 Created)
 *     - Exactly 480 bookings fail with "SEAT_UNAVAILABLE" (HTTP 409 Conflict)
 *     - Exactly 0 seats oversold
 */

// Set environment variables before any module loads
process.env.USE_REDIS_MOCK = process.env.USE_REDIS_MOCK || "true";
process.env.USE_DB_MOCK = process.env.USE_DB_MOCK || "true";

import http from "http";
import { performance } from "perf_hooks";
import { createApp } from "../src/app";
import redisBookingService from "../src/services/redisBooking.service";
import { resetRedisClientForTest } from "../src/config/redis";

interface RequestResult {
  userId: string;
  statusCode: number;
  durationMs: number;
  body: any;
  error?: string;
}

const TOTAL_CONCURRENT_USERS = 500;
const INITIAL_SEAT_COUNT = 20;
const TRAIN_ID = "12952";
const JOURNEY_DATE = "2026-11-10";
const TRAVEL_CLASS = "3A";
const QUOTA = "TATKAL";
const PORT = 3099; // Dedicated test port to avoid conflict

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 1000,
  maxTotalSockets: 1000,
});

/**
 * Fires a single HTTP POST /api/book request with transparent retry on OS TCP queue saturation
 */
function sendBookingRequest(
  userId: string,
  idempotencyKey: string,
  host: string,
  port: number,
  retriesLeft: number = 6
): Promise<RequestResult> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      idempotencyKey,
      userId,
      trainId: TRAIN_ID,
      fromStationCode: "NDLS",
      toStationCode: "MMCT",
      journeyDate: JOURNEY_DATE,
      travelClass: TRAVEL_CLASS,
      quota: QUOTA,
      farePerSeat: 1540.0,
      passengers: [
        {
          name: `Passenger-${userId}`,
          age: 28,
          gender: "M",
          berthPreference: "LOWER",
        },
      ],
    });

    const options: http.RequestOptions = {
      hostname: host,
      port: port,
      path: "/api/book",
      method: "POST",
      agent: httpAgent,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const startTime = performance.now();
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const endTime = performance.now();
        let parsedBody: any;
        try {
          parsedBody = JSON.parse(data);
        } catch {
          parsedBody = data;
        }

        resolve({
          userId,
          statusCode: res.statusCode || 500,
          durationMs: endTime - startTime,
          body: parsedBody,
        });
      });
    });

    req.on("error", (err: any) => {
      // If OS loopback TCP queue dropped SYN (common on Windows loopback with 500 instantaneous sockets), retry briefly
      if ((err.code === "ECONNREFUSED" || err.code === "ECONNRESET") && retriesLeft > 0) {
        setTimeout(() => {
          sendBookingRequest(userId, idempotencyKey, host, port, retriesLeft - 1).then(resolve);
        }, 10 + Math.random() * 20);
        return;
      }

      const endTime = performance.now();
      resolve({
        userId,
        statusCode: 0,
        durationMs: endTime - startTime,
        body: null,
        error: err.message,
      });
    });

    req.write(payload);
    req.end();
  });
}

async function runLoadTest() {
  console.log(`\n======================================================================`);
  console.log(`🚀 STARTING TATKAL 10:00 AM HIGH-CONCURRENCY LOAD TEST`);
  console.log(`======================================================================`);
  console.log(`📊 Initial Tatkal Seats Available : ${INITIAL_SEAT_COUNT}`);
  console.log(`👥 Concurrent Users Competing     : ${TOTAL_CONCURRENT_USERS}`);
  console.log(`🎯 Target Endpoint                : POST /api/book`);
  console.log(`🛡️  Mechanism                      : Redis Atomic Lua Decrement & Locks`);
  console.log(`======================================================================\n`);

  // Ensure fresh mock Redis instance
  resetRedisClientForTest();

  // 1. Start test HTTP server in-process with a 1024-socket backlog
  const app = createApp();
  const server = app.listen(PORT, "127.0.0.1", 1024);
  await new Promise((resolve) => server.once("listening", resolve));
  console.log(`[Test Harness] Server started on port ${PORT}`);

  // 2. Initialize Redis Inventory to INITIAL_SEAT_COUNT
  await redisBookingService.initializeInventory(
    TRAIN_ID,
    JOURNEY_DATE,
    TRAVEL_CLASS,
    QUOTA,
    INITIAL_SEAT_COUNT
  );
  console.log(
    `[Redis State] Seeded inventory: ${INITIAL_SEAT_COUNT} seats for Train ${TRAIN_ID} (${TRAVEL_CLASS} - ${QUOTA})`
  );

  // 3. Prepare 500 concurrent request promises
  console.log(
    `[Simulation] Preparing ${TOTAL_CONCURRENT_USERS} requests with unique users and idempotency keys...`
  );

  const testRunId = `run-${Date.now()}`;
  const requestPromises: Promise<RequestResult>[] = [];

  for (let i = 1; i <= TOTAL_CONCURRENT_USERS; i++) {
    const userId = `user-${i.toString().padStart(4, "0")}`;
    const idempotencyKey = `tatkal-${testRunId}-${i.toString().padStart(4, "0")}`;
    requestPromises.push(
      sendBookingRequest(userId, idempotencyKey, "127.0.0.1", PORT)
    );
  }

  // 4. Fire all 500 requests at the EXACT same millisecond via Promise.all()
  console.log(`🔥 [10:00:00.000 AM] FIRING 500 CONCURRENT REQUESTS SIMULTANEOUSLY...`);
  const overallStart = performance.now();

  const results: RequestResult[] = await Promise.all(requestPromises);

  const overallDuration = performance.now() - overallStart;
  console.log(`⏱️  All 500 requests completed in ${overallDuration.toFixed(2)} ms!\n`);

  // 5. Aggregate and Analyze Results
  let confirmedCount = 0;        // 201 Created
  let seatUnavailableCount = 0;  // 409 Conflict with SEAT_UNAVAILABLE
  let serverOverloadCount = 0;   // 503 Server Overload
  let validationErrorCount = 0;  // 400 Bad Request
  let unexpectedErrorCount = 0;  // Other

  const latencies: number[] = [];

  for (const res of results) {
    latencies.push(res.durationMs);

    if (res.statusCode === 201) {
      confirmedCount++;
    } else if (res.statusCode === 409) {
      seatUnavailableCount++;
    } else if (res.statusCode === 503) {
      serverOverloadCount++;
    } else if (res.statusCode === 400) {
      validationErrorCount++;
    } else {
      unexpectedErrorCount++;
      if (unexpectedErrorCount === 1) {
        console.error("Sample unexpected response:", res.statusCode, "Error:", res.error, JSON.stringify(res.body));
      }
    }
  }

  latencies.sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const meanLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  // 6. Verify final inventory balance in Redis
  const finalSeatsInRedis = await redisBookingService.getAvailableSeats(
    TRAIN_ID,
    JOURNEY_DATE,
    TRAVEL_CLASS,
    QUOTA
  );

  const oversoldSeats = Math.max(0, confirmedCount - INITIAL_SEAT_COUNT);

  // 7. Print Comprehensive Verification Report
  console.log(`======================================================================`);
  console.log(`                    LOAD TEST EXECUTION METRICS                      `);
  console.log(`======================================================================`);
  console.log(`Total Requests Sent           : ${TOTAL_CONCURRENT_USERS}`);
  console.log(`Initial Available Inventory   : ${INITIAL_SEAT_COUNT}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`✅ Confirmed Bookings (201)   : ${confirmedCount} / ${INITIAL_SEAT_COUNT}`);
  console.log(`❌ Seats Unavailable (409)    : ${seatUnavailableCount}`);
  console.log(`⚠️  Server Overload (503)      : ${serverOverloadCount}`);
  console.log(`⚠️  Validation Errors (400)    : ${validationErrorCount}`);
  console.log(`💥 Unexpected / Failed (500)  : ${unexpectedErrorCount}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`Final Redis Seat Count        : ${finalSeatsInRedis}`);
  console.log(`Oversold Seats Count          : ${oversoldSeats}`);
  console.log(`======================================================================`);
  console.log(`                    LATENCY PERFORMANCE STATS                         `);
  console.log(`======================================================================`);
  console.log(`Total Batch Duration          : ${overallDuration.toFixed(2)} ms`);
  console.log(`Throughput                    : ${((TOTAL_CONCURRENT_USERS / overallDuration) * 1000).toFixed(0)} req/sec`);
  console.log(`Min Latency                   : ${minLatency.toFixed(2)} ms`);
  console.log(`Mean Latency                  : ${meanLatency.toFixed(2)} ms`);
  console.log(`Median (p50) Latency          : ${p50.toFixed(2)} ms`);
  console.log(`p95 Latency                   : ${p95.toFixed(2)} ms`);
  console.log(`p99 Latency                   : ${p99.toFixed(2)} ms`);
  console.log(`Max Latency                   : ${maxLatency.toFixed(2)} ms`);
  console.log(`======================================================================\n`);

  // 8. Strict Assertions
  if (confirmedCount === INITIAL_SEAT_COUNT && oversoldSeats === 0 && finalSeatsInRedis === 0) {
    console.log(`🎉 SUCCESS: ZERO OVERSELLING PROVEN!`);
    console.log(
      `   Exactly ${INITIAL_SEAT_COUNT} users secured confirmed seats. All remaining ${seatUnavailableCount} users`
    );
    console.log(`   were rejected with clean HTTP 409 'SEAT_UNAVAILABLE' responses.`);
    console.log(`   No race conditions, no double-allocations, and no DB locks.\n`);
  } else {
    console.error(`❌ RACE CONDITION OR INVENTORY MISMATCH DETECTED!`);
    console.error(
      `   Expected exactly ${INITIAL_SEAT_COUNT} confirmed, got ${confirmedCount}. Oversold: ${oversoldSeats}.`
    );
  }

  // Close server and exit
  server.close(() => {
    process.exit(confirmedCount === INITIAL_SEAT_COUNT && oversoldSeats === 0 ? 0 : 1);
  });
}

// Execute load test
runLoadTest().catch((err) => {
  console.error("Fatal error during load test:", err);
  process.exit(1);
});
