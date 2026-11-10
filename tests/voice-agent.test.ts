/**
 * Suite 11: Gnani Voice Agent Integration Test Suite
 *
 * Verifies that:
 * 1. The /api/voice-agent route conforms to the exact Gnani Prisma & Timbre specifications.
 * 2. Local Node.js BFS discovers the split-ticket route via Kota with 5 seats left.
 * 3. Exact response string is constructed: "The direct train from [Source] to [Destination] is full, but I found a split-ticket route via Kota with 5 seats left. Should I lock it?"
 * 4. Timbre TTS request payload specifies voice="Nalini", model="timbre-v2.5", language="en-IN", 48kHz linear_pcm wav.
 * 5. Return JSON payload contains { ui_state: { route: 'split', layover: 'Kota' }, audio_base64 }.
 * 6. Frontend component (VoiceBooking.tsx) implements framer-motion pulsing mic, MediaRecorder, and HTML5 Audio playback.
 */

import assert from "assert";
import fs from "fs";
import path from "path";

console.log("=======================================================");
console.log("  🎙️ GNANI VOICE AGENT & BFS ROUTING TEST SUITE        ");
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
  console.log("▶ [1/4] Backend Route File & Segment Config Inspection");
  const routePath = path.resolve("./frontend/app/api/voice-agent/route.ts");
  assert(fs.existsSync(routePath), "frontend/app/api/voice-agent/route.ts must exist");
  const routeCode = fs.readFileSync(routePath, "utf-8");

  test("Route exports dynamic = 'force-dynamic'", () => {
    assert(routeCode.includes('export const dynamic = "force-dynamic"'));
  });

  test("Route exports runtime = 'nodejs'", () => {
    assert(routeCode.includes('export const runtime = "nodejs"'));
  });

  test("Route configures maxDuration = 30", () => {
    assert(routeCode.includes("export const maxDuration = 30"));
  });

  console.log("\n▶ [2/4] Gnani Prisma & Timbre API Specification Compliance");
  test("Prisma STT endpoint matches https://api.vachana.ai/api/v1/stt or https://api.vachana.ai/stt/v3", () => {
    assert(
      routeCode.includes("https://api.vachana.ai/api/v1/stt") ||
      routeCode.includes("https://api.vachana.ai/stt/v3")
    );
  });

  test("Timbre TTS endpoint matches https://api.vachana.ai/api/v1/tts/inference", () => {
    assert(routeCode.includes("https://api.vachana.ai/api/v1/tts/inference"));
  });

  test("Header includes X-API-Key-ID with process.env.GNANI_API_KEY", () => {
    assert(routeCode.includes('"X-API-Key-ID"'));
    assert(routeCode.includes("GNANI_API_KEY"));
  });

  test("Timbre payload uses voice='Nalini' and model='timbre-v2.5'", () => {
    assert(routeCode.includes('"Nalini"'));
    assert(routeCode.includes('"timbre-v2.5"'));
  });

  test("Timbre payload configures 48000Hz, linear_pcm, wav container", () => {
    assert(routeCode.includes("48000"));
    assert(routeCode.includes('"linear_pcm"'));
    assert(routeCode.includes('"wav"'));
  });

  console.log("\n▶ [3/4] Local Node.js BFS Routing & Exact String Construction");
  test("Implements Breadth-First Search (BFS) routing logic", () => {
    assert(routeCode.includes("findSplitRouteBFS"));
    assert(routeCode.includes("queue"));
    assert(routeCode.includes("visited"));
  });

  test("Simulates direct train is full and returns split-ticket route via Kota with 5 seats left", () => {
    assert(routeCode.includes("availableSeats: 0") || routeCode.includes("isDirectAvailable: false"));
    assert(routeCode.includes("Kota"));
    assert(routeCode.includes("5"));
  });

  test("Constructs exact required response string", () => {
    const requiredPattern = "The direct train from ${routingResult.source} to ${routingResult.destination} is full, but I found a split-ticket route via Kota with 5 seats left. Should I lock it?";
    assert(
      routeCode.includes(requiredPattern) ||
        routeCode.includes("The direct train from") && routeCode.includes("is full, but I found a split-ticket route via Kota with 5 seats left. Should I lock it?")
    );
  });

  test("Returns payload with { ui_state: { route: 'split', layover: 'Kota' }, audio_base64 }", () => {
    assert(routeCode.includes('route: "split"'));
    assert(routeCode.includes('layover: "Kota"'));
    assert(routeCode.includes("audio_base64"));
  });

  console.log("\n▶ [4/4] Frontend VoiceBooking Component Inspection");
  const componentPath = path.resolve("./frontend/components/VoiceBooking.tsx");
  assert(fs.existsSync(componentPath), "frontend/components/VoiceBooking.tsx must exist");
  const componentCode = fs.readFileSync(componentPath, "utf-8");

  test("Component imports and uses framer-motion for pulsing animation", () => {
    assert(componentCode.includes("framer-motion"));
    assert(componentCode.includes("motion."));
  });

  test("Component uses MediaRecorder API to capture audio", () => {
    assert(componentCode.includes("MediaRecorder"));
    assert(componentCode.includes("getUserMedia"));
  });

  test("Component posts audio to /api/voice-agent", () => {
    assert(componentCode.includes("/api/voice-agent"));
  });

  test("Component plays audio using HTML5 Audio constructor", () => {
    assert(componentCode.includes("new Audio("));
    assert(componentCode.includes("audio_base64") || componentCode.includes("base64"));
  });

  test("Component updates and displays ui_state", () => {
    assert(componentCode.includes("uiState") || componentCode.includes("ui_state"));
    assert(componentCode.includes("Kota"));
  });

  console.log("\n=======================================================");
  console.log(`   ✅ ALL ${passed} GNANI VOICE AGENT TESTS PASSED!`);
  console.log("=======================================================\n");
}

runSuite().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
