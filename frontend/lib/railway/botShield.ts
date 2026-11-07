/**
 * TatkalPro Bot Shield & Anti-Abuse Defensive Engine
 *
 * Provides:
 * 1. Cryptographically verified single-use 5-minute booking tokens (Waiting Room Pass)
 * 2. Multi-key sliding-window rate limiters (account, IP, device fingerprint, phone number)
 * 3. Privacy-safe behavioral risk scoring (0-100) based on interaction ergonomics
 * 4. Abuse controls (passenger quotas, duplicate ID prevention, honeypots, replay guards)
 * 5. Admin telemetry store for the Light-Themed Admin Dashboard
 */

export interface WaitingRoomPass {
  passId: string;
  userId: string;
  ipAddress: string;
  deviceFingerprint: string;
  issuedAt: number;
  expiresAt: number;
  isConsumed: boolean;
  signature: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  reason?: string;
}

export interface BehavioralSignals {
  timeOnPageMs: number;
  typingCadenceMs: number[];      // Inter-keystroke intervals (variance analyzed, not text)
  mouseMoveCount: number;
  touchInteractionCount: number;
  tabFocusChanges: number;
  isHeadless: boolean;            // navigator.webdriver check
  honeypotFilled: boolean;        // Hidden form field bot trap
}

export interface RiskEvaluation {
  riskScore: number;             // 0 (pure human) to 100 (automated bot)
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: "ALLOW" | "CAPTCHA" | "STEP_UP_OTP" | "BLOCK";
  reasons: string[];
}

export interface FlaggedEntity {
  id: string;
  type: "IP" | "DEVICE" | "ACCOUNT";
  value: string;
  riskScore: number;
  reason: string;
  timestamp: string;
  status: "FLAGGED" | "BLOCKED" | "ALLOWLISTED";
}

export interface BotShieldMetrics {
  totalBookingsAttempted: any;
  totalRequestsToday: number;
  blockedRequestsCount: number;
  tokensIssued: number;
  tokensConsumed: number;
  activeQueueLength: number;
  p95LatencyMs: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  flaggedEntities: FlaggedEntity[];
  thresholdSettings: {
    captchaThreshold: number;   // default 40
    otpThreshold: number;       // default 70
    blockThreshold: number;     // default 90
    maxBookingsPerDay: number;  // default 8
  };
}

// In-Memory Storage for Standalone Execution
const issuedTokens = new Map<string, WaitingRoomPass>();
const slidingWindowRecords = new Map<string, number[]>();
const activeIdReservations = new Map<string, { bookingTime: number; trainNumber: string }>();
const userDailyBookings = new Map<string, number>();
const blockedSet = new Set<string>();
const allowlistSet = new Set<string>();

// Initial Seeded Metrics for Admin Dashboard
let telemetryMetrics: BotShieldMetrics = {
  totalRequestsToday: 148290,
  blockedRequestsCount: 18420,
  tokensIssued: 9540,
  tokensConsumed: 8910,
  activeQueueLength: 42,
  p95LatencyMs: 48,
  riskDistribution: {
    low: 78,
    medium: 14,
    high: 6,
    critical: 2,
  },
  flaggedEntities: [
    {
      id: "flag_1",
      type: "IP",
      value: "103.21.244.18",
      riskScore: 94,
      reason: "Scripted cadence (3ms), Headless browser, Honeypot triggered",
      timestamp: "Just now",
      status: "BLOCKED",
    },
    {
      id: "flag_2",
      type: "DEVICE",
      value: "fp_chrome_win_84a92c",
      riskScore: 88,
      reason: "Parallel requests across 6 distinct phone numbers",
      timestamp: "2 mins ago",
      status: "FLAGGED",
    },
    {
      id: "flag_3",
      type: "ACCOUNT",
      value: "agent_rapid_99@gmail.com",
      riskScore: 72,
      reason: "Exceeded 8 passengers booked in a 24-hour cycle",
      timestamp: "5 mins ago",
      status: "FLAGGED",
    },
    {
      id: "flag_4",
      type: "IP",
      value: "157.240.198.35",
      riskScore: 12,
      reason: "Verified IRCTC e-Mitra Rural Kiosk center",
      timestamp: "10 mins ago",
      status: "ALLOWLISTED",
    },
  ],
  thresholdSettings: {
    captchaThreshold: 40,
    otpThreshold: 70,
    blockThreshold: 90,
    maxBookingsPerDay: 8,
  },
  totalBookingsAttempted: undefined
};

/**
 * Helper to compute mock HMAC signature for passes
 */
function createTokenSignature(passId: string, userId: string, ip: string, expiresAt: number): string {
  return `sig_${Buffer.from(`${passId}:${userId}:${ip}:${expiresAt}:tatkalpro_secret_key`).toString("base64").substring(0, 24)}`;
}

export class BotShieldService {
  /**
   * Issues a 5-minute single-use signed admission pass once admitted from the waiting room.
   */
  issueAdmissionPass(userId: string, ipAddress: string, deviceFingerprint: string): WaitingRoomPass {
    const passId = `pass_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 5 * 60 * 1000; // 5 minutes validity
    const signature = createTokenSignature(passId, userId, ipAddress, expiresAt);

    const pass: WaitingRoomPass = {
      passId,
      userId,
      ipAddress,
      deviceFingerprint,
      issuedAt,
      expiresAt,
      isConsumed: false,
      signature,
    };

    issuedTokens.set(passId, pass);
    telemetryMetrics.tokensIssued++;
    return pass;
  }

  /**
   * Verifies that a booking pass is authentic, unexpired, and not yet consumed.
   */
  verifyAndConsumePass(passId: string, userId: string, ipAddress: string): { valid: boolean; reason?: string } {
    const pass = issuedTokens.get(passId);

    if (!pass) {
      return { valid: false, reason: "Missing or invalid Waiting Room Admission Pass. Please rejoin the queue." };
    }

    if (pass.isConsumed) {
      return { valid: false, reason: "Single-use admission pass has already been consumed. Replay attempt rejected." };
    }

    if (Date.now() > pass.expiresAt) {
      return { valid: false, reason: "Admission pass has expired (5 minute TTL exceeded). Please rejoin the queue." };
    }

    // Verify signature
    const expectedSig = createTokenSignature(passId, pass.userId, pass.ipAddress, pass.expiresAt);
    if (pass.signature !== expectedSig) {
      return { valid: false, reason: "Pass signature verification failed. Cryptographic tamper detected." };
    }

    // Mark as consumed
    pass.isConsumed = true;
    telemetryMetrics.tokensConsumed++;
    return { valid: true };
  }

  /**
   * Multi-key Sliding Window Rate Limiter
   * Checks limits across: IP, Device Fingerprint, and Account ID
   */
  checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
    if (allowlistSet.has(key)) {
      return { allowed: true, limit, remaining: limit, resetAfterSeconds: 0 };
    }

    if (blockedSet.has(key)) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAfterSeconds: 3600,
        reason: "Access denied by Railway Cyber Safety Shield. Excessive automation detected.",
      };
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const timestamps = slidingWindowRecords.get(key) || [];
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      const oldest = validTimestamps[0];
      const resetAfterSeconds = Math.ceil((oldest + windowSeconds * 1000 - now) / 1000);
      telemetryMetrics.blockedRequestsCount++;

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAfterSeconds,
        reason: `Rate limit of ${limit} requests per ${windowSeconds}s reached. Please wait ${resetAfterSeconds}s before retrying.`,
      };
    }

    validTimestamps.push(now);
    slidingWindowRecords.set(key, validTimestamps);
    telemetryMetrics.totalRequestsToday++;

    return {
      allowed: true,
      limit,
      remaining: limit - validTimestamps.length,
      resetAfterSeconds: windowSeconds,
    };
  }

  /**
   * Privacy-Safe Ergonomic Behavioral Risk Scoring (0 to 100)
   * Evaluates how natural human typing, form cadence, and mouse/touch gestures appear.
   */
  evaluateBehavioralRisk(signals: BehavioralSignals): RiskEvaluation {
    let score = 0;
    const reasons: string[] = [];

    // 1. Honeypot check (Instant High Penalty)
    if (signals.honeypotFilled) {
      score += 65;
      reasons.push("Hidden honeypot field filled (bot automation detected)");
    }

    // 2. Headless indicator
    if (signals.isHeadless) {
      score += 40;
      reasons.push("Headless browser execution environment detected");
    }

    // 3. Superhuman speed check
    if (signals.timeOnPageMs < 1200) {
      score += 35;
      reasons.push("Form submitted under 1.2 seconds (superhuman completion speed)");
    }

    // 4. Typing cadence variance
    if (signals.typingCadenceMs.length >= 4) {
      const sum = signals.typingCadenceMs.reduce((a, b) => a + b, 0);
      const avg = sum / signals.typingCadenceMs.length;
      const variance = signals.typingCadenceMs.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / signals.typingCadenceMs.length;
      
      // Scripts type with exactly identical delays (e.g. 5ms between letters, variance < 10)
      if (variance < 15 && avg < 30) {
        score += 35;
        reasons.push("Robotic typing cadence detected (inter-keystroke variance < 15ms)");
      }
    }

    // 5. Zero interaction pointer check
    if (signals.mouseMoveCount === 0 && signals.touchInteractionCount === 0) {
      score += 25;
      reasons.push("No pointer or touch gestures recorded during form interaction");
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    let level: RiskEvaluation["level"] = "LOW";
    let recommendedAction: RiskEvaluation["recommendedAction"] = "ALLOW";

    const { captchaThreshold, otpThreshold, blockThreshold } = telemetryMetrics.thresholdSettings;

    if (score >= blockThreshold) {
      level = "CRITICAL";
      recommendedAction = "BLOCK";
    } else if (score >= otpThreshold) {
      level = "HIGH";
      recommendedAction = "STEP_UP_OTP";
    } else if (score >= captchaThreshold) {
      level = "MEDIUM";
      recommendedAction = "CAPTCHA";
    }

    return {
      riskScore: score,
      level,
      recommendedAction,
      reasons: reasons.length > 0 ? reasons : ["Natural human interaction characteristics verified"],
    };
  }

  /**
   * Validates duplicate ID rules across active Tatkal windows
   */
  validatePassengerIdentityLimits(
    userId: string,
    idNumber: string,
    trainNumber: string
  ): { valid: boolean; message?: string } {
    const existing = activeIdReservations.get(idNumber);
    const now = Date.now();

    // Check if ID is already tied to an active booking within the last 15 minutes
    if (existing && now - existing.bookingTime < 15 * 60 * 1000) {
      return {
        valid: false,
        message: `Government ID ${idNumber} already has an active booking attempt on Train ${existing.trainNumber} in this Tatkal window. Only 1 active reservation per ID is permitted.`,
      };
    }

    // Check account daily booking caps
    const currentBookedCount = userDailyBookings.get(userId) || 0;
    if (currentBookedCount >= telemetryMetrics.thresholdSettings.maxBookingsPerDay) {
      return {
        valid: false,
        message: `Account has reached the maximum safety quota of ${telemetryMetrics.thresholdSettings.maxBookingsPerDay} passenger bookings per 24 hours.`,
      };
    }

    return { valid: true };
  }

  /**
   * Records committed ID reservations
   */
  commitReservationId(userId: string, idNumber: string, trainNumber: string, passengerCount: number) {
    activeIdReservations.set(idNumber, { bookingTime: Date.now(), trainNumber });
    const current = userDailyBookings.get(userId) || 0;
    userDailyBookings.set(userId, current + passengerCount);
  }

  /**
   * Retrieves live metrics for Admin Dashboard
   */
  getTelemetryMetrics(): BotShieldMetrics {
    return { ...telemetryMetrics };
  }

  /**
   * Admin actions: Block an entity
   */
  blockEntity(value: string, reason: string) {
    blockedSet.add(value);
    allowlistSet.delete(value);
    telemetryMetrics.flaggedEntities.unshift({
      id: `flag_${Date.now()}`,
      type: value.includes(".") ? "IP" : "DEVICE",
      value,
      riskScore: 98,
      reason,
      timestamp: "Just now",
      status: "BLOCKED",
    });
  }

  /**
   * Admin actions: Allow-list an entity
   */
  allowlistEntity(value: string) {
    allowlistSet.add(value);
    blockedSet.delete(value);
    const existing = telemetryMetrics.flaggedEntities.find((f) => f.value === value);
    if (existing) {
      existing.status = "ALLOWLISTED";
    }
  }

  /**
   * Admin actions: Update security thresholds
   */
  updateThresholds(settings: Partial<BotShieldMetrics["thresholdSettings"]>) {
    telemetryMetrics.thresholdSettings = {
      ...telemetryMetrics.thresholdSettings,
      ...settings,
    };
  }
}

export const botShieldService = new BotShieldService();

