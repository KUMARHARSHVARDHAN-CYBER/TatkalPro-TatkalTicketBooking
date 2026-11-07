# 🚂 TatkalPro: High-Concurrency Tatkal Railway Booking Engine & PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-dc2626.svg)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-41%2F41%20Passing-emerald.svg)]()
[![Theme](https://img.shields.io/badge/Theme-Clean%20Light-blue.svg)]()

A modern, high-throughput, mobile-first Progressive Web Application (PWA) and defensive concurrency engine modeled on the standard IRCTC Rail Connect booking flow, engineered specifically to fix the **real pain points of the 10:00 AM Tatkal rush** while introducing a modern, accessible, light-themed user experience (`#FFFFFF`, `#F8FAFC`, soft blue `#2563EB`, warm orange `#F97316`).

> ⚠️ **Demo / Simulated Sandbox Notice**:
> This project operates with a realistic mock railway Global Distribution System (GDS) backend behind a clean `IRailwayProvider` adapter interface. It is **not affiliated with IRCTC or CRIS**. No real money is charged and no actual railway tickets are booked. Unauthorized bot automation, scraping, or captcha bypass of live IRCTC systems is strictly prohibited by law.

---

## 🎨 UI/UX Design System (Light Theme Only)

TatkalPro features a clean, high-contrast, professional light-theme design system:
- **Surfaces**: Crisp white cards (`#FFFFFF`) on soft slate-50 backgrounds (`#F8FAFC`), structured with subtle slate-200 borders.
- **Brand Palette**: Trustworthy soft blue (`#2563EB`) as primary, safety warm orange (`#F97316`) for primary action buttons (*Search Trains*, *Book Now*, *Proceed to Payment*).
- **Pastel Availability Chips**: Soft pastel-tinted status indicators rather than harsh saturated blocks:
  - `AVAILABLE 18`: Soft emerald tint (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - `RAC 4` / `WL 12`: Warm amber tint (`bg-amber-50 text-amber-700 border-amber-200`)
  - `REGRET`: Soft rose tint (`bg-rose-50 text-rose-700 border-rose-200`)
- **Stepper Progress**: 5-step visual guide (`Search > Passengers > Review > Pay > Ticket`) with past-step navigation.
- **Typography & Ergonomics**: Inter typography, minimum 16px body copy, generous 44px+ tap targets, responsive sticky bottom CTA on mobile.

---

---

## 🛡️ How Bot Shield Works

Tatkal ticket sales suffer from scripted automated crawlers and token scrapers that swamp network infrastructure. TatkalPro embeds a multi-layered defensive shield:

1. **Virtual Waiting Room & Cryptographic Admission Passes**:
   - During peak 10:00 AM rush, users enter a regulated virtual waiting room.
   - Upon admission, the server issues a **5-minute single-use cryptographically signed admission pass** (`passId` + HMAC signature) bound to the user ID and device fingerprint.
   - Replay attacks are cryptographically blocked: once consumed for seat holding, the token cannot be reused.
2. **Multi-Key Sliding-Window Rate Limiters**:
   - Enforces sliding-window rate limits across multiple dimensions: client IP (`queue_${ip}`: 15 req/min), user account, and device fingerprint.
   - Requests exceeding thresholds receive standard `HTTP 429 Too Many Requests` responses with `Retry-After` headers.
3. **Privacy-Safe Behavioral Risk Scoring (0–100)**:
   - Evaluates non-invasive signals without third-party tracking:
     - Form interaction cadence and typing speed
     - Honeypot form field inspection (hidden bot traps)
     - Time-on-page inspection (flagging instantaneous `< 100ms` submissions)
     - Human pointer gestures and screen focus events
   - Entities scoring $> 75$ are flagged; entities scoring $> 90$ are automatically blocked.
4. **Abuse Controls & Identity Limits**:
   - Enforces Indian Railways anti-touting regulations: max 4 passengers per Tatkal PNR.
   - Duplicate government ID detection across concurrent bookings within the same calendar journey.
5. **Admin Bot Shield Console**:
   - Real-time telemetry dashboard accessible via the top navigation bar.
   - Displays live requests/second, blocked bot counts, active queue size, and risk distributions.
   - Features 1-click **Block** and **Allowlist** actions, plus dynamic security threshold sliders.

---

## 👥 Real-Time Live Passenger Management

TatkalPro features a dynamic, reactive passenger manager designed to eliminate booking panic:
- **Live Fare Calculation (<200ms)**: Automatically aggregates base fare, Tatkal surcharges, superfast fees, GST (5%), and PG fees in real time whenever passengers are added, updated, or removed.
- **5-Second Undo Toast**: Accidental deletions can be restored instantly with a single tap.
- **Master List 1-Tap Directory**: Pre-saved passengers can be imported in 1 click with identity pre-verification.
- **Reorder & Duplicate**: Drag/move passengers up or down, or duplicate existing details for companions.
- **Quota Compliance Guardrails**:
  - Automatically enforces the **4-passenger maximum** for Tatkal bookings.
  - Senior citizen priority indicators (Male $\ge 60$, Female $\ge 45$) recommending lower berths.
  - Child age rules (under 5 traveling free without berth).

---

## 💡 The 10 Real Tatkal Pain Points Solved

| # | Pain Point in Standard Booking | How TatkalPro Solves It |
|---|--------------------------------|-------------------------|
| **1** | **Tatkal Timing Anxiety** | Live server-synced countdown timer for AC (10:00 AM) and Non-AC (11:00 AM) windows, with a 4-point Pre-Armed Readiness Checklist (passengers, payment, ID, network ping). |
| **2** | **Slow Form Filling** | Saved Master Passenger List with 1-tap import, duplicate buttons, and a pre-armed state that reduces open-window booking to **1 tap**. |
| **3** | **Captcha Frustration** | Accessible, high-contrast visual SVG captcha with built-in text-to-speech audio pronunciation. **Crucially: entering a wrong captcha never clears entered passenger data.** |
| **4** | **Session Timeouts & Crashes** | Atomic Redis seat-hold with an **8-minute reservation countdown timer**. Session keep-alive prevents mid-booking logout. |
| **5** | **Payment Failures** | Multi-gateway routing (UPI QR/Intent/VPA, Credit/Debit cards, Netbanking) with **auto-fallback**. If a bank deducts money without ticket confirmation, the **Auto-Refund Reconciliation Tracker** provides live RBI UTR tracking and refund within 2 minutes. |
| **6** | **Waitlist Uncertainty** | Historical confirmation probability predictor (0-100%) with 90-day chart rationale. |
| **7** | **Exhausted Direct Seats** | **Dijkstra Split-Ticket Routing Engine**: If direct seats are sold out, evaluates intermediate junction hubs (e.g., KOTA for NDLS $\to$ MMCT) and finds confirmed seats on both legs with a safe transfer layover. |
| **8** | **Bots & Unfair Queuing** | **Bot Shield Defensive Engine**: Cryptographic waiting room passes, sliding-window rate limiters, behavioral risk scoring, and honeypots. |
| **9** | **Hidden Fares & Surcharges** | 100% upfront transparent fare breakdown (Base Fare + Tatkal Charge + Superfast + GST 5% + PG Fee ₹15) presented before payment with zero surprises. |
| **10** | **Post-Booking Experience** | Electronic demo reservation slip layout with QR code, barcode, allocated coach/berth, 1-tap WhatsApp sharing, and Google Calendar export. |

---

## 🚀 Quick Start & Installation

TatkalPro runs standalone with zero hard dependencies on PostgreSQL, Redis, or Docker for the UI to render. An in-memory mock GDS adapter is enabled by default.

### Running Standalone (Zero Configuration)

```bash
# 1. Clone the repository
git clone https://github.com/KUMARHARSHVARDHAN-CYBER/tatkal-booking-highcocurrency.git
cd tatkal-booking-highcocurrency

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running with Docker Compose (Full Stack + Redis + PostgreSQL)

```bash
docker-compose up --build
```
Services started:
- `tatkalpro-app`: Next.js PWA on `http://localhost:3000`
- `tatkalpro-redis`: Redis 7 on port `6379`
- `tatkalpro-postgres`: PostgreSQL 16 on port `5432`

---

## 🧪 Verification & Load Testing

### Enterprise Verification Test Suite (41 Tests)

Verifies station search, multilingual matching, upfront fare calculation, live passenger rules, senior citizen lower berth logic, atomic seat hold TTL, multi-gateway fallback, auto-refund UTR tracking, Dijkstra split routing, bot shield cryptographic passes, sliding-window rate limits, behavioral risk scoring, and end-to-end PNR generation:

```bash
# Run enterprise test suite
npm test

# Run route engine and train search verification (40 stations, 44 train schedules)
npm run test:routes

# Run split-ticket graph routing algorithm test
npm run test:algorithm
```

**Verification Results:**
```text
=======================================================
       TATKALPRO ENTERPRISE VERIFICATION SUITE         
=======================================================
▶ [1/8] Station Search & Multilingual Matching      ✅ 3/3 PASS
▶ [2/8] Upfront Fare Calculation & Transparency     ✅ 6/6 PASS
▶ [3/8] Live Passenger Rules & Senior Citizen Limits ✅ 3/3 PASS
▶ [4/8] Atomic Seat Hold TTL & Overbooking Guard    ✅ 3/3 PASS
▶ [5/8] Multi-Gateway Fallback & Auto-Refund Tracker ✅ 5/5 PASS
▶ [6/8] Dijkstra Split-Ticket Routing Algorithm     ✅ 5/5 PASS
▶ [7/8] Bot Shield: Tokens, Rate Limits & Risk      ✅ 11/11 PASS
▶ [8/8] Complete End-to-End Booking Lifecycle       ✅ 5/5 PASS
=======================================================
TEST SUMMARY: 41 PASSED, 0 FAILED (100% SUCCESS)
=======================================================
```

### High-Concurrency 10:00 AM Rush Load Test (k6)

Simulates 5,000 legitimate users, 2,000 scripted bot clients, and a continuous telemetry health monitor hitting the booking pipeline:

```bash
k6 run scripts/k6-tatkal-rush.js
```

**SLAs Enforced:**
- Legitimate User $p(95)$ Latency $< 120\text{ms}$
- Legitimate User $p(99)$ Latency $< 300\text{ms}$
- False Positive Rate $< 0.1\%$
- Zero seats oversold beyond Tatkal quota cap

---

## 🛡️ How Tatkal Safety Net Works

Confirmed Tatkal tickets are non-refundable under Indian Railways rules, meaning mistakes made during the high-pressure 10:00 AM rush can be irreversible and expensive. The **Tatkal Safety Net** module runs silently and intervenes only when it can prevent a costly error, ensuring **zero added latency** and **zero extra taps** on clean bookings.

### 1. Architectural Components
```
[ User Booking Draft ]
         │
         ▼
[ Regret Shield (< 100ms In-Memory Scan) ]
         ├── Clean Booking (0 Issues) ────► [ Immediate 1-Tap Payment ]
         │                                   (Summary: "Checked: stations, date, passengers, ID. All good.")
         └── Issues Detected ─────────────► [ 10-Second Final Safety Check Bottom Sheet ]
                                              ├── 1-Tap Instant Fix (Auto-corrects station, quota, ID)
                                              └── "I Understand & Confirm" / "Ignore & Continue"
```

### 2. Configurable Rules Engine
Rules are stored in dynamic JSON configuration (`frontend/lib/safetyNet/defaultRules.json`) and can be enabled, disabled, or tuned directly via the Admin Console without redeploying code.

```json
{
  "id": "RULE_MULTI_STATION_CITY_CONFUSION",
  "name": "Same-City Terminal Confusion Prevention",
  "description": "Detects if selected departure or arrival station differs from the primary city terminus searched (e.g. NDLS vs NZM/DLI/ANVT in Delhi, or MMCT vs CSMT/BDTS/LTT in Mumbai).",
  "severity": "MEDIUM",
  "category": "STATION",
  "source_note": "CRIS Terminal Routing Standard",
  "last_verified": "04 Nov 2026",
  "enabled": true
}
```

#### Monitored Safety Rules:
1. **`RULE_MAX_PASSENGERS`** (CRITICAL): Enforces the strict 4-passenger limit per Tatkal PNR.
2. **`RULE_MULTI_STATION_CITY_CONFUSION`** (MEDIUM): Catches metropolitan multi-terminus confusion (e.g. searching `NDLS` but booking `NZM` in Delhi; `MMCT` vs `CSMT` vs `BDTS` vs `LTT` in Mumbai; `HWH` vs `SDAH` in Kolkata; `SBC` vs `YPR` in Bengaluru).
3. **`RULE_DATE_WINDOW_SANITY`** (CRITICAL): Ensures the journey date aligns with the 1-day advance Tatkal opening window and blocks past dates.
4. **`RULE_MIDNIGHT_CROSSING`** (MEDIUM): Warns when trains depart between 23:30 and 00:30 (e.g., departing 00:15 requires reaching the station the previous night).
5. **`RULE_LADIES_QUOTA_ELIGIBILITY`** (CRITICAL): Blocks adult males ($\ge 12\text{ yrs}$) from Ladies Quota to avoid TTE forfeiture and penalty.
6. **`RULE_SENIOR_CITIZEN_ELIGIBILITY`** (MEDIUM): Verifies lower-berth eligibility (Males $\ge 60$, Females $\ge 45/58$).
7. **`RULE_DUPLICATE_PASSENGER`** (HIGH): Detects duplicate name and age entries that trigger PRS chart rejection.
8. **`RULE_PRIMARY_ID_REQUIRED`** (HIGH): Verifies that at least one passenger has linked Govt photo ID and explicitly flags the Primary ID Carrier on the ticket.
9. **`RULE_ID_FORMAT_SANITY`** (MEDIUM): Validates 12-digit Aadhaar, 10-char PAN (`[A-Z]{5}[0-9]{4}[A-Z]`), and Passport formats.
10. **`RULE_NAME_FORMAT_SANITY`** (MEDIUM): Strips special characters and numbers from passenger names.
11. **`RULE_TATKAL_NON_REFUNDABLE`** (HIGH): Proactively reminds users of ₹0 refund value upon cancellation.

### 3. Group Split Coordinator
For groups larger than 4 travellers, the Coordinator:
- Automatically partitions the group into compliant PNR batches ($\le 4\text{ pax}$ each).
- Preserves **Coach-Together Preference** to seat adjacent batches in the same coach.
- Provides a **Plan B Recovery Matrix** with waitlist confirmation probabilities ($\ge 90\%$) if only some batches confirm during high rush.

### 4. Failure Autopsy & Actionable Classifier
Replaces generic errors with a plain-language root cause explanation and **exactly ONE actionable tip** for the next attempt:
- *Bank OTP Timeout*: "Pre-authorize UPI Fast Pay or IRCTC iMudra E-Wallet before 10:00 AM to eliminate 40s bank OTP delays."
- *Seat Rush Exhaustion*: "Tatkal 3A sold out in 19s: Target AC 2-Tier or use our 2-Leg Split Journey with lower contention."
- *Rate Limit Throttle*: "Use 1-Tap Pre-Armed Mode: click 'Book' once at 10:00:00 AM."

---

## 🔒 Known Limitations & Production Disclosures

If adapting this architecture for production integration:

1. **Official Licensing & Authorization**:
   - Production connection to live railway reservation systems requires an authorized B2C Partner agreement with **IRCTC** and **CRIS** (Centre for Railway Information Systems).
   - Any scraping or reverse-engineering of live IRCTC endpoints is strictly prohibited under the Indian Information Technology Act (2000) and Railway Act (1989).
2. **Captcha Compliance**:
   - IRCTC enforces captchas specifically to deter automated bots. TatkalPro provides accessible audio pronunciation and zero form-data loss on human typos, but does not bypass or OCR automated challenges on live railway servers.
3. **2-Factor Authentication (2FA)**:
   - Live IRCTC transactions require OTP verification via SMS/Email during authentication and payment steps.
4. **Payment Gateway Settlement Timelines**:
   - The simulation demonstrates instant RBI UTR reconciliation ($< 2\text{ mins}$). In live banking networks, UPI/IMPS reversals settle in minutes, while credit/debit card refunds take $T+2$ to $T+4$ business days depending on the acquiring bank.
5. **Rule Synchronization with Official Indian Railways Sources**:
   - The Tatkal Safety Net configuration is pre-seeded with rules current as of November 2026. Because Indian Railways occasionally updates quota rules, concession policies, and refund circulars via Railway Board Commercial Circulars, production deployments must synchronize the rules engine periodically against official IRCTC / CRIS published circulars.

---

## 📄 License
MIT License. Built for educational and distributed systems architectural demonstration.
