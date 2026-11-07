import { FailureAutopsyRecord, TelemetryStep } from "./types";

let autopsyHistory: FailureAutopsyRecord[] = [];
const telemetryBuffer = new Map<string, TelemetryStep[]>();

export class FailureAutopsyService {
  /**
   * Log privacy-safe telemetry steps during booking attempt
   */
  public static logTelemetryStep(
    attemptId: string,
    stepName: string,
    durationMs: number,
    status: TelemetryStep["status"],
    details?: string
  ): void {
    const list = telemetryBuffer.get(attemptId) || [];
    list.push({
      stepName,
      timestamp: Date.now(),
      durationMs,
      status,
      details,
    });
    telemetryBuffer.set(attemptId, list);
  }

  /**
   * Classify root cause and generate a single actionable suggestion
   */
  public static createAutopsy(
    attemptId: string,
    failureStage: FailureAutopsyRecord["failureStage"],
    context: {
      trainNumber: string;
      trainName: string;
      travelClass: string;
      quota: string;
      bankName?: string;
      elapsedSeconds?: number;
    }
  ): FailureAutopsyRecord {
    const timeline = telemetryBuffer.get(attemptId) || [
      { stepName: "Tatkal Window Open (10:00:00 AM)", timestamp: Date.now() - 45000, durationMs: 0, status: "OK" },
      { stepName: "Queue Admission", timestamp: Date.now() - 42000, durationMs: 120, status: "OK" },
      { stepName: "Passenger Master Fill", timestamp: Date.now() - 38000, durationMs: 380, status: "OK" },
      { stepName: "Captcha Verification", timestamp: Date.now() - 35000, durationMs: 1450, status: "OK" },
      { stepName: "Atomic Seat Lock", timestamp: Date.now() - 32000, durationMs: 48, status: "OK" },
      {
        stepName: "Bank 3D-Secure Gateway Handshake",
        timestamp: Date.now() - 1000,
        durationMs: (context.elapsedSeconds || 40) * 1000,
        status: "FAILED",
        details: `${context.bankName || "HDFC Bank"} OTP timeout`,
      },
    ];

    let rootCause = "";
    let actionableSuggestion = "";

    switch (failureStage) {
      case "PAYMENT_GATEWAY":
      case "BANK_OTP":
        const sec = context.elapsedSeconds || 40;
        rootCause = `Bank Gateway Delay (${sec}s): Your bank's 3D-Secure OTP authentication took ${sec} seconds to respond. During this bank delay, concurrent users claimed the final hold slots.`;
        actionableSuggestion = "Pre-authorize UPI Fast Pay or IRCTC iMudra E-Wallet before 10:00 AM to eliminate bank OTP delays.";
        break;

      case "SEAT_LOCK":
        rootCause = `High-Rush Seat Exhaustion: All available ${context.quota} seats in ${context.travelClass} on Train ${context.trainNumber} were claimed within 19 seconds of the window opening.`;
        actionableSuggestion = "Target AC 2-Tier (2A) or use the 2-Leg Split Journey which has lower contention.";
        break;

      case "RATE_LIMIT":
        rootCause = `Queue Telemetry Throttling: Rapid consecutive clicks triggered Bot Shield's sliding-window rate limiter.`;
        actionableSuggestion = "Use the 1-Tap Pre-Armed Mode: set up all details beforehand and click 'Book' exactly once at 10:00:00 AM.";
        break;

      case "CAPTCHA":
        rootCause = `Captcha Entry Delay: Entering the security verification took over 15 seconds, exceeding the rush window threshold.`;
        actionableSuggestion = "Click the Audio Captcha button or use uppercase keys directly without tapping shift.";
        break;

      default:
        rootCause = "Booking session encountered a network synchronization timeout during the 10:00 AM rush.";
        actionableSuggestion = "Check your 5G/Fiber ping on the Pre-Armed Checklist before the window opens.";
    }

    const record: FailureAutopsyRecord = {
      attemptId,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      trainNumber: context.trainNumber,
      trainName: context.trainName,
      travelClass: context.travelClass,
      quota: context.quota,
      failureStage,
      rootCausePlainLanguage: rootCause,
      actionableSuggestion,
      telemetryTimeline: timeline,
    };

    autopsyHistory.unshift(record);
    if (autopsyHistory.length > 20) autopsyHistory.pop();

    return record;
  }

  public static getHistory(): FailureAutopsyRecord[] {
    return [...autopsyHistory];
  }

  public static clearHistory(): void {
    autopsyHistory = [];
  }
}

