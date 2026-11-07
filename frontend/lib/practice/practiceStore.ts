"use client";

import {
  PracticeDifficulty,
  CountdownDuration,
  PracticeRunTelemetry,
  PracticeScoreResult,
  calculatePracticeScore,
  DIFFICULTY_CONFIGS,
} from "./scoringConfig";

export interface PracticeAttemptRecord {
  id: string;
  timestamp: string; // ISO
  dateFormatted: string;
  difficulty: PracticeDifficulty;
  totalScore: number;
  durationSeconds: number;
  rating: string;
  ratingLabel: string;
}

export interface PracticeSessionState {
  difficulty: PracticeDifficulty;
  countdownSeconds: CountdownDuration;
  // Scenario selection
  trainNumber: string;
  trainName: string;
  classCode: string;
  quota: string;
  fromStation: { code: string; name: string };
  toStation: { code: string; name: string };
  passengerName: string;
  passengerAge: number;
  passengerGender: string;
  passengerBerth: string;
  // Toggles
  includePaymentFailure: boolean;
  includeWrongStationTrap: boolean;
  // Preparation checklist state before countdown
  prepChecklist: {
    masterPaxLoaded: boolean;
    paymentPreArmed: boolean;
    stationCodeChecked: boolean;
    networkPingOk: boolean;
  };
}

const STORAGE_KEYS = {
  HISTORY: "tatkalpro_practice_history_v1",
  CURRENT_SESSION: "tatkalpro_practice_session_v1",
  LATEST_RESULT: "tatkalpro_practice_latest_result_v1",
};

// In-memory memory fallback when localStorage is disabled or throws
let memoryHistory: PracticeAttemptRecord[] = [
  {
    id: "run_seed_1",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    dateFormatted: "03 Nov, 10:02 AM",
    difficulty: "NORMAL",
    totalScore: 78,
    durationSeconds: 27.4,
    rating: "ALMOST_THERE",
    ratingLabel: "Almost There",
  },
  {
    id: "run_seed_2",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    dateFormatted: "04 Nov, 10:01 AM",
    difficulty: "NORMAL",
    totalScore: 86,
    durationSeconds: 21.8,
    rating: "MASTER",
    ratingLabel: "Tatkal Ready",
  },
];

let memorySession: PracticeSessionState = {
  difficulty: "NORMAL",
  countdownSeconds: 10,
  trainNumber: "12952",
  trainName: "Mumbai Rajdhani",
  classCode: "3A",
  quota: "TATKAL",
  fromStation: { code: "NDLS", name: "New Delhi" },
  toStation: { code: "MMCT", name: "Mumbai Central" },
  passengerName: "Aarav Sharma",
  passengerAge: 28,
  passengerGender: "Male",
  passengerBerth: "Lower",
  includePaymentFailure: false,
  includeWrongStationTrap: false,
  prepChecklist: {
    masterPaxLoaded: true,
    paymentPreArmed: true,
    stationCodeChecked: true,
    networkPingOk: true,
  },
};

let memoryLatestResult: PracticeScoreResult | null = null;

export const PracticeStore = {
  /**
   * Safe localStorage get
   */
  getHistory(): PracticeAttemptRecord[] {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return memoryHistory;
      }
      const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return memoryHistory;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : memoryHistory;
    } catch {
      return memoryHistory;
    }
  },

  /**
   * Safe localStorage save
   */
  saveAttempt(record: PracticeAttemptRecord): PracticeAttemptRecord[] {
    try {
      const current = PracticeStore.getHistory();
      const updated = [record, ...current].slice(0, 30); // keep last 30 attempts
      memoryHistory = updated;

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      }
      return updated;
    } catch {
      memoryHistory = [record, ...memoryHistory].slice(0, 30);
      return memoryHistory;
    }
  },

  /**
   * Calculates summary statistics
   */
  getStats() {
    const history = PracticeStore.getHistory();
    if (history.length === 0) {
      return { bestScore: 0, avgLast5: 0, totalRuns: 0 };
    }
    const scores = history.map((h) => h.totalScore);
    const bestScore = Math.max(...scores);
    const last5 = scores.slice(0, 5);
    const avgLast5 = Math.round(last5.reduce((sum, s) => sum + s, 0) / last5.length);
    return {
      bestScore,
      avgLast5,
      totalRuns: history.length,
    };
  },

  /**
   * Get active session configuration
   */
  getSession(): PracticeSessionState {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return memorySession;
      }
      const raw = window.localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!raw) return memorySession;
      return { ...memorySession, ...JSON.parse(raw) };
    } catch {
      return memorySession;
    }
  },

  /**
   * Save session configuration
   */
  saveSession(session: Partial<PracticeSessionState>): PracticeSessionState {
    const merged = { ...memorySession, ...session };
    memorySession = merged;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(merged));
      }
    } catch {}
    return merged;
  },

  /**
   * Save latest scored result
   */
  saveLatestResult(result: PracticeScoreResult) {
    memoryLatestResult = result;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.LATEST_RESULT, JSON.stringify(result));
      }
    } catch {}
  },

  /**
   * Get latest scored result
   */
  getLatestResult(): PracticeScoreResult | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return memoryLatestResult;
      }
      const raw = window.localStorage.getItem(STORAGE_KEYS.LATEST_RESULT);
      if (!raw) return memoryLatestResult;
      return JSON.parse(raw);
    } catch {
      return memoryLatestResult;
    }
  },

  /**
   * Clears latest result
   */
  clearLatestResult() {
    memoryLatestResult = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.LATEST_RESULT);
      }
    } catch {}
  },

  /**
   * Default initial session
   */
  getDefaultSession(): PracticeSessionState {
    return {
      difficulty: "NORMAL",
      countdownSeconds: 10,
      trainNumber: "12952",
      trainName: "Mumbai Rajdhani",
      classCode: "3A",
      quota: "TATKAL",
      fromStation: { code: "NDLS", name: "New Delhi" },
      toStation: { code: "MMCT", name: "Mumbai Central" },
      passengerName: "Aarav Sharma",
      passengerAge: 28,
      passengerGender: "Male",
      passengerBerth: "Lower",
      includePaymentFailure: false,
      includeWrongStationTrap: false,
      prepChecklist: {
        masterPaxLoaded: true,
        paymentPreArmed: true,
        stationCodeChecked: true,
        networkPingOk: true,
      },
    };
  },
};

