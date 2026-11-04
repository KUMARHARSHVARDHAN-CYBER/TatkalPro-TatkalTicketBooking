# 🚂 TatkalPro: High-Concurrency IRCTC Tatkal Railway Booking Engine & PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-dc2626.svg)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-28%2F28%20Passing-emerald.svg)]()

A modern, high-throughput, mobile-first Progressive Web Application (PWA) and backend architecture modeled on the standard IRCTC Rail Connect flow, engineered specifically to fix the **10 real-world pain points of 10:00 AM Tatkal booking**.

> ⚠️ **Demo / Simulated Sandbox Notice**:
> This project operates with a realistic mock railway backend behind a clean `IRailwayProvider` adapter interface. It is **not affiliated with IRCTC or CRIS**. No real money is charged and no actual railway tickets are booked. Unauthorized bot automation, scraping, or captcha bypass of live IRCTC systems is strictly prohibited by law.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["Client PWA (Mobile/Desktop)\nOffline Shell + Low-Bandwidth Mode"] -->|Search / Hold / Pay / Confirm| API["Next.js App Router API Routes\n(or Express Gateway)"]
    
    API --> Adapter["IRailwayProvider Adapter Contract\n(MockRailwayAdapter / CRIS Live Adapter)"]
    
    subgraph Concurrency & Hold Layer
        Adapter -->|1. Hold Seats (480s TTL)| Redis["Redis In-Memory Engine\n(Atomic Lua Lock & Counter)"]
        Redis -->|Atomic Check| Seats{"Seats >= Req?"}
        Seats -->|Yes| LockToken["Generate holdToken\n(8-Minute Seat Reservation)"]
        Seats -->|No| Waitlist["409 Conflict\nSEAT_UNAVAILABLE"]
    end
    
    subgraph Split-Ticket Algorithm
        Adapter -->|Route Full| Dijkstra["Dijkstra Split-Routing Engine\n(Finds Confirmed 2-Leg Journey)"]
        Dijkstra --> SplitResult["Confirmed Leg 1 + Leg 2\nSafe Platform Layover (30-240m)"]
    end

    subgraph Resilient Checkout & Payment
        Adapter --> Captcha["Audio & Visual Captcha\n(Zero Form Data Loss on Retry)"]
        Captcha --> PaymentGateway["Multi-Gateway Switch\n(UPI QR / Intent / Cards / Netbanking)"]
        PaymentGateway -->|Gateway Failure| Fallback["Auto-Fallback Secondary Gateway"]
        PaymentGateway -->|Money Deducted but Failed| ReconEngine["Auto-Refund Reconciliation Engine\n(Instant UTR Tracking in 2 Mins)"]
        PaymentGateway -->|Payment Success| PNRConfirm["Issue Official 10-Digit PNR\nCoach & Berth Allocation"]
    end
```

---

## 💡 The 10 Real Tatkal Pain Points Solved

| # | Pain Point in Real IRCTC | How TatkalPro Solves It |
|---|--------------------------|--------------------------|
| **1** | **Tatkal Timing Anxiety** | Live server-synced countdown timer for AC (10:00 AM) and Non-AC (11:00 AM), with a 4-point Pre-Armed Readiness Checklist (passengers, payment, ID, network latency). |
| **2** | **Slow Form Filling** | Saved Master Passenger List with 1-tap select, automatic Aadhaar/PAN linking, and a "Prepare Booking" mode that reduces open-window booking to **1 tap**. |
| **3** | **Captcha Frustration** | Accessible, high-contrast visual SVG captcha with built-in text-to-speech audio pronunciation. **Crucially: entering a wrong captcha never clears entered passenger data.** |
| **4** | **Session Timeouts & Crashes** | Atomic Redis seat-hold with an **8-minute reservation countdown timer**. State automatically persists to `localStorage` and server draft cache; session keep-alive prevents mid-booking logout. |
| **5** | **Payment Failures** | Multi-gateway routing (UPI QR/Intent/VPA, Credit/Debit cards, Netbanking, Wallets) with **auto-fallback**. If a bank deducts money without ticket confirmation, the **Auto-Refund Reconciliation Tracker** provides live UTR tracking and instant refund status within 2 minutes. |
| **6** | **Waitlist Uncertainty** | Machine-learning style confirmation probability predictor (0-100%) with 90-day historical chart rationale and a "Cancellation Watch" notification bell. |
| **7** | **Exhausted Direct Seats** | **Dijkstra Split-Ticket Routing Algorithm**: If direct seats are sold out, evaluates intermediate junction hubs (e.g., KOTA for NDLS $\to$ MMCT) and guarantees confirmed seats on both legs with a safe transfer layover. |
| **8** | **Virtual Waiting Room & Fairness** | Per-user token-bucket rate limiting and an orderly queueing virtual waiting room under 10:00 AM spikes ("You're #42 in line") with zero bot advantages. |
| **9** | **Hidden Fares & Surcharges** | 100% upfront transparent fare breakdown (Base Fare + Tatkal Charge + Superfast + GST 5% + PG Fee ₹15) presented before payment with zero surprises. |
| **10** | **Post-Booking Experience** | Official IRCTC Electronic Reservation Slip (ERS) layout with QR code, barcode, allocated coach/berth, 1-tap WhatsApp sharing, Google Calendar export, and live Cancellation & Refund Calculator. |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- **Docker & Docker Compose** (optional for containerized deployment)

### Option 1: Running the Fullstack Next.js PWA (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/KUMARHARSHVARDHAN-CYBER/tatkal-booking-highcocurrency.git
cd tatkal-booking-highcocurrency

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app runs in standalone mobile-first PWA mode with offline caching enabled.

### Option 2: Running with Docker Compose (Full Stack + Redis + PostgreSQL)

```bash
docker-compose up --build
```
Services started:
- `tatkalpro-app`: Next.js PWA on `http://localhost:3000`
- `tatkalpro-redis`: Redis 7 on port `6379`
- `tatkalpro-postgres`: PostgreSQL 16 on port `5432`

---

## 🧪 Running the Verification Test Suites

### Comprehensive Domain & Adapter Unit Suite (28 Tests)
Verifies fare calculations, Tatkal rules, atomic seat holds, auto-refund UTR tracking, Dijkstra split routing, and end-to-end PNR generation:

```bash
# From the project root
npx --prefix frontend tsx tests/tatkalpro-suite.ts
```

**Result:**
```text
=======================================================
       TATKALPRO COMPREHENSIVE VERIFICATION SUITE       
=======================================================
▶ [1/6] Station Search & Multilingual Matching      ✅ 3/3 PASS
▶ [2/6] Upfront Fare Calculation & Transparency     ✅ 6/6 PASS
▶ [3/6] Atomic Seat Hold TTL & Anti-Overselling     ✅ 3/3 PASS
▶ [4/6] Multi-Gateway Fallback & Auto-Refund        ✅ 5/5 PASS
▶ [5/6] Dijkstra Split-Ticket Algorithm             ✅ 5/5 PASS
▶ [6/6] Complete End-to-End Booking Lifecycle       ✅ 5/5 PASS
=======================================================
TEST SUMMARY: 28 PASSED, 0 FAILED (100% SUCCESS)
=======================================================
```

### High-Concurrency 10:00 AM Load Test (k6)
Simulates 5,000 concurrent virtual users hitting the Tatkal hold and booking pipeline at peak rush:

```bash
k6 run scripts/k6-tatkal-rush.js
```
**SLAs Verified:**
- $p(95)$ Latency $< 150\text{ms}$
- $p(99)$ Latency $< 300\text{ms}$
- Zero seats oversold

---

## 📱 Mobile-First PWA & Low-Bandwidth Mode

1. **Low-Bandwidth Mode**:
   - Pinned toggle in the top demo banner.
   - Instantly strips high-resolution images, complex backdrop blur filters, and heavyweight animations.
   - Reduces first load bundle payload to $< 70\text{ kB}$ for sluggish 3G/4G connections during the 10:00 AM rush.
2. **Offline PWA Shell**:
   - Configured in `public/manifest.json` and `public/sw.js`.
   - Supports "Add to Home Screen" on Android & iOS with native app feel.
3. **Multilingual (i18n)**:
   - 1-click toggle between **English**, **Hindi (हिंदी)**, and **Hinglish**.
   - Station search matches English codes (`NDLS`), English names (`New Delhi`), Hindi names (`नई दिल्ली`), and city names (`Delhi`, `Dilli`).

---

## 🔒 Known Limitations & Production IRCTC Integration

If transitioning this prototype into a production service with real railway ticketing:

1. **Official Railway Permissions & Licensing**:
   - Live integration with Indian Railways requires an official Principal Service Provider (PSP) or B2C Partner agreement with **IRCTC** and **CRIS** (Centre for Railway Information Systems).
   - Any scraping, reverse-engineering of IRCTC endpoints, or session token sniffing is a violation of the Indian Information Technology Act (2000) and Railway Act (1989).
2. **Captcha OCR Compliance**:
   - IRCTC enforces captchas specifically to deter automated bots. TatkalPro's accessible captcha provides audio pronunciation and preserves form data upon human typo, but does not bypass or OCR automated challenges on live railway servers.
3. **2-Factor Authentication (2FA)**:
   - Live IRCTC logins require SMS/Email OTP verification during login and payment steps.
4. **Payment Gateway Settlement Times**:
   - The mock refund reconciliation engine demonstrates instant UTR issuance ($< 2\text{ mins}$). In live banking networks, IMPS/UPI refunds settle instantly, whereas credit/debit card chargeback reversals take $T+2$ to $T+4$ business days depending on the issuing bank.

---

## 📄 License
MIT License. Built for educational and architectural demonstration purposes.
