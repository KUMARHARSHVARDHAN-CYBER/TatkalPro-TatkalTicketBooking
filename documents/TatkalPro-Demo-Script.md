# TatkalPro: 2-Minute Demo Script

**Before you start (2 minutes of prep)**
- App running on the demo data, "Demo / Simulated data" badge visible
- A saved passenger list with 4 passengers, payment method pre-verified
- Payment failure toggle ready (forced failure on the first attempt)
- A wrong-station booking ready for the Regret Shield moment (search New Delhi, pick Delhi Junction)
- Admin dashboard open in a second tab, with the rush simulation already run
- A screen recording of the full flow as a backup

**Opening line (5 sec, before the timer starts)**
"Other apps help you book faster. TatkalPro makes sure you don't lose or ruin the ticket."

---

## 0:00 to 0:20 | Countdown and a prepared booking
**Screen:** Home screen with the Tatkal countdown, then the "ready" checklist.
**Say:** "Tatkal opens in under a minute. Normally this is where people start typing. Here, the booking is already prepared: passengers, ID and payment are verified. When the window opens, only Book Now is left."
**Do:** Point at the countdown and the green checklist, tap Book Now when it hits zero.

## 0:20 to 0:45 | Live passenger management
**Screen:** Passenger step.
**Say:** "A last-minute change usually means starting over. Here I can add, remove or reorder passengers at any time, and the fare and seat check update instantly."
**Do:** Remove one passenger, show the Undo toast and the fare changing, then tap Undo. Add a passenger from the saved list in one tap.

## 0:45 to 1:15 | Regret Shield
**Screen:** Review screen with the station warning.
**Say:** "Confirmed Tatkal tickets are generally non-refundable, so a wrong station costs the full fare. I searched New Delhi but picked Delhi Junction. The app catches it before I pay, and one tap fixes it. When everything is fine, this check is invisible."
**Do:** Tap "Switch to NDLS" and continue.

## 1:15 to 1:45 | Payment failure and recovery
**Screen:** Payment, then the recovery tracker, then the confirmed ticket.
**Say:** "This is where people lose tickets. UPI fails. Normally you're stuck. Here the seat stays held, the app falls back to another method, and if money is ever deducted without a ticket, a live tracker shows the refund. No blank screen."
**Do:** Trigger the forced failure, let the fallback run, show the confirmed ticket and PNR.

## 1:45 to 2:00 | Bot Shield and the close
**Screen:** Admin dashboard.
**Say:** "Fairness matters too. Bot Shield uses a waiting room, signed booking passes, rate limits and risk scoring. In our rush simulation, here are the blocked requests, and here is the false-positive log for real users. It raises the cost of abuse; it doesn't claim to eliminate bots."
**Do:** Point at blocked requests, risk distribution and the false-positive log.
**Close:** "Prepare. Protect. Recover. That's TatkalPro."

---

## If you are asked...
- **"Does it work with real IRCTC?"** "Not yet. Real inventory belongs to IRCTC, so production needs official partner API access and legal approval. The prototype shows the experience and the recovery logic on simulated data, and the railway provider sits behind an adapter."
- **"Aren't the refund rules different?"** "Rules change and sources differ, so they live in a configurable file with a last-verified date. We would check them against official Indian Railways sources before launch."
- **"Can bots still get through?"** "No defence is perfect. The goal is to make abuse costly and keep real users fast."
- **"Do you have load-test numbers?"** Only quote results you have actually run. The planned test is 5,000 normal users plus 2,000 scripted clients, reporting bots blocked, false-positive rate and p95 latency.

## Timing tips
- Practise the forced payment failure three times; it is the strongest moment.
- If the live app stalls, switch to the backup recording without comment and keep talking.
- If you are short on time, cut the passenger step to 10 seconds and keep Regret Shield and payment recovery.
