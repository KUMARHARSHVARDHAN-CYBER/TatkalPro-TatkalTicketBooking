"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Lightbulb,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { FailureAutopsyRecord } from "../../lib/safetyNet/types";
import { FailureAutopsyService } from "../../lib/safetyNet/failureAutopsy";

interface FailureAutopsyCardProps {
  autopsy: FailureAutopsyRecord;
  onRetry: () => void;
  onTryAlternative: () => void;
}

export const FailureAutopsyCard: React.FC<FailureAutopsyCardProps> = ({
  autopsy,
  onRetry,
  onTryAlternative,
}) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const history = FailureAutopsyService.getHistory();

  return (
    <div className="w-full rounded-3xl bg-white border-2 border-slate-900 shadow-xl overflow-hidden space-y-0">
      
      {/* Top Banner */}
      <div className="px-5 py-4 bg-rose-50 border-b-2 border-rose-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-rose-950 tracking-tight">
                Booking Attempt Autopsy &amp; Telemetry
              </h3>
              <span className="text-[10px] font-mono font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full border border-rose-300">
                {autopsy.failureStage}
              </span>
            </div>
            <p className="text-xs text-rose-800 font-medium">
              Train #{autopsy.trainNumber} · {autopsy.quota} Quota · {autopsy.travelClass} Class
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500">
          {autopsy.timestamp}
        </span>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-4">
        
        {/* Plain Language Root Cause */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            What Happened (Plain Language)
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-bold leading-relaxed">
            {autopsy.rootCausePlainLanguage}
          </div>
        </div>

        {/* ONE Actionable Suggestion */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-950">
            <Lightbulb className="w-4 h-4 text-amber-700 fill-amber-300" />
            <span>Actionable Suggestion For Next Attempt</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 font-bold">
            {autopsy.actionableSuggestion}
          </p>
        </div>

        {/* Telemetry Timeline Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-slate-900 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              <span>Session Telemetry Timeline ({autopsy.telemetryTimeline.length} steps logged)</span>
            </span>
            {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTimeline && (
            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono animate-in fade-in">
              {autopsy.telemetryTimeline.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={step.status === "OK" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                      {step.status === "OK" ? "✓" : "✗"}
                    </span>
                    <span className="text-slate-800">{step.stepName}</span>
                  </div>
                  <div className="text-slate-500">
                    {step.durationMs > 0 ? `${step.durationMs}ms` : "0ms"} {step.details && `(${step.details})`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Toggle */}
        {history.length > 1 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Previous Attempt History ({history.length} records)</span>
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                {history.slice(1, 5).map((rec, hIdx) => (
                  <div key={hIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Train #{rec.trainNumber} ({rec.travelClass})</span>
                      <span className="text-slate-500 text-[11px] block">{rec.failureStage}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{rec.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer CTAs */}
      <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-slate-500 font-medium">
          Zero data lost: Your passenger master list is cached and ready.
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Fast Retry</span>
          </button>

          <button
            type="button"
            onClick={onTryAlternative}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Try Split Journey / Alternate Train</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default FailureAutopsyCard;

