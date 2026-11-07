"use client";

import React from "react";
import { ShieldCheck, Dumbbell, X } from "lucide-react";
import { PracticeDifficulty } from "../../lib/practice/scoringConfig";

interface PracticeBannerProps {
  difficulty?: PracticeDifficulty;
  onQuit?: () => void;
  isPaused?: boolean;
}

export const PracticeBanner: React.FC<PracticeBannerProps> = ({
  difficulty = "NORMAL",
  onQuit,
  isPaused = false,
}) => {
  return (
    <aside
      aria-label="Practice Mode Notice"
      className="sticky top-0 z-40 w-full bg-[#EBF3FE] border-b border-[#BFDBFE] px-3 sm:px-4 py-2 text-[#1E40AF] shadow-2xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
            <Dumbbell className="w-3 h-3" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-extrabold uppercase tracking-wide text-[11px] sm:text-xs">
              PRACTICE MODE · Nothing is booked
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#2563EB]/80 font-medium">
              Training simulator · Rehearse safely
            </span>
            {isPaused && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                PAUSED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/70 border border-[#BFDBFE] text-[#1E40AF]">
            {difficulty} DIFFICULTY
          </span>
          {onQuit && (
            <button
              type="button"
              onClick={onQuit}
              className="text-[11px] font-bold text-[#1E40AF] hover:text-[#1E3A8A] hover:bg-blue-100/60 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Discard rehearsal and return to practice setup"
            >
              <X className="w-3.5 h-3.5" />
              <span>Quit practice</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default PracticeBanner;

