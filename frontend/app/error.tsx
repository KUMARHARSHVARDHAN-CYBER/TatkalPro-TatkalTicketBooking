"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TatkalPro Application Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#071224] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-[#0c1a30] border border-amber-500/40 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
            Recoverable Railway Engine Error
          </span>
          <h2 className="text-xl font-black text-white mt-2">Something went wrong</h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {error.message || "An unexpected error occurred while rendering the railway portal."}
          </p>
        </div>

        <div className="w-full flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

