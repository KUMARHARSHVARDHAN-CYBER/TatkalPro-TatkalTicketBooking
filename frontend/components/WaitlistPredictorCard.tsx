"use client";

import React, { useState } from "react";
import { TrendingUp, Bell, CheckCircle2, AlertCircle } from "lucide-react";

interface WaitlistPredictorCardProps {
  trainNumber: string;
  classCode: string;
  currentWL: number;
  probability: number; // 0-100
  rationale: string;
}

export const WaitlistPredictorCard: React.FC<WaitlistPredictorCardProps> = ({
  trainNumber,
  classCode,
  currentWL,
  probability,
  rationale,
}) => {
  const [alertSet, setAlertSet] = useState(false);

  const isHigh = probability >= 75;
  const isMedium = probability >= 40 && probability < 75;

  return (
    <div className="bg-[#09172e] border border-blue-500/30 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          <span>AI Waitlist Confirmation Predictor</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] border ${
            isHigh
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : isMedium
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
          }`}
        >
          {probability}% {isHigh ? "High Chance" : isMedium ? "Medium Chance" : "Low Chance"}
        </span>
      </div>

      <p className="text-slate-300 text-[11px] leading-relaxed">
        {rationale}
      </p>

      {/* Cancellation Watch Notification Button */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-0.5">
        <span className="text-[10px] text-slate-400">
          Current status: <strong className="text-amber-400 font-mono">WL {currentWL}</strong>
        </span>

        <button
          type="button"
          onClick={() => setAlertSet(!alertSet)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
            alertSet
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
        >
          <Bell className="w-3 h-3" />
          <span>{alertSet ? "Alert Active ✓" : "Watch for Cancellations"}</span>
        </button>
      </div>
    </div>
  );
};

export default WaitlistPredictorCard;

