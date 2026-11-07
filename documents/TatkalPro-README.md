# TatkalPro

A modern, mobile-first Tatkal train ticket booking web app (PWA). It keeps the familiar flow of the IRCTC Rail Connect app, adds a clean light UI, and fixes the problems that make Tatkal booking stressful.

> **Other apps help you book faster. TatkalPro makes sure you don't lose or ruin the ticket.**

**Status:** prototype running on a **simulated railway backend**. It does not call, scrape or automate the real IRCTC.

## The problems it solves

| Problem | TatkalPro's answer |
|---|---|
| Slow form filling at the window | "Prepare booking" mode: passengers, ID and payment ready before the window, only "Book Now" left |
| Last-minute passenger changes | Live add / edit / remove / duplicate / reorder with Undo; fare, seat check and validation refresh instantly |
| Captcha and session timeouts | Accessible captcha that never wipes the form; autosaved drafts; visible seat-hold timer |
| Payment failures | Gateway auto-fallback, seat hold, idempotent payments, "money deducted, no ticket" reconciliation with a live refund tracker |
| Waitlist uncertainty | Confirmation probability with explanation, smart alternatives, cancellation watch |
| Bots and an unfair rush | **Bot Shield** (below) |
| Costly, irreversible mistakes | **Tatkal Safety Net** (below) |
| Hidden fees | Full fare (base + Tatkal charge + GST + gateway fee) shown upfront |
| Scams | Fake-link and UPI-request warnings, verified-domain badge |

## Standout modules

### Bot Shield (defensive only)
- Waiting room with a signed, short-lived, single-use booking pass
- Sliding-window rate limits per account, IP, device fingerprint and phone number
- Behaviour risk scoring (timing and device signals, no keystroke content stored): low = no friction, medium = captcha, high = OTP, very high = temporary block with appeal
- Idempotency keys, one-time nonces, honeypot fields, multi-account detection
- Admin dashboard: blocked requests, risk distribution, flagged devices, false-positive log

Goal: raise the cost of abuse while real users feel no extra friction. It does not claim to eliminate bots.

### Tatkal Safety Net
Confirmed Tatkal tickets are generally non-refundable, so a rushed mistake can cost the full fare.
- **Regret Shield:** silent pre-payment checks for wrong station (e.g. NDLS vs DLI), date, class/quota and passenger data, with one-tap fixes
- **ID and travel-day readiness:** shows whose ID is on the ticket and sends reminders before departure
- **Group Split Coordinator:** plans multi-PNR bookings for groups above four, with a Plan B if only some confirm
- **Failure Autopsy:** explains why an attempt failed and what to change next time

## Tech stack
- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- In-memory mock railway API by default: `npm install && npm run dev`
- Optional Postgres, Redis and live updates via Docker Compose
- Rules engine in a configurable JSON file with a "last verified" date
- English and Hindi, WCAG AA

## Design
Light, calm and professional: off-white surfaces, soft blue primary (#2563EB), warm orange action colour (#F97316), pastel status chips, Inter and Poppins, 8px grid, 44px minimum tap targets. Designed in Figma first, then implemented from the Figma file.

## Run it
```bash
npm install
npm run dev
```
Open the printed local URL. A "Demo / Simulated data" badge is shown on every screen.

## Testing plan
- Unit tests: fare calculation, passenger add/remove rules, seat-lock logic, rate limiter, risk scoring, Safety Net rules
- E2E: search, add/remove passengers, book, pay (forced failure and recovery), PNR
- k6 rush test: 5,000 normal users plus 2,000 scripted clients; report bots blocked, false-positive rate and p95 latency

## Known limitations
- Real ticket inventory belongs to IRCTC. A production version needs official partner API access and legal approval.
- Live payment gateway and bank integrations are simulated.
- Bot Shield reduces abuse; no defence is perfect.
- Railway rules change and public sources can conflict (for example, tickets allowed per user ID per window). Keep the rules file in sync with official Indian Railways sources before every release.
