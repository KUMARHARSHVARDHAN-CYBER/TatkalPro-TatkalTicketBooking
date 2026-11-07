"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Zap,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  ArrowRight,
  HelpCircle,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { PracticeBanner } from "../../../components/practice/PracticeBanner";
import { HowScoringWorksModal } from "../../../components/practice/HowScoringWorksModal";
import {
  PracticeStore,
  PracticeAttemptRecord,
} from "../../../lib/practice/practiceStore";
import {
  PracticeScoreResult,
  DIFFICULTY_CONFIGS,
} from "../../../lib/practice/scoringConfig";

export default function PracticeResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PracticeScoreResult | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const session = PracticeStore.getSession();
  const stats = PracticeStore.getStats();

  useEffect(() => {
    const saved = PracticeStore.getLatestResult();
    if (saved) {
      setResult(saved);
    } else {
      // Fallback seed result if user navigated directly
      const dummyHistory = PracticeStore.getHistory();
      if (dummyHistory.length > 0) {
        // Build readable result from dummy
        router.push("/practice");
      }
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
        <div className="text-center text-xs text-slate-500">
          <Dumbbell className="w-8 h-8 text-blue-500 animate-bounce mx-auto mb-2" />
          <p>Loading your rehearsal score...</p>
        </div>
      </div>
    );
  }

  const handleTryAgain = () => {
    router.push("/practice/run");
  };

  const handleStepUpDifficulty = () => {
    const nextDiff = session.difficulty === "EASY" ? "NORMAL" : "RUSH";
    PracticeStore.saveSession({ difficulty: nextDiff });
    router.push("/practice/run");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans">
      
      {/* 1. Persistent Practice Mode Banner */}
      <PracticeBanner difficulty={session.difficulty} />

      <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Rehearsal Debrief
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Tatkal Performance Score
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowScoringModal(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">How Scoring Works</span>
          </button>
        </div>

        {/* Hero Score Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-5 text-center sm:text-left">
            {/* Circular Score Badge */}
            <div className="relative w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center bg-slate-50 shadow-inner shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-slate-900 leading-none">
                  {result.totalScore}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">out of 100</span>
              </div>
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${result.ratingColor}`}
              >
                {result.ratingLabel}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                {result.totalScore >= 80
                  ? "Outstanding Speed & Accuracy"
                  : result.totalScore >= 60
                  ? "Solid Effort · Seconds Can Be Shaved"
                  : "Practice Required for Live Window"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rehearsed on <strong className="text-slate-700">{session.difficulty} difficulty</strong> with {session.trainName}.
              </p>
            </div>
          </div>

          {/* Quick Stat Pills */}
          <div className="w-full sm:w-auto grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400">Personal Best</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {stats.bestScore}/100
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400">Avg Last 5</span>
              <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                {stats.avgLast5}/100
              </div>
            </div>
          </div>

        </div>

        {/* 5-Phase Score Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phase-by-Phase Score Breakdown
            </h3>
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {result.totalScore}/100 Total
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.values(result.phases).map((phase, idx) => {
              const pct = Math.round((phase.earned / phase.max) * 100);
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-slate-900">{phase.name}</span>
                    <span className="font-mono text-slate-800">
                      {phase.earned} / {phase.max} pts
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all ${
                        pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{phase.details}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 3 Personalized Actionable Tips */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top 3 Personalized Rehearsal Tips
              </h3>
              <p className="text-[11px] text-slate-500">
                Concrete actions tailored to your specific run telemetry
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {result.tips.map((tip, idx) => (
              <div
                key={tip.id}
                className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-950">{tip.title}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{tip.message}</p>
                  <div className="text-[11px] font-semibold text-amber-900 flex items-center gap-1 mt-1">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Fix: {tip.actionableFix}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run Timeline Log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Simulated Run Timeline & Interventions
          </h3>
          <div className="space-y-2 text-xs">
            {result.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 py-1">
                <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0 w-16">
                  {item.timeOffset}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.status === "success"
                        ? "bg-emerald-500"
                        : item.status === "error"
                        ? "bg-rose-500"
                        : item.status === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="text-slate-700 font-medium">{item.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 py-3 -mx-4 px-4 sm:px-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-20">
          <Link
            href="/"
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition cursor-pointer"
          >
            Back to Home
          </Link>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTryAgain}
              className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            {session.difficulty !== "RUSH" && (
              <button
                type="button"
                onClick={handleStepUpDifficulty}
                className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Try {session.difficulty === "EASY" ? "Normal" : "Rush"} Difficulty</span>
              </button>
            )}
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

