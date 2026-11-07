"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Zap,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PracticeBanner } from "../../components/practice/PracticeBanner";
import { HowScoringWorksModal } from "../../components/practice/HowScoringWorksModal";
import { PracticeHistoryView } from "../../components/practice/PracticeHistoryView";
import {
  PracticeDifficulty,
  CountdownDuration,
  DIFFICULTY_CONFIGS,
} from "../../lib/practice/scoringConfig";
import { PracticeStore, PracticeSessionState } from "../../lib/practice/practiceStore";

// Mock train options for scenario selection
const SAMPLE_TRAINS = [
  {
    number: "12952",
    name: "Mumbai Rajdhani Express",
    route: "NDLS ➔ MMCT",
    classCode: "3A",
    quota: "TATKAL",
    from: { code: "NDLS", name: "New Delhi" },
    to: { code: "MMCT", name: "Mumbai Central" },
  },
  {
    number: "12002",
    name: "New Delhi Bhopal Shatabdi",
    route: "NDLS ➔ BPL",
    classCode: "CC",
    quota: "TATKAL",
    from: { code: "NDLS", name: "New Delhi" },
    to: { code: "BPL", name: "Bhopal Junction" },
  },
  {
    number: "12301",
    name: "Howrah Rajdhani Express",
    route: "HWH ➔ NDLS",
    classCode: "2A",
    quota: "TATKAL",
    from: { code: "HWH", name: "Howrah Junction" },
    to: { code: "NDLS", name: "New Delhi" },
  },
];

export default function PracticeSetupPage() {
  const router = useRouter();
  const [session, setSession] = useState<PracticeSessionState>(() => PracticeStore.getSession());
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  // Checklist toggle
  const togglePrepItem = (key: keyof PracticeSessionState["prepChecklist"]) => {
    const updated = {
      ...session.prepChecklist,
      [key]: !session.prepChecklist[key],
    };
    const newSession = { ...session, prepChecklist: updated };
    setSession(newSession);
    PracticeStore.saveSession(newSession);
  };

  const handleLaunch = () => {
    PracticeStore.saveSession(session);
    router.push("/practice/run");
  };

  const handleQuickLaunch = () => {
    const defaultState = PracticeStore.getDefaultSession();
    PracticeStore.saveSession(defaultState);
    router.push("/practice/run");
  };

  const prepCount = Object.values(session.prepChecklist).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans">
      
      {/* 1. Practice Mode Banner */}
      <PracticeBanner difficulty={session.difficulty} />

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {lang === "en" ? "Rehearsal Mode" : "अभ्यास मोड"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  Zero Risk · No Real PNR
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {lang === "en" ? "Tatkal Rehearsal Setup" : "तत्काल अभ्यास सेटअप"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScoringModal(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How Scoring Works</span>
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              {lang === "en" ? "हिन्दी" : "English"}
            </button>
          </div>
        </div>

        {/* 1-Tap Quick Start Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-100 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{lang === "en" ? "Fast-Track Training" : "त्वरित प्रशिक्षण"}</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg mt-0.5">
              {lang === "en" ? "1-Tap Quick Rehearsal" : "1-टैप त्वरित अभ्यास"}
            </h3>
            <p className="text-xs text-blue-100/90 mt-0.5">
              {lang === "en"
                ? "Start immediately with Normal rush (10s countdown, pre-armed master passenger)."
                : "सामान्य भीड़ के साथ तुरंत शुरू करें (10s उलटी गिनती, प्री-आर्म्ड यात्री)।"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuickLaunch}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{lang === "en" ? "Launch Practice (1-Tap)" : "अभ्यास शुरू करें"}</span>
          </button>
        </div>

        {/* Configuration Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Difficulty Level */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === "en" ? "1. Select Difficulty" : "1. कठिनाई चुनें"}
                </label>
                <span className="text-[11px] font-bold text-blue-600 font-mono">
                  Target: {DIFFICULTY_CONFIGS[session.difficulty].targetSeconds}s
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["EASY", "NORMAL", "RUSH"] as PracticeDifficulty[]).map((diff) => {
                  const cfg = DIFFICULTY_CONFIGS[diff];
                  const isSel = session.difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        const updated = { ...session, difficulty: diff };
                        setSession(updated);
                        PracticeStore.saveSession(updated);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSel
                          ? "bg-blue-50/90 border-[#2563EB] ring-2 ring-blue-200 shadow-2xs"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900">
                        {lang === "en" ? cfg.name : cfg.nameHindi}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Queue #{cfg.queueLength}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                {DIFFICULTY_CONFIGS[session.difficulty].description}
              </p>
            </div>
          </div>

          {/* Card 2: Countdown Length */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === "en" ? "2. Countdown to 10:00 AM" : "2. 10:00 AM तक उलटी गिनती"}
                </label>
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([10, 30, 60] as CountdownDuration[]).map((sec) => {
                  const isSel = session.countdownSeconds === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        const updated = { ...session, countdownSeconds: sec };
                        setSession(updated);
                        PracticeStore.saveSession(updated);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSel
                          ? "bg-blue-50/90 border-[#2563EB] ring-2 ring-blue-200 font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="text-sm font-black text-slate-900">{sec}s</div>
                      <div className="text-[10px] text-slate-500">
                        {sec === 10 ? "Fast" : sec === 30 ? "Standard" : "Realistic"}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Simulates real-time server atomic synchronization. 10s is recommended for fast iterative rehearsals.
              </p>
            </div>
          </div>

        </div>

        {/* Card 3: Scenario & Injected Challenge Toggles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {lang === "en" ? "3. Train Scenario & Passenger" : "3. ट्रेन और यात्री परिदृश्य"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_TRAINS.map((tr) => {
                const isSel = session.trainNumber === tr.number;
                return (
                  <button
                    key={tr.number}
                    type="button"
                    onClick={() => {
                      const updated: PracticeSessionState = {
                        ...session,
                        trainNumber: tr.number,
                        trainName: tr.name,
                        classCode: tr.classCode,
                        fromStation: tr.from,
                        toStation: tr.to,
                      };
                      setSession(updated);
                      PracticeStore.saveSession(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? "bg-blue-50/80 border-[#2563EB] ring-2 ring-blue-200"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-900">{tr.number}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200">
                        {tr.classCode}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">{tr.name}</div>
                    <div className="text-[10px] text-slate-500">{tr.route}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Injected Chaos Toggles */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              {lang === "en" ? "Practice Drills (Optional Chaos Injections):" : "अभ्यास चुनौतियां (वैकल्पिक):"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Payment Failure Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={session.includePaymentFailure}
                  onChange={(e) => {
                    const updated = { ...session, includePaymentFailure: e.target.checked };
                    setSession(updated);
                    PracticeStore.saveSession(updated);
                  }}
                  className="mt-0.5 w-4 h-4 accent-orange-600 rounded"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>Include Payment Failure</span>
                    <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1 rounded">Drill</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Simulates banking timeout to practice multi-gateway fallback under 8s.
                  </p>
                </div>
              </label>

              {/* Wrong Station Trap Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={session.includeWrongStationTrap}
                  onChange={(e) => {
                    const updated = { ...session, includeWrongStationTrap: e.target.checked };
                    setSession(updated);
                    PracticeStore.saveSession(updated);
                  }}
                  className="mt-0.5 w-4 h-4 accent-orange-600 rounded"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>Include Wrong-Station Trap</span>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded">Regret Shield</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tests your awareness of same-city terminal confusion (NZM vs NDLS).
                  </p>
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* Card 4: Preparation Phase Checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? "4. Pre-Window Preparation Phase" : "4. विंडो पूर्व तैयारी चरण"}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {prepCount}/4 Armed (+{prepCount * 5} pts)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every prerequisite armed before 10:00:00 earns +5 Preparation points in your final score.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const allArmed = {
                  masterPaxLoaded: true,
                  paymentPreArmed: true,
                  stationCodeChecked: true,
                  networkPingOk: true,
                };
                const updated = { ...session, prepChecklist: allArmed };
                setSession(updated);
                PracticeStore.saveSession(updated);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
            >
              Arm All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            
            <button
              type="button"
              onClick={() => togglePrepItem("masterPaxLoaded")}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                session.prepChecklist.masterPaxLoaded
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    session.prepChecklist.masterPaxLoaded ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
                <span className="font-semibold">Master Passenger Pre-Loaded</span>
              </div>
              <span className="font-mono text-[10px] font-bold">+5 pts</span>
            </button>

            <button
              type="button"
              onClick={() => togglePrepItem("paymentPreArmed")}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                session.prepChecklist.paymentPreArmed
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    session.prepChecklist.paymentPreArmed ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
                <span className="font-semibold">UPI Fast Collect Pre-Armed</span>
              </div>
              <span className="font-mono text-[10px] font-bold">+5 pts</span>
            </button>

            <button
              type="button"
              onClick={() => togglePrepItem("stationCodeChecked")}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                session.prepChecklist.stationCodeChecked
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    session.prepChecklist.stationCodeChecked ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
                <span className="font-semibold">Station Codes Verified</span>
              </div>
              <span className="font-mono text-[10px] font-bold">+5 pts</span>
            </button>

            <button
              type="button"
              onClick={() => togglePrepItem("networkPingOk")}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                session.prepChecklist.networkPingOk
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    session.prepChecklist.networkPingOk ? "text-emerald-600" : "text-slate-300"
                  }`}
                />
                <span className="font-semibold">Network Ping Tested (&lt;50ms)</span>
              </div>
              <span className="font-mono text-[10px] font-bold">+5 pts</span>
            </button>

          </div>
        </div>

        {/* Card 5: Past Rehearsal History & Stats */}
        <PracticeHistoryView />

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3 -mx-4 px-4 sm:px-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-20">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Selected: </span>
            <strong className="text-slate-800">
              {session.trainNumber} · {session.classCode} · {session.difficulty} ({session.countdownSeconds}s)
            </strong>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <Link
              href="/"
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition cursor-pointer"
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={handleLaunch}
              className="flex-1 sm:flex-none py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Tatkal Rehearsal</span>
            </button>
          </div>
        </div>

      </div>

      {/* How Scoring Works Modal */}
      <HowScoringWorksModal
        isOpen={showScoringModal}
        onClose={() => setShowScoringModal(false)}
      />

    </div>
  );
}

