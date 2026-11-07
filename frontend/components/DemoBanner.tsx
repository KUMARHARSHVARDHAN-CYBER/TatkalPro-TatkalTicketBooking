"use client";

import React, { useState } from "react";
import { Info, Zap, X } from "lucide-react";

interface DemoBannerProps {
  lowBandwidth: boolean;
  onToggleLowBandwidth: () => void;
  lang: "en" | "hi" | "hinglish";
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  lowBandwidth,
  onToggleLowBandwidth,
  lang,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-3 py-1.5 shadow-2xs z-50">
      <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
        
        {/* Banner text with small badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-700" />
            Demo / Simulated Data
          </span>
          <span className="font-medium text-amber-900 text-[11px] sm:text-xs">
            {lang === "hi"
              ? "सिमुलेशन मोड: कोई वास्तविक टिकट बुक नहीं होता और न ही पैसे कटते हैं।"
              : lang === "hinglish"
              ? "Realistic simulation mode. Real money is not charged."
              : "Realistic Tatkal engine simulation behind an adapter contract. Not affiliated with IRCTC/CRIS."}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Low Bandwidth Mode Toggle */}
          <button
            type="button"
            onClick={onToggleLowBandwidth}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border cursor-pointer ${
              lowBandwidth
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-white hover:bg-amber-100 text-amber-800 border-amber-200"
            }`}
            title="Strips heavy assets for 10:00 AM rush"
          >
            <Zap className="w-2.5 h-2.5 text-amber-600" />
            <span>Low-Bandwidth Mode: {lowBandwidth ? "ON" : "OFF"}</span>
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-900 p-0.5 rounded hover:bg-amber-100 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DemoBanner;
