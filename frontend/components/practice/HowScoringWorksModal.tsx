"use client";

import React from "react";
import { X, CheckCircle2, Zap, Lock, CreditCard, AlertTriangle, HelpCircle } from "lucide-react";
import { SCORING_WEIGHTS } from "../../lib/practice/scoringConfig";

interface HowScoringWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowScoringWorksModal: React.FC<HowScoringWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="How Practice Scoring Works"
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">How Scoring Works</h3>
              <p className="text-xs text-slate-500">
                100 points maximum · Transparent & deterministic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Scoring Phases */}
        <div className="space-y-3.5 text-xs">
          
          {/* 1. Preparation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Preparation & Pre-Arming</span>
                <span className="font-mono font-bold text-emerald-700">+{SCORING_WEIGHTS.PREPARATION_MAX} pts</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Earn 5 pts for each checklist item completed before the window countdown hits 10:00:00 AM (Master list, Payment pre-armed, Station checked, Ping OK).
              </p>
            </div>
          </div>

          {/* 2. Speed */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Speed After Open</span>
                <span className="font-mono font-bold text-blue-700">+{SCORING_WEIGHTS.SPEED_MAX} pts</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Measures total elapsed time from 10:00:00 window open to payment submit. Full points awarded if under target (Easy: ≤40s, Normal: ≤25s, Rush: ≤15s).
              </p>
            </div>
          </div>

          {/* 3. Captcha */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Captcha Accuracy</span>
                <span className="font-mono font-bold text-amber-700">+{SCORING_WEIGHTS.CAPTCHA_MAX} pts</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                15 pts for 1st-try success. Each captcha retry or error deducts 5 points (2 attempts = 10 pts, 3 attempts = 5 pts, 4+ = 0 pts).
              </p>
            </div>
          </div>

          {/* 4. Payment */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">4. Payment & Fallback Recovery</span>
                <span className="font-mono font-bold text-purple-700">+{SCORING_WEIGHTS.PAYMENT_MAX} pts</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Smooth 1-tap checkout earns full 20 pts. When an intentional bank failure is injected, recovering by switching to backup method within 8s earns full points.
              </p>
            </div>
          </div>

          {/* 5. Mistake Avoidance */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">5. Mistake Avoidance (Regret Shield)</span>
                <span className="font-mono font-bold text-rose-700">+{SCORING_WEIGHTS.MISTAKE_AVOIDANCE_MAX} pts</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Detecting and fixing wrong-station traps (e.g. NDLS vs NZM) earns 20 pts. Ignoring a warning incurs a 15-point penalty.
              </p>
            </div>
          </div>

        </div>

        {/* Rating Tiers */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Rating Tiers
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="font-black text-emerald-800 text-sm">80 - 100</div>
              <div className="font-bold text-emerald-700 text-[11px] mt-0.5">Tatkal Ready</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="font-black text-amber-800 text-sm">60 - 79</div>
              <div className="font-bold text-amber-700 text-[11px] mt-0.5">Almost There</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <div className="font-black text-rose-800 text-sm">&lt; 60</div>
              <div className="font-bold text-rose-700 text-[11px] mt-0.5">Needs Practice</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
        >
          Got it
        </button>

      </div>
    </div>
  );
};

export default HowScoringWorksModal;

