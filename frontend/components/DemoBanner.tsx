"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Zap, X, Info } from "lucide-react";

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
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs px-3 py-1.5 shadow-md flex items-center justify-between z-50 sticky top-0">
      <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2 px-1">
        
        {/* Banner text */}
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-black/30 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-200" />
            Simulated Sandbox
          </span>
          <span className="font-medium text-amber-50 text-[11px] sm:text-xs">
            {lang === "hi"
              ? "डेमो मोड: यह एक सिमुलेशन है। कोई वास्तविक टिकट बुक नहीं होता और न ही पैसे कटते हैं।"
              : lang === "hinglish"
              ? "Demo Mode: Realistic simulation. Koi real paisa nahi kat-ta."
              : "Demo Railway Environment: Realistic Tatkal simulation. Not affiliated with IRCTC/CRIS."}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Low Bandwidth Mode Toggle */}
          <button
            onClick={onToggleLowBandwidth}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
              lowBandwidth
                ? "bg-emerald-900 text-emerald-200 border border-emerald-400"
                : "bg-black/30 hover:bg-black/50 text-white"
            }`}
            title="Strips heavy imagery for 10:00 AM rush"
          >
            <Zap className="w-2.5 h-2.5 text-yellow-300" />
            <span>Low-Bandwidth Mode: {lowBandwidth ? "ON" : "OFF"}</span>
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white p-0.5 rounded hover:bg-black/20"
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

