import http from "http";
import { spawn } from "child_process";
import path from "path";

const PORT = 3018;

async function run() {
  console.log("Starting Next.js production server on port " + PORT + "...");
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: path.resolve("./frontend"),
    stdio: "pipe",
    shell: true,
  });

  server.stdout.on("data", (d) => {
    // console.log(`[next]: ${d}`);
  });
  server.stderr.on("data", (d) => {
    // console.error(`[next err]: ${d}`);
  });

  // Wait for server to be up
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 800));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/captcha`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (e) {}
  }

  if (!ready) {
    console.error("Server failed to start within 16s");
    server.kill();
    process.exit(1);
  }

  console.log("Next.js production server is READY. Running 3 Full Verification Cycles...\n");

  for (let cycle = 1; cycle <= 3; cycle++) {
    console.log(`================ CYCLE ${cycle} OF 3 ================`);

    // 1. Search Trains
    const t0 = Date.now();
    const searchRes = await fetch(`http://127.0.0.1:${PORT}/api/trains?from=NDLS&to=MMCT&quota=TATKAL`);
    const searchJson = await searchRes.json();
    const searchDur = Date.now() - t0;
    console.log(`1. Search Trains: status=${searchRes.status}, count=${searchJson.data?.length || 0}, duration=${searchDur}ms`);
    if (searchDur > 2000 || !searchJson.success) throw new Error("Search trains failed");

    // 2. Fetch Fresh Captcha
    const c0 = Date.now();
    const capRes = await fetch(`http://127.0.0.1:${PORT}/api/captcha`);
    const capJson = await capRes.json();
    const capDur = Date.now() - c0;
    console.log(`2. Dynamic Captcha: status=${capRes.status}, code=${capJson.data?.captchaCode}, duration=${capDur}ms`);
    if (capDur > 2000 || !capJson.success) throw new Error("Captcha failed");

    // 3. Test Forced Payment Failure (Simulate banking timeout during rush)
    const f0 = Date.now();
    const failRes = await fetch(`http://127.0.0.1:${PORT}/api/payment/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 2876, method: "UPI", gateway: "RAZORPAY_MOCK", shouldFail: true }),
    });
    const failJson = await failRes.json();
    const failDur = Date.now() - f0;
    console.log(`3. Payment Forced Failure: status=${failRes.status}, error=${failJson.error?.code}, duration=${failDur}ms`);
    if (failDur > 2000 || failRes.status !== 402) throw new Error("Forced payment failure test failed");

    // 4. Test Auto-Refund Reconciliation
    const r0 = Date.now();
    const recRes = await fetch(`http://127.0.0.1:${PORT}/api/payment/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: failJson.error?.transaction?.transactionId || "TXN_MOCK" }),
    });
    const recJson = await recRes.json();
    const recDur = Date.now() - r0;
    console.log(`4. Auto-Refund Reconcile: status=${recRes.status}, refundUtr=${recJson.data?.refundUtr}, duration=${recDur}ms`);
    if (recDur > 2000 || !recJson.success) throw new Error("Reconciliation failed");

    // 5. Test Fallback Gateway Payment
    const p0 = Date.now();
    const payRes = await fetch(`http://127.0.0.1:${PORT}/api/payment/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 2876, method: "UPI", gateway: "PAYU_MOCK", shouldFail: false }),
    });
    const payJson = await payRes.json();
    const payDur = Date.now() - p0;
    console.log(`5. Fallback Payment: status=${payRes.status}, txId=${payJson.data?.transactionId}, duration=${payDur}ms`);
    if (payDur > 2000 || !payJson.success) throw new Error("Payment simulate failed");

    // 6. Test Stateless Booking Confirmation
    const clientHoldToken = `hold_${Date.now()}`;
    const b0 = Date.now();
    const bookRes = await fetch(`http://127.0.0.1:${PORT}/api/booking/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdToken: clientHoldToken,
        draft: {
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
              name: "Rahul Sharma",
              age: 32,
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
          holdToken: clientHoldToken,
        },
        payment: payJson.data,
      }),
    });
    const bookJson = await bookRes.json();
    const bookDur = Date.now() - b0;
    console.log(`6. Confirm Booking: status=${bookRes.status}, pnr=${bookJson.data?.pnr}, status=${bookJson.data?.status}, duration=${bookDur}ms`);
    if (bookDur > 2000 || !bookJson.success) {
      console.error("Booking error:", bookJson);
      throw new Error("Booking confirmation failed");
    }

    // 7. Verify PNR Retrieval
    const pnr0 = Date.now();
    const pnrRes = await fetch(`http://127.0.0.1:${PORT}/api/pnr?pnr=${bookJson.data.pnr}`);
    const pnrJson = await pnrRes.json();
    const pnrDur = Date.now() - pnr0;
    console.log(`7. PNR Lookup: status=${pnrRes.status}, pnr=${pnrJson.data?.pnr}, duration=${pnrDur}ms\n`);
    if (pnrDur > 2000 || !pnrJson.success) throw new Error("PNR lookup failed");
  }

  console.log("=======================================================");
  console.log("   ✅ ALL 3 FULL VERIFICATION CYCLES PASSED UNDER 2S! ");
  console.log("=======================================================");
  server.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

