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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>AI Waitlist Confirmation Predictor</span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] border ${
            isHigh
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isMedium
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {probability}% {isHigh ? "High Chance" : isMedium ? "Medium Chance" : "Low Chance"}
        </span>
      </div>

      <p className="text-slate-600 text-xs leading-relaxed">
        {rationale}
      </p>

      {/* Cancellation Watch Notification Button */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="text-[11px] text-slate-500">
          WL rechecked on chart preparation & quota reallocation
        </span>
        <button
          type="button"
          onClick={() => setAlertSet(!alertSet)}
          className={`px-3 py-1 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer border ${
            alertSet
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
          }`}
        >
          {alertSet ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Watch Active</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Set Cancellation Watch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WaitlistPredictorCard;
