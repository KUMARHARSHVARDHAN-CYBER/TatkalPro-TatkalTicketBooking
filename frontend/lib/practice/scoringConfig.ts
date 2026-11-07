/**
 * TatkalPro Practice Mode: Deterministic Scoring Configuration
 * 
 * Formula:
 * - Preparation (max 20 pts): Checklist items complete before window opens (5 pts per item x 4).
 * - Speed after open (max 25 pts): Time from window open to payment completion, scaled by difficulty.
 * - Captcha (max 15 pts): 15 pts on 1st try; -5 pts per retry; minimum 0.
 * - Payment handling (max 20 pts):
 *     - If no failure: 20 pts for smooth 1st attempt.
 *     - If failure injected: 20 pts for recovering via fallback < 8s, scaled down if > 8s; 0 pts if abandoned.
 * - Mistake avoidance (max 20 pts):
 *     - 20 pts if all warnings (e.g. wrong-station trap) caught and corrected.
 *     - 5 pts penalty for ignoring warnings or uncorrected mismatch.
 * 
 * Total Score = Sum of 5 phases (0 to 100 pts)
 */

export type PracticeDifficulty = "EASY" | "NORMAL" | "RUSH";
export type CountdownDuration = 10 | 30 | 60;

export interface DifficultyConfig {
  id: PracticeDifficulty;
  name: string;
  nameHindi: string;
  description: string;
  targetSeconds: number; // Target completion time in seconds
  queueLength: number;
  seatHoldSeconds: number;
  pauseAllowed: boolean;
  failureRate: number;
  badgeColor: string;
}

export const DIFFICULTY_CONFIGS: Record<PracticeDifficulty, DifficultyConfig> = {
  EASY: {
    id: "EASY",
    name: "Easy",
    nameHindi: "सरल",
    description: "Calm queue, 45s seat hold, pause enabled. Ideal for first-time rehearsal.",
    targetSeconds: 40,
    queueLength: 8,
    seatHoldSeconds: 60,
    pauseAllowed: true,
    failureRate: 0,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  NORMAL: {
    id: "NORMAL",
    name: "Normal",
    nameHindi: "सामान्य",
    description: "Standard 10:00 AM rush, realistic queue, standard 25s target. Practice real pace.",
    targetSeconds: 25,
    queueLength: 24,
    seatHoldSeconds: 35,
    pauseAllowed: false,
    failureRate: 0.3,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RUSH: {
    id: "RUSH",
    name: "Rush",
    nameHindi: "भीड़",
    description: "Heavy congestion, #65 in line, fast 15s target, high contention warnings.",
    targetSeconds: 15,
    queueLength: 65,
    seatHoldSeconds: 20,
    pauseAllowed: false,
    failureRate: 0.6,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export interface PracticeRunTelemetry {
  difficulty: PracticeDifficulty;
  countdownSeconds: CountdownDuration;
  // Preparation phase (0 to 4 items)
  checklistItemsCompleted: number;
  // Timing
  windowOpenedAt: number;
  completedAt: number;
  durationMs: number;
  // Steps
  queueWaitMs: number;
  formFillMs: number;
  captchaAttempts: number;
  captchaSolvedMs: number;
  // Payment
  paymentAttempts: number;
  paymentFailureInjected: boolean;
  paymentRecoveryMs: number;
  paymentAbandoned: boolean;
  // Mistakes & Traps
  wrongStationTrapInjected: boolean;
  wrongStationTrapFixed: boolean;
  warningsSeen: string[];
  warningsFixed: string[];
}

export interface PhaseScore {
  name: string;
  earned: number;
  max: number;
  details: string;
}

export interface PracticeScoreResult {
  totalScore: number; // 0 - 100
  rating: "MASTER" | "ALMOST_THERE" | "NEEDS_PRACTICE";
  ratingLabel: string;
  ratingLabelHindi: string;
  ratingColor: string;
  phases: {
    preparation: PhaseScore;
    speed: PhaseScore;
    captcha: PhaseScore;
    payment: PhaseScore;
    mistakeAvoidance: PhaseScore;
  };
  tips: PracticeTip[];
  timeline: Array<{ timeOffset: string; event: string; status: "success" | "warning" | "info" | "error" }>;
}

export interface PracticeTip {
  id: string;
  title: string;
  message: string;
  actionableFix: string;
  category: "PREP" | "SPEED" | "CAPTCHA" | "PAYMENT" | "ACCURACY";
}

export const SCORING_WEIGHTS = {
  PREPARATION_MAX: 20,
  SPEED_MAX: 25,
  CAPTCHA_MAX: 15,
  PAYMENT_MAX: 20,
  MISTAKE_AVOIDANCE_MAX: 20,
};

/**
 * Deterministic scoring algorithm
 */
export function calculatePracticeScore(telemetry: PracticeRunTelemetry): PracticeScoreResult {
  const diffConfig = DIFFICULTY_CONFIGS[telemetry.difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  // 1. Preparation (max 20 pts)
  const prepCount = Math.min(4, Math.max(0, telemetry.checklistItemsCompleted));
  const prepEarned = prepCount * 5;
  const prepScore: PhaseScore = {
    name: "Preparation & Pre-Arming",
    earned: prepEarned,
    max: SCORING_WEIGHTS.PREPARATION_MAX,
    details: `${prepCount}/4 prerequisites armed before window open (+${prepEarned} pts)`,
  };

  // 2. Speed after open (max 25 pts)
  // Target duration scaled by difficulty (seconds from window open to completion)
  const totalSeconds = Math.max(1, telemetry.durationMs / 1000);
  const targetSec = diffConfig.targetSeconds;
  let speedEarned = 0;

  if (totalSeconds <= targetSec) {
    speedEarned = SCORING_WEIGHTS.SPEED_MAX;
  } else if (totalSeconds <= targetSec * 1.5) {
    // Graceful linear degradation
    const fraction = (totalSeconds - targetSec) / (targetSec * 0.5);
    speedEarned = Math.round(SCORING_WEIGHTS.SPEED_MAX - fraction * 7);
  } else if (totalSeconds <= targetSec * 2.5) {
    const fraction = (totalSeconds - targetSec * 1.5) / targetSec;
    speedEarned = Math.round(18 - fraction * 8);
  } else {
    speedEarned = Math.max(5, Math.round(10 - (totalSeconds - targetSec * 2.5) * 0.2));
  }
  speedEarned = Math.min(SCORING_WEIGHTS.SPEED_MAX, Math.max(0, speedEarned));

  const speedScore: PhaseScore = {
    name: "Speed After Open",
    earned: speedEarned,
    max: SCORING_WEIGHTS.SPEED_MAX,
    details: `Finished in ${totalSeconds.toFixed(1)}s (Target: ≤${targetSec}s for ${diffConfig.name})`,
  };

  // 3. Captcha (max 15 pts)
  let captchaEarned = 0;
  if (telemetry.captchaAttempts <= 1) {
    captchaEarned = SCORING_WEIGHTS.CAPTCHA_MAX; // 15
  } else if (telemetry.captchaAttempts === 2) {
    captchaEarned = 10;
  } else if (telemetry.captchaAttempts === 3) {
    captchaEarned = 5;
  } else {
    captchaEarned = 0;
  }
  const captchaScore: PhaseScore = {
    name: "Captcha Accuracy",
    earned: captchaEarned,
    max: SCORING_WEIGHTS.CAPTCHA_MAX,
    details: `${telemetry.captchaAttempts} attempt${telemetry.captchaAttempts === 1 ? "" : "s"} (${telemetry.captchaAttempts === 1 ? "1st try clean" : "Retries incurred penalty"})`,
  };

  // 4. Payment Handling (max 20 pts)
  let paymentEarned = 0;
  let paymentDetails = "";
  if (telemetry.paymentAbandoned) {
    paymentEarned = 0;
    paymentDetails = "Payment abandoned (0 pts)";
  } else if (!telemetry.paymentFailureInjected) {
    paymentEarned = SCORING_WEIGHTS.PAYMENT_MAX;
    paymentDetails = "Smooth 1-tap payment completion (+20 pts)";
  } else {
    // Failure was injected: test recovery speed
    const recoverySec = telemetry.paymentRecoveryMs / 1000;
    if (recoverySec <= 8) {
      paymentEarned = SCORING_WEIGHTS.PAYMENT_MAX;
      paymentDetails = `Fast fallback switch in ${recoverySec.toFixed(1)}s (+20 pts)`;
    } else if (recoverySec <= 15) {
      paymentEarned = 15;
      paymentDetails = `Fallback recovery in ${recoverySec.toFixed(1)}s (+15 pts)`;
    } else {
      paymentEarned = Math.max(5, Math.round(15 - (recoverySec - 15) * 0.5));
      paymentDetails = `Slow fallback recovery in ${recoverySec.toFixed(1)}s (+${paymentEarned} pts)`;
    }
  }
  const paymentScore: PhaseScore = {
    name: "Payment & Gateway Fallback",
    earned: paymentEarned,
    max: SCORING_WEIGHTS.PAYMENT_MAX,
    details: paymentDetails,
  };

  // 5. Mistake Avoidance (max 20 pts)
  let mistakeEarned = SCORING_WEIGHTS.MISTAKE_AVOIDANCE_MAX;
  let mistakeDetails = "Zero uncorrected mistakes (+20 pts)";

  if (telemetry.wrongStationTrapInjected) {
    if (telemetry.wrongStationTrapFixed) {
      mistakeEarned = 20;
      mistakeDetails = "Wrong-station trap caught & fixed via Regret Shield (+20 pts)";
    } else {
      mistakeEarned = 5; // Ignored warning
      mistakeDetails = "Wrong-station terminal trap was ignored (-15 pts penalty)";
    }
  }
  const mistakeScore: PhaseScore = {
    name: "Mistake Avoidance & Sanity",
    earned: mistakeEarned,
    max: SCORING_WEIGHTS.MISTAKE_AVOIDANCE_MAX,
    details: mistakeDetails,
  };

  const totalScore = Math.min(100, Math.max(0, prepEarned + speedEarned + captchaEarned + paymentEarned + mistakeEarned));

  // Rating bracket
  let rating: PracticeScoreResult["rating"] = "NEEDS_PRACTICE";
  let ratingLabel = "Needs Practice";
  let ratingLabelHindi = "अभ्यास की आवश्यकता";
  let ratingColor = "text-rose-600 bg-rose-50 border-rose-200";

  if (totalScore >= 80) {
    rating = "MASTER";
    ratingLabel = "Tatkal Ready";
    ratingLabelHindi = "तत्काल तैयार";
    ratingColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (totalScore >= 60) {
    rating = "ALMOST_THERE";
    ratingLabel = "Almost There";
    ratingLabelHindi = "लगभग तैयार";
    ratingColor = "text-amber-700 bg-amber-50 border-amber-200";
  }

  // Generate top 3 personalized actionable tips
  const tips = generatePersonalizedTips(telemetry, {
    prepScore,
    speedScore,
    captchaScore,
    paymentScore,
    mistakeScore,
    totalScore,
  });

  // Construct readable timeline of events
  const timeline = buildRunTimeline(telemetry);

  return {
    totalScore,
    rating,
    ratingLabel,
    ratingLabelHindi,
    ratingColor,
    phases: {
      preparation: prepScore,
      speed: speedScore,
      captcha: captchaScore,
      payment: paymentScore,
      mistakeAvoidance: mistakeScore,
    },
    tips,
    timeline,
  };
}

/**
 * Rule-based personalized tip generator: picks exactly top 3 most impactful tips
 */
function generatePersonalizedTips(
  telemetry: PracticeRunTelemetry,
  scores: {
    prepScore: PhaseScore;
    speedScore: PhaseScore;
    captchaScore: PhaseScore;
    paymentScore: PhaseScore;
    mistakeScore: PhaseScore;
    totalScore: number;
  }
): PracticeTip[] {
  const candidates: PracticeTip[] = [];

  // Tip candidate 1: Preparation
  if (telemetry.checklistItemsCompleted < 4) {
    candidates.push({
      id: "tip_prep_master",
      title: "Pre-Arm All 4 Prerequisites",
      message: `You missed ${4 - telemetry.checklistItemsCompleted} pre-armed item(s) before the countdown opened.`,
      actionableFix: "Add your master passengers and pre-select your payment method 2 minutes before 10:00 AM.",
      category: "PREP",
    });
  }

  // Tip candidate 2: Payment Fallback
  if (telemetry.paymentFailureInjected && (telemetry.paymentRecoveryMs > 8000 || telemetry.paymentAbandoned)) {
    candidates.push({
      id: "tip_payment_backup",
      title: "Keep Backup UPI / Card Pre-Filled",
      message: `Payment recovery took ${(telemetry.paymentRecoveryMs / 1000).toFixed(1)}s during bank failure.`,
      actionableFix: "Keep your secondary UPI app opened in split-screen or keep your card CVV in memory.",
      category: "PAYMENT",
    });
  }

  // Tip candidate 3: Captcha Retries
  if (telemetry.captchaAttempts > 1) {
    candidates.push({
      id: "tip_captcha_audio",
      title: "Use Audio Captcha on Ambiguous Letters",
      message: `Captcha retries cost ${telemetry.captchaAttempts - 1} extra attempt(s) and lost 5-10 points.`,
      actionableFix: "Tap the audio speaker icon or refresh instantly if a letter looks like 0 vs O or 1 vs I.",
      category: "CAPTCHA",
    });
  }

  // Tip candidate 4: Wrong station trap
  if (telemetry.wrongStationTrapInjected && !telemetry.wrongStationTrapFixed) {
    candidates.push({
      id: "tip_station_trap",
      title: "Check Terminal Station Codes (NZM vs NDLS)",
      message: "You booked a terminal different from your intended city origin without fixing it.",
      actionableFix: "Always verify your 4-letter station code when booking multi-terminal cities like Delhi or Mumbai.",
      category: "ACCURACY",
    });
  }

  // Tip candidate 5: Overall Speed
  const totalSec = telemetry.durationMs / 1000;
  if (totalSec > 25) {
    candidates.push({
      id: "tip_form_speed",
      title: "Shave Form Speed Under 20s",
      message: `Total booking took ${totalSec.toFixed(1)}s. The typical Tatkal sell-out window is 45-60s.`,
      actionableFix: "Use 1-tap passenger selection rather than typing details manually during the live rush.",
      category: "SPEED",
    });
  }

  // Tip candidate 6: Queue patience
  if (telemetry.queueWaitMs > 6000) {
    candidates.push({
      id: "tip_queue_refresh",
      title: "Never Refresh the Virtual Waiting Room",
      message: "Queue wait took over 6s. Refreshing resets your spot to the back of the line.",
      actionableFix: "Let the waiting room admit you automatically; the single-use token secures your entry.",
      category: "SPEED",
    });
  }

  // Fallback tip if user was already perfect
  if (candidates.length < 3) {
    candidates.push({
      id: "tip_mastery_rush",
      title: "Step Up to Rush Difficulty",
      message: "Your fundamentals are rock solid! Test yourself against higher queue volume and tighter holds.",
      actionableFix: "Rehearse on Rush difficulty to prepare for peak festival Tatkal routes (e.g. Diwali / Chhath).",
      category: "SPEED",
    });
  }

  if (candidates.length < 3) {
    candidates.push({
      id: "tip_time_sync",
      title: "Sync Device Clock with IRCTC Atomic Time",
      message: "Device clocks off by even 2 seconds cause you to click before the window officially opens.",
      actionableFix: "Verify your phone time shows exact NIST/atomic sync so your 10:00:00 tap registers instantly.",
      category: "PREP",
    });
  }

  return candidates.slice(0, 3);
}

/**
 * Builds clean timeline log
 */
function buildRunTimeline(telemetry: PracticeRunTelemetry): PracticeScoreResult["timeline"] {
  const events: PracticeScoreResult["timeline"] = [];
  const fmt = (ms: number) => `T+${(ms / 1000).toFixed(1)}s`;

  events.push({
    timeOffset: "T+00.0s",
    event: "Tatkal window opened (10:00:00 AM server clock sync)",
    status: "info",
  });

  if (telemetry.queueWaitMs > 0) {
    events.push({
      timeOffset: fmt(telemetry.queueWaitMs),
      event: `Admitted from Virtual Waiting Room (#${DIFFICULTY_CONFIGS[telemetry.difficulty].queueLength} in line)`,
      status: "success",
    });
  }

  const formEnd = telemetry.queueWaitMs + telemetry.formFillMs;
  events.push({
    timeOffset: fmt(formEnd),
    event: "Passenger & berth details confirmed",
    status: "success",
  });

  if (telemetry.wrongStationTrapInjected) {
    if (telemetry.wrongStationTrapFixed) {
      events.push({
        timeOffset: fmt(formEnd + 400),
        event: "Regret Shield: Detected NZM/NDLS mismatch and applied 1-tap station fix",
        status: "success",
      });
    } else {
      events.push({
        timeOffset: fmt(formEnd + 400),
        event: "Regret Shield: Warning ignored for terminal station mismatch",
        status: "warning",
      });
    }
  }

  const captchaEnd = formEnd + telemetry.captchaSolvedMs;
  if (telemetry.captchaAttempts === 1) {
    events.push({
      timeOffset: fmt(captchaEnd),
      event: "Captcha solved on 1st attempt",
      status: "success",
    });
  } else {
    events.push({
      timeOffset: fmt(captchaEnd),
      event: `Captcha solved after ${telemetry.captchaAttempts} attempts`,
      status: "warning",
    });
  }

  if (telemetry.paymentFailureInjected) {
    events.push({
      timeOffset: fmt(captchaEnd + 2000),
      event: "Banking simulator: Primary UPI gateway failure triggered",
      status: "error",
    });
    if (!telemetry.paymentAbandoned) {
      events.push({
        timeOffset: fmt(telemetry.durationMs),
        event: `Multi-gateway fallback engaged: Switched method and confirmed in ${(telemetry.paymentRecoveryMs / 1000).toFixed(1)}s`,
        status: "success",
      });
    } else {
      events.push({
        timeOffset: fmt(telemetry.durationMs),
        event: "Payment abandoned after gateway error",
        status: "error",
      });
    }
  } else {
    events.push({
      timeOffset: fmt(telemetry.durationMs),
      event: "Payment simulation completed via primary method",
      status: "success",
    });
  }

  return events;
}

