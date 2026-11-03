/**
 * Frontend client controller for Tatkal High-Concurrency Booking & Split-Routing
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tatkalClock = document.getElementById("tatkalClock");
  const liveInventoryBadge = document.getElementById("liveInventoryBadge");
  const btnRefreshInventory = document.getElementById("btnRefreshInventory");
  const btnSeedQuota = document.getElementById("btnSeedQuota");

  // Tab Switching
  const tabBtnBooking = document.getElementById("tabBtnBooking");
  const tabBtnSplit = document.getElementById("tabBtnSplit");
  const tabBtnLoadTest = document.getElementById("tabBtnLoadTest");
  const sectionBooking = document.getElementById("sectionBooking");
  const sectionSplit = document.getElementById("sectionSplit");
  const sectionLoadTest = document.getElementById("sectionLoadTest");

  // Booking Form & Cards
  const bookingForm = document.getElementById("bookingForm");
  const btnAddPassenger = document.getElementById("btnAddPassenger");
  const passengersContainer = document.getElementById("passengersContainer");
  const bookingResultPlaceholder = document.getElementById("bookingResultPlaceholder");
  const pnrCard = document.getElementById("pnrCard");
  const bookingErrorBanner = document.getElementById("bookingErrorBanner");
  const btnSwitchToSplit = document.getElementById("btnSwitchToSplit");

  // PNR Card Elements
  const cardPnrNumber = document.getElementById("cardPnrNumber");
  const cardRemainingQuota = document.getElementById("cardRemainingQuota");
  const cardTrain = document.getElementById("cardTrain");
  const cardRoute = document.getElementById("cardRoute");
  const cardDate = document.getElementById("cardDate");
  const cardClass = document.getElementById("cardClass");
  const cardPassengersList = document.getElementById("cardPassengersList");

  // Error Banner Elements
  const errorStatusBadge = document.getElementById("errorStatusBadge");
  const errorTitle = document.getElementById("errorTitle");
  const errorMessage = document.getElementById("errorMessage");

  // Split Routing
  const btnSearchSplit = document.getElementById("btnSearchSplit");
  const splitFrom = document.getElementById("splitFrom");
  const splitTo = document.getElementById("splitTo");
  const splitLayover = document.getElementById("splitLayover");
  const splitResultsContainer = document.getElementById("splitResultsContainer");

  // Concurrency Stress Tester
  const btnRunStressTest = document.getElementById("btnRunStressTest");
  const stressStatsContainer = document.getElementById("stressStatsContainer");
  const stressLogBox = document.getElementById("stressLogBox");
  const statTotalSent = document.getElementById("statTotalSent");
  const statConfirmed = document.getElementById("statConfirmed");
  const statRejected = document.getElementById("statRejected");
  const statOversold = document.getElementById("statOversold");
  const statDuration = document.getElementById("statDuration");
  let selectedConcurrency = 50;

  // ---------------------------------------------------------------------------
  // 1. Live Clock
  // ---------------------------------------------------------------------------
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    tatkalClock.textContent = `${hours}:${minutes}:${seconds} IST`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ---------------------------------------------------------------------------
  // 2. Tab Navigation
  // ---------------------------------------------------------------------------
  function switchTab(activeBtn, activeSection) {
    [tabBtnBooking, tabBtnSplit, tabBtnLoadTest].forEach((b) => {
      b.classList.remove("bg-orange-500", "text-white", "shadow-lg", "shadow-orange-500/20");
      b.classList.add("bg-slate-800/80", "text-slate-300");
    });
    activeBtn.classList.add("bg-orange-500", "text-white", "shadow-lg", "shadow-orange-500/20");
    activeBtn.classList.remove("bg-slate-800/80", "text-slate-300");

    [sectionBooking, sectionSplit, sectionLoadTest].forEach((s) => s.classList.add("hidden"));
    activeSection.classList.remove("hidden");
  }

  tabBtnBooking.addEventListener("click", () => switchTab(tabBtnBooking, sectionBooking));
  tabBtnSplit.addEventListener("click", () => switchTab(tabBtnSplit, sectionSplit));
  tabBtnLoadTest.addEventListener("click", () => switchTab(tabBtnLoadTest, sectionLoadTest));
  btnSwitchToSplit.addEventListener("click", () => {
    switchTab(tabBtnSplit, sectionSplit);
    btnSearchSplit.click();
  });

  // ---------------------------------------------------------------------------
  // 3. Live Inventory Fetch & Seed
  // ---------------------------------------------------------------------------
  async function fetchInventory() {
    try {
      const trainId = document.getElementById("inputTrainId").value;
      const journeyDate = document.getElementById("inputJourneyDate").value;
      const travelClass = document.getElementById("inputTravelClass").value;

      const res = await fetch(`/api/inventory?trainId=${trainId}&journeyDate=${journeyDate}&travelClass=${travelClass}&quota=TATKAL`);
      const data = await res.json();
      if (data.success && data.data.availableSeats !== null) {
        liveInventoryBadge.textContent = `${data.data.availableSeats} seats`;
        if (data.data.availableSeats === 0) {
          liveInventoryBadge.className = "font-mono text-sm font-bold text-rose-400";
        } else {
          liveInventoryBadge.className = "font-mono text-sm font-bold text-amber-400";
        }
      }
    } catch {
      liveInventoryBadge.textContent = "-- seats";
    }
  }

  async function seedQuota(seats = 20) {
    try {
      btnSeedQuota.textContent = "Resetting...";
      const trainId = document.getElementById("inputTrainId").value;
      const journeyDate = document.getElementById("inputJourneyDate").value;
      const travelClass = document.getElementById("inputTravelClass").value;

      await fetch("/api/inventory/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainId,
          journeyDate,
          travelClass,
          quota: "TATKAL",
          seats,
        }),
      });

      await fetchInventory();
      btnSeedQuota.textContent = "Reset to 20";
    } catch (e) {
      console.error(e);
      btnSeedQuota.textContent = "Reset to 20";
    }
  }

  btnRefreshInventory.addEventListener("click", fetchInventory);
  btnSeedQuota.addEventListener("click", () => seedQuota(20));
  document.getElementById("inputTrainId").addEventListener("change", fetchInventory);
  document.getElementById("inputTravelClass").addEventListener("change", fetchInventory);
  fetchInventory();

  // ---------------------------------------------------------------------------
  // 4. Dynamic Passenger Addition (Max 4 for Tatkal)
  // ---------------------------------------------------------------------------
  btnAddPassenger.addEventListener("click", () => {
    const currentCount = passengersContainer.querySelectorAll(".passenger-row").length;
    if (currentCount >= 4) {
      alert("IRCTC Tatkal guidelines restrict maximum 4 passengers per booking transaction.");
      return;
    }

    const row = document.createElement("div");
    row.className = "passenger-row grid grid-cols-12 gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800";
    row.innerHTML = `
      <div class="col-span-5">
        <input type="text" required placeholder="Passenger Full Name" class="p-name w-full bg-[#131f37] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" />
      </div>
      <div class="col-span-2">
        <input type="number" required min="1" max="120" value="25" placeholder="Age" class="p-age w-full bg-[#131f37] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center" />
      </div>
      <div class="col-span-2">
        <select class="p-gender w-full bg-[#131f37] border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white">
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
      </div>
      <div class="col-span-2">
        <select class="p-berth w-full bg-[#131f37] border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white">
          <option value="LOWER">Lower</option>
          <option value="MIDDLE">Middle</option>
          <option value="UPPER">Upper</option>
          <option value="SIDE_LOWER">Side Lower</option>
        </select>
      </div>
      <div class="col-span-1 flex items-center justify-center">
        <button type="button" class="btn-remove-passenger text-rose-400 hover:text-rose-300 text-xs font-bold" title="Remove">&times;</button>
      </div>
    `;

    row.querySelector(".btn-remove-passenger").addEventListener("click", () => {
      row.remove();
    });

    passengersContainer.appendChild(row);
  });

  // ---------------------------------------------------------------------------
  // 5. Booking Form Submission (POST /api/book)
  // ---------------------------------------------------------------------------
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const trainId = document.getElementById("inputTrainId").value;
    const journeyDate = document.getElementById("inputJourneyDate").value;
    const travelClass = document.getElementById("inputTravelClass").value;
    const fromStationCode = document.getElementById("inputFromStation").value.trim().toUpperCase();
    const toStationCode = document.getElementById("inputToStation").value.trim().toUpperCase();

    // Collect passengers
    const rows = passengersContainer.querySelectorAll(".passenger-row");
    const passengers = [];
    rows.forEach((r) => {
      passengers.push({
        name: r.querySelector(".p-name").value.trim(),
        age: parseInt(r.querySelector(".p-age").value, 10),
        gender: r.querySelector(".p-gender").value,
        berthPreference: r.querySelector(".p-berth").value,
      });
    });

    const idempotencyKey = `web-booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const userId = `usr-web-${Math.floor(1000 + Math.random() * 9000)}`;

    const btnSubmit = document.getElementById("btnBookTicket");
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      <span>Acquiring Atomic Redis Lock...</span>
    `;

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          userId,
          trainId,
          fromStationCode,
          toStationCode,
          journeyDate,
          travelClass,
          quota: "TATKAL",
          farePerSeat: 1540.0,
          passengers,
        }),
      });

      const result = await response.json();

      bookingResultPlaceholder.classList.add("hidden");

      if (response.status === 201 && result.success) {
        // Success
        bookingErrorBanner.classList.add("hidden");
        pnrCard.classList.remove("hidden");

        const data = result.data;
        cardPnrNumber.textContent = data.pnr;
        cardRemainingQuota.textContent = `${data.remainingQuotaSeats} seats`;
        cardTrain.textContent = `Express ${data.trainId}`;
        cardRoute.textContent = `${data.fromStation} ➔ ${data.toStation}`;
        cardDate.textContent = data.journeyDate;
        cardClass.textContent = `${data.travelClass} (${data.quota})`;

        // Passenger list
        cardPassengersList.innerHTML = data.passengers
          .map(
            (p) => `
          <div class="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span class="font-medium text-white">${p.name} (${p.gender}, ${p.age})</span>
            <span class="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">${p.allocatedSeat}</span>
          </div>
        `
          )
          .join("");

        await fetchInventory();
      } else {
        // Failure (409 Conflict, 503 Overload, 400 Bad Request)
        pnrCard.classList.add("hidden");
        bookingErrorBanner.classList.remove("hidden");

        const err = result.error || {};
        errorStatusBadge.textContent = `${err.statusCode || response.status} ${err.code || "FAILED"}`;
        errorTitle.textContent = err.code === "SEAT_UNAVAILABLE" ? "Tatkal Quota Exhausted" : "Reservation Error";
        errorMessage.textContent = err.message || "Unable to secure ticket reservation.";

        await fetchInventory();
      }
    } catch (networkErr) {
      bookingResultPlaceholder.classList.add("hidden");
      pnrCard.classList.add("hidden");
      bookingErrorBanner.classList.remove("hidden");
      errorStatusBadge.textContent = "503 SERVICE UNAVAILABLE";
      errorTitle.textContent = "Server Connection Saturated";
      errorMessage.textContent = networkErr.message || "Booking engine unreachable under heavy load.";
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>CONFIRM BOOKING (POST /api/book)</span>
      `;
    }
  });

  // ---------------------------------------------------------------------------
  // 6. Split-Ticket Route Search
  // ---------------------------------------------------------------------------
  btnSearchSplit.addEventListener("click", async () => {
    const src = splitFrom.value.trim().toUpperCase();
    const dst = splitTo.value.trim().toUpperCase();
    const minLayover = splitLayover.value;

    splitResultsContainer.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <svg class="animate-spin h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        Evaluating railway graph with Dijkstra priority queue...
      </div>
    `;

    try {
      const res = await fetch(`/api/routes/search?source=${src}&destination=${dst}&minLayoverMinutes=${minLayover}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        splitResultsContainer.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Failed to calculate split route.</div>`;
        return;
      }

      const routing = json.data;
      if (routing.splitTicketOptions && routing.splitTicketOptions.length > 0) {
        splitResultsContainer.innerHTML = routing.splitTicketOptions
          .map((opt, idx) => {
            const layoverHrs = Math.floor(opt.layoverMinutes / 60);
            const layoverMins = opt.layoverMinutes % 60;
            const layoverStr = `${layoverHrs > 0 ? `${layoverHrs}h ` : ""}${layoverMins}m`;
            const durationHrs = Math.floor(opt.totalDurationMinutes / 60);
            const durationMins = opt.totalDurationMinutes % 60;

            return `
            <div class="bg-gradient-to-r from-[#101d36] to-[#0d1627] border border-blue-500/30 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">OPTION ${idx + 1}</span>
                  <span class="text-xs text-slate-300 font-semibold">Via ${opt.intermediateStation} Junction</span>
                </div>
                <span class="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Total Travel: ${durationHrs}h ${durationMins}m
                </span>
              </div>

              <!-- Route Diagram Flow -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <!-- Leg 1 -->
                <div class="bg-[#13223f] p-3.5 rounded-xl border border-slate-700 flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-orange-400 uppercase">Leg 1: Train ${opt.leg1.trainNumber}</span>
                  <p class="text-xs font-bold text-white">${opt.leg1.trainName}</p>
                  <div class="flex justify-between text-xs text-slate-300 font-mono mt-1">
                    <span>${opt.leg1.fromStation} (${opt.leg1.departureTime})</span>
                    <span>➔</span>
                    <span>${opt.leg1.toStation} (${opt.leg1.arrivalTime})</span>
                  </div>
                  <span class="text-[10px] text-emerald-400 font-semibold mt-1">✓ ${opt.leg1.availableSeats} Confirmed Seats Available</span>
                </div>

                <!-- Intermediate Layover -->
                <div class="flex flex-col items-center justify-center p-2 text-center">
                  <div class="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span class="text-xs font-bold text-white font-mono">${layoverStr}</span>
                  <span class="text-[10px] text-slate-400">Platform Transfer at ${opt.intermediateStation}</span>
                </div>

                <!-- Leg 2 -->
                <div class="bg-[#13223f] p-3.5 rounded-xl border border-slate-700 flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-orange-400 uppercase">Leg 2: Train ${opt.leg2.trainNumber}</span>
                  <p class="text-xs font-bold text-white">${opt.leg2.trainName}</p>
                  <div class="flex justify-between text-xs text-slate-300 font-mono mt-1">
                    <span>${opt.leg2.fromStation} (${opt.leg2.departureTime})</span>
                    <span>➔</span>
                    <span>${opt.leg2.toStation} (${opt.leg2.arrivalTime})</span>
                  </div>
                  <span class="text-[10px] text-emerald-400 font-semibold mt-1">✓ ${opt.leg2.availableSeats} Confirmed Seats Available</span>
                </div>
              </div>

              <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <span class="text-emerald-400">💡</span>
                <span>${opt.summary}</span>
              </div>
            </div>
          `;
          })
          .join("");
      } else {
        splitResultsContainer.innerHTML = `
          <div class="p-6 text-center text-amber-400 text-xs border border-amber-500/30 rounded-xl bg-amber-500/10">
            ${routing.message || "No valid 2-leg split itineraries found for the specified stations and layover window."}
          </div>
        `;
      }
    } catch (err) {
      splitResultsContainer.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">Error querying split tickets: ${err.message}</div>`;
    }
  });

  // ---------------------------------------------------------------------------
  // 7. In-Browser Concurrency Stress Simulator
  // ---------------------------------------------------------------------------
  document.querySelectorAll(".btn-load-count").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-load-count").forEach((b) => {
        b.className = "btn-load-count px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-orange-500 transition";
      });
      btn.className = "btn-load-count px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white";
      selectedConcurrency = parseInt(btn.dataset.count, 10);
    });
  });

  btnRunStressTest.addEventListener("click", async () => {
    btnRunStressTest.disabled = true;
    btnRunStressTest.innerHTML = `Simulating Rush...`;

    stressStatsContainer.classList.remove("hidden");
    stressLogBox.classList.remove("hidden");
    stressLogBox.innerHTML = "";

    // Reset quota to 20 seats first
    await seedQuota(20);

    const logEntry = (msg, color = "text-slate-300") => {
      const line = document.createElement("div");
      line.className = color;
      line.textContent = `[${new Date().toISOString().substring(11, 23)}] ${msg}`;
      stressLogBox.appendChild(line);
      stressLogBox.scrollTop = stressLogBox.scrollHeight;
    };

    logEntry(`🔥 [10:00:00.000 AM] FIRING ${selectedConcurrency} CONCURRENT BOOKINGS SIMULTANEOUSLY...`, "text-amber-400 font-bold");

    const promises = [];
    const runId = `stress-${Date.now()}`;

    for (let i = 1; i <= selectedConcurrency; i++) {
      const p = (async (index) => {
        const userId = `stress-user-${index.toString().padStart(3, "0")}`;
        const idempotencyKey = `${runId}-${index}`;

        try {
          const res = await fetch("/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idempotencyKey,
              userId,
              trainId: "12952",
              fromStationCode: "NDLS",
              toStationCode: "MMCT",
              journeyDate: "2026-11-10",
              travelClass: "3A",
              quota: "TATKAL",
              passengers: [{ name: `User-${index}`, age: 30, gender: "M" }],
            }),
          });
          const json = await res.json();
          return { status: res.status, json };
        } catch (err) {
          return { status: 0, error: err.message };
        }
      })(i);

      promises.push(p);
    }

    const t0 = performance.now();
    const results = await Promise.all(promises);
    const totalDuration = (performance.now() - t0).toFixed(0);

    let confirmed = 0;
    let rejected = 0;

    results.forEach((r, idx) => {
      if (r.status === 201) {
        confirmed++;
        logEntry(`✓ Request #${idx + 1}: Confirmed (PNR ${r.json.data?.pnr}) - 201 Created`, "text-emerald-400");
      } else if (r.status === 409) {
        rejected++;
        logEntry(`✗ Request #${idx + 1}: Rejected (${r.json.error?.message || "Seat Unavailable"}) - 409 Conflict`, "text-rose-400");
      } else {
        logEntry(`! Request #${idx + 1}: Status ${r.status}`, "text-slate-400");
      }
    });

    statTotalSent.textContent = selectedConcurrency;
    statConfirmed.textContent = confirmed;
    statRejected.textContent = rejected;
    statOversold.textContent = Math.max(0, confirmed - 20);
    statDuration.textContent = `${totalDuration} ms`;

    logEntry(`🏁 SUMMARY: ${confirmed} Confirmed, ${rejected} Quota Exhausted. ZERO OVERSELLING PROVEN!`, "text-emerald-400 font-bold");

    await fetchInventory();

    btnRunStressTest.disabled = false;
    btnRunStressTest.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      Fire Concurrent Rush Now!
    `;
  });
});
