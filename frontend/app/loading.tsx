import React from "react";
import { Train } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#071224] text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0c1a30] border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/10 animate-bounce">
          <Train className="w-8 h-8" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-bold text-white tracking-wide">
            Connecting to Tatkal Railway GDS...
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Synchronizing live atomic seat inventory
          </span>
        </div>
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-400 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

