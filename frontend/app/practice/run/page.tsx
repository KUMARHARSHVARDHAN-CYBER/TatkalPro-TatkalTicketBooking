"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Volume2,
  X,
  Play,
  Pause,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
} from "lucide-react";
import { PracticeBanner } from "../../../components/practice/PracticeBanner";
import {
  PracticeStore,
  PracticeSessionState,
  PracticeAttemptRecord,
} from "../../../lib/practice/practiceStore";
import {
  DIFFICULTY_CONFIGS,
  calculatePracticeScore,
  PracticeRunTelemetry,
} from "../../../lib/practice/scoringConfig";

type RunPhase = "COUNTDOWN" | "WAITING_ROOM" | "PASSENGER" | "REVIEW" | "PAYMENT";

export default function PracticeRunPage() {
  const router = useRouter();
  const session = useRef<PracticeSessionState>(PracticeStore.getSession()).current;
  const diffConfig = DIFFICULTY_CONFIGS[session.difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  // Run Phase State
  const [phase, setPhase] = useState<RunPhase>("COUNTDOWN");
  const [isPaused, setIsPaused] = useState(false);

  // Timers & Milliseconds
  const [countdownRemainingMs, setCountdownRemainingMs] = useState(
    session.countdownSeconds * 1000
  );
  const [queuePosition, setQueuePosition] = useState(diffConfig.queueLength);

  // Telemetry tracking
  const windowOpenTimestamp = useRef<number>(0);
  const queueStartTimestamp = useRef<number>(0);
  const queueEndTimestamp = useRef<number>(0);
  const formStartTimestamp = useRef<number>(0);
  const formEndTimestamp = useRef<number>(0);
  const captchaStartTimestamp = useRef<number>(0);
  const captchaAttempts = useRef<number>(1);
  const captchaSolvedTimestamp = useRef<number>(0);
  const paymentStartTimestamp = useRef<number>(0);
  const paymentAttempts = useRef<number>(1);
  const paymentRecoveryStart = useRef<number>(0);
  const paymentRecoveryEnd = useRef<number>(0);

  // Interactive Form States
  const [passengerName, setPassengerName] = useState(session.passengerName);
  const [passengerAge, setPassengerAge] = useState(session.passengerAge);
  const [passengerGender, setPassengerGender] = useState(session.passengerGender);
  const [passengerBerth, setPassengerBerth] = useState(session.passengerBerth);

  // Trap States
  const [stationTrapCode, setStationTrapCode] = useState(
    session.includeWrongStationTrap ? "NZM" : session.fromStation.code
  );
  const [stationTrapFixed, setStationTrapFixed] = useState(!session.includeWrongStationTrap);
  const [showRegretShieldAlert, setShowRegretShieldAlert] = useState(session.includeWrongStationTrap);

  // Captcha
  const [captchaCode, setCaptchaCode] = useState("K9X4M");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentFailedState, setPaymentFailedState] = useState(false);
  const [backupMethodReady, setBackupMethodReady] = useState(false);

  // Seat contention warning (injected on Rush difficulty)
  const [showContentionWarning, setShowContentionWarning] = useState(
    session.difficulty === "RUSH"
  );

  // 1. COUNTDOWN TICKER
  useEffect(() => {
    if (phase !== "COUNTDOWN" || isPaused) return;

    const interval = setInterval(() => {
      setCountdownRemainingMs((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          // Transition to WAITING ROOM
          windowOpenTimestamp.current = Date.now();
          queueStartTimestamp.current = Date.now();
          setPhase("WAITING_ROOM");
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, isPaused]);

  // 2. WAITING ROOM QUEUE DECREMENT
  useEffect(() => {
    if (phase !== "WAITING_ROOM" || isPaused) return;

    const stepMs = session.difficulty === "RUSH" ? 500 : 350;
    const interval = setInterval(() => {
      setQueuePosition((prev) => {
        const decrement = session.difficulty === "RUSH" ? 6 : 4;
        const next = prev - decrement;
        if (next <= 1) {
          clearInterval(interval);
          queueEndTimestamp.current = Date.now();
          formStartTimestamp.current = Date.now();
          setPhase("PASSENGER");
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [phase, isPaused, session.difficulty]);

  // Fast-Pass for Waiting Room
  const handleFastPassWaitingRoom = () => {
    queueEndTimestamp.current = Date.now();
    formStartTimestamp.current = Date.now();
    setQueuePosition(0);
    setPhase("PASSENGER");
  };

  // Quit practice without saving
  const handleQuit = () => {
    router.push("/practice");
  };

  // Passenger Submit
  const handlePassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    formEndTimestamp.current = Date.now();
    captchaStartTimestamp.current = Date.now();
    setPhase("REVIEW");
  };

  // 1-Tap Fix Station Trap
  const handleFixStationTrap = () => {
    setStationTrapCode(session.fromStation.code);
    setStationTrapFixed(true);
    setShowRegretShieldAlert(false);
  };

  // Captcha Refresh
  const handleRefreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let next = "";
    for (let i = 0; i < 5; i++) {
      next += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(next);
    captchaAttempts.current += 1;
  };

  // Audio Captcha
  const handlePlayAudioCaptcha = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(captchaCode.split("").join(" "));
      speech.rate = 0.85;
      window.speechSynthesis.speak(speech);
    }
  };

  // Captcha Verify and Proceed to Payment
  const handleCaptchaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError(true);
      captchaAttempts.current += 1;
      handleRefreshCaptcha();
      return;
    }
    setCaptchaError(false);
    captchaSolvedTimestamp.current = Date.now();
    paymentStartTimestamp.current = Date.now();
    setPhase("PAYMENT");
  };

  // Payment Execution & Chaos Ingestion
  const handlePay = () => {
    setIsPaymentProcessing(true);

    // If Payment Failure is injected and we haven't failed yet
    if (session.includePaymentFailure && !paymentFailedState && paymentMethod === "UPI") {
      setTimeout(() => {
        setIsPaymentProcessing(false);
        setPaymentFailedState(true);
        paymentAttempts.current += 1;
        paymentRecoveryStart.current = Date.now();
      }, 1200);
      return;
    }

    // Otherwise success!
    setTimeout(() => {
      setIsPaymentProcessing(false);
      if (paymentFailedState) {
        paymentRecoveryEnd.current = Date.now();
      }
      finishRehearsalRun();
    }, 1400);
  };

  // Finalize Rehearsal Run & Calculate Score
  const finishRehearsalRun = () => {
    const now = Date.now();
    const durationMs = Math.max(1000, now - windowOpenTimestamp.current);
    const queueWaitMs = Math.max(0, queueEndTimestamp.current - queueStartTimestamp.current);
    const formFillMs = Math.max(0, formEndTimestamp.current - formStartTimestamp.current);
    const captchaSolvedMs = Math.max(0, captchaSolvedTimestamp.current - captchaStartTimestamp.current);
    const paymentRecoveryMs = paymentRecoveryEnd.current
      ? Math.max(0, paymentRecoveryEnd.current - paymentRecoveryStart.current)
      : 0;

    const prepEarnedCount = Object.values(session.prepChecklist).filter(Boolean).length;

    const telemetry: PracticeRunTelemetry = {
      difficulty: session.difficulty,
      countdownSeconds: session.countdownSeconds,
      checklistItemsCompleted: prepEarnedCount,
      windowOpenedAt: windowOpenTimestamp.current,
      completedAt: now,
      durationMs,
      queueWaitMs,
      formFillMs,
      captchaAttempts: captchaAttempts.current,
      captchaSolvedMs,
      paymentAttempts: paymentAttempts.current,
      paymentFailureInjected: session.includePaymentFailure,
      paymentRecoveryMs,
      paymentAbandoned: false,
      wrongStationTrapInjected: session.includeWrongStationTrap,
      wrongStationTrapFixed: stationTrapFixed,
      warningsSeen: session.includeWrongStationTrap ? ["RULE_MULTI_STATION_CITY_CONFUSION"] : [],
      warningsFixed: stationTrapFixed ? ["RULE_MULTI_STATION_CITY_CONFUSION"] : [],
    };

    const result = calculatePracticeScore(telemetry);
    PracticeStore.saveLatestResult(result);

    // Record attempt to history
    const record: PracticeAttemptRecord = {
      id: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      difficulty: session.difficulty,
      totalScore: result.totalScore,
      durationSeconds: durationMs / 1000,
      rating: result.rating,
      ratingLabel: result.ratingLabel,
    };
    PracticeStore.saveAttempt(record);

    router.push("/practice/result");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans">
      
      {/* 1. Persistent Practice Mode Banner */}
      <PracticeBanner
        difficulty={session.difficulty}
        onQuit={handleQuit}
        isPaused={isPaused}
      />

      <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col justify-start">
        
        {/* Rehearsal Header with Pause (on Easy) & Quit */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              {session.trainNumber} · {session.trainName}
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {session.classCode} · Tatkal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {diffConfig.pauseAllowed && (
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50 cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleQuit}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold p-1 cursor-pointer"
            >
              Quit
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 1: COUNTDOWN TO 10:00:00 AM                        */}
        {/* ========================================================= */}
        {phase === "COUNTDOWN" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center flex flex-col items-center gap-5 my-auto">
            
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-orange-600">
              <Clock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100/70 px-2.5 py-0.5 rounded-full border border-orange-200">
                Window Opens at 10:00:00 AM
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight mt-3">
                00:00:{(countdownRemainingMs / 1000).toFixed(1)}s
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Atomic synchronization active • Fingers on the button
              </p>
            </div>

            {/* Preparation checklist preview */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-left flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">
                  Preparation Armed (+{Object.values(session.prepChecklist).filter(Boolean).length * 5} pts)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Ready for instantaneous entry
              </span>
            </div>

            {/* Fast-Forward / Skip for testing */}
            <button
              type="button"
              onClick={() => {
                windowOpenTimestamp.current = Date.now();
                queueStartTimestamp.current = Date.now();
                setPhase("WAITING_ROOM");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
            >
              Skip countdown (jump straight to open window)
            </button>

          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: VIRTUAL WAITING ROOM (TRAFFIC REGULATION)       */}
        {/* ========================================================= */}
        {phase === "WAITING_ROOM" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center flex flex-col items-center gap-5 my-auto">
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600">
                <Users className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="animate-ping absolute top-0 right-0 h-4 w-4 rounded-full bg-orange-500 opacity-75" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                10:00 AM Rush Waiting Room
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                You're Position <span className="text-blue-600 font-mono">#{queuePosition}</span> in Line
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fairness Queue Active • Do NOT refresh the page
              </p>
            </div>

            {/* Contention notice */}
            {showContentionWarning && (
              <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Rush Alert: Only 2 seats remaining in Tatkal quota! Proceed rapidly.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleFastPassWaitingRoom}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Fast Pass: Enter Booking Form</span>
            </button>

          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: PASSENGER SELECTION & REGRET SHIELD TRAP        */}
        {/* ========================================================= */}
        {phase === "PASSENGER" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col gap-4">
            
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Step 1 of 3: Passenger Details
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Confirm Traveling Passenger
              </h2>
            </div>

            {/* Wrong Station Trap Alert (Regret Shield) */}
            {showRegretShieldAlert && !stationTrapFixed && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Regret Shield Alert: Terminal Confusion Detected</strong>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-snug">
                      Your search was for <strong>New Delhi (NDLS)</strong>, but the train starts at <strong>Hazrat Nizamuddin (NZM)</strong> (12km away).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFixStationTrap}
                  className="self-end py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                >
                  1-Tap Fix: Switch Origin to NDLS (+20 pts)
                </button>
              </div>
            )}

            {stationTrapFixed && session.includeWrongStationTrap && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Station mismatch corrected to NDLS. All good!</span>
              </div>
            )}

            <form onSubmit={handlePassengerSubmit} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Passenger Name (as on Govt ID)</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    required
                    value={passengerAge}
                    onChange={(e) => setPassengerAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={passengerGender}
                    onChange={(e) => setPassengerGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berth Pref</label>
                  <select
                    value={passengerBerth}
                    onChange={(e) => setPassengerBerth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Lower">Lower</option>
                    <option value="Middle">Middle</option>
                    <option value="Upper">Upper</option>
                    <option value="Side Lower">Side Lower</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review Journey & Captcha</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </form>

          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 4: REVIEW & ACCESSIBLE CAPTCHA                     */}
        {/* ========================================================= */}
        {phase === "REVIEW" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col gap-4">
            
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Step 2 of 3: Verification Captcha
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Human Verification Code
              </h2>
            </div>

            {/* Train details recap */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{session.trainName}</span>
                <div className="text-[11px] text-slate-500">{passengerName} ({passengerAge}, {passengerGender}) · {session.classCode}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Fare</span>
                <div className="font-mono font-black text-base text-slate-900">₹3,245</div>
              </div>
            </div>

            <form onSubmit={handleCaptchaVerify} className="space-y-4 text-xs">
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Enter Captcha Code</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePlayAudioCaptcha}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Audio Captcha"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Refresh Captcha"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Captcha Canvas Display */}
                <div className="bg-slate-900 text-white font-mono text-2xl font-black tracking-widest py-3 px-6 rounded-2xl text-center select-none shadow-inner border border-slate-800">
                  {captchaCode}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={5}
                  autoFocus
                  placeholder="Type 5-letter captcha..."
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError(false);
                  }}
                  className={`w-full uppercase font-mono tracking-widest text-center text-lg font-black bg-slate-50 border rounded-2xl py-2.5 text-slate-900 focus:outline-none transition ${
                    captchaError
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50"
                      : "border-slate-300 focus:border-blue-600 focus:bg-white"
                  }`}
                />
                {captchaError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 text-center">
                    Incorrect captcha code. Code has been refreshed! Retries lower score.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Verify & Proceed to Payment</span>
              </button>

            </form>

          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 5: PAYMENT & MULTI-GATEWAY FALLBACK                */}
        {/* ========================================================= */}
        {phase === "PAYMENT" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col gap-4">
            
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Step 3 of 3: Simulated Payment
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Complete Fast Checkout
              </h2>
            </div>

            {/* Injected Payment Failure Alert & Fallback */}
            {paymentFailedState && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-950 flex flex-col gap-2.5 animate-in shake">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-sm">Banking Gateway Timeout (Injected Failure)</strong>
                    <p className="text-[11px] text-rose-900/90 mt-0.5 leading-snug">
                      Your primary UPI bank timed out. In a real Tatkal rush, you have <strong>under 15s</strong> to switch to backup card or alternate UPI!
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="font-bold text-[11px] text-rose-800">
                    Auto-reconciliation active · Zero money lost
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CARD");
                      setBackupMethodReady(true);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Switch to Backup Card & Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === "UPI"
                    ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI Fast Collect</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === "CARD"
                    ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Backup Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("NETBANKING")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                  paymentMethod === "NETBANKING"
                    ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Total Payable Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Selected Method:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {paymentMethod === "UPI" ? "BHIM UPI (fast-collect)" : paymentMethod === "CARD" ? "HDFC Visa Ending 8920" : "SBI NetBanking"}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Payable Amount:</span>
                <div className="text-xl font-black font-mono text-[#F97316]">
                  ₹3,245
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isPaymentProcessing}
              onClick={handlePay}
              className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPaymentProcessing ? (
                <span>Simulating Gateway Authorization...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentFailedState
                      ? "AUTHORIZE WITH BACKUP METHOD (₹3,245)"
                      : "CONFIRM SIMULATED PAYMENT (₹3,245)"}
                  </span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

