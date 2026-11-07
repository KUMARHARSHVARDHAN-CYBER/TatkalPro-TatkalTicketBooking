"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  X,
  Zap,
  HelpCircle,
} from "lucide-react";
import { RegretShieldIssue, RuleSeverity } from "../../lib/safetyNet/types";

interface RegretShieldSheetProps {
  isOpen: boolean;
  issues: RegretShieldIssue[];
  onApplyFix: (issue: RegretShieldIssue) => void;
  onProceedAnyway: () => void;
  onClose: () => void;
}

export const RegretShieldSheet: React.FC<RegretShieldSheetProps> = ({
  isOpen,
  issues,
  onApplyFix,
  onProceedAnyway,
  onClose,
}) => {
  if (!isOpen || issues.length === 0) return null;

  const hasCriticalOrHigh = issues.some(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );

  const getSeverityBadge = (sev: RuleSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-amber-100 text-amber-900 border-amber-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet / Modal Container */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl border-2 border-slate-900 shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b-2 border-slate-800 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950 tracking-tight">
                  Regret Shield: 10-Second Safety Check
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  {issues.length} {issues.length === 1 ? "Issue" : "Issues"}
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                Preventing costly, non-refundable Tatkal booking mistakes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-amber-100 text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Issues List */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh]">
          {issues.map((issue, idx) => (
            <div
              key={`${issue.ruleId}_${idx}`}
              className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-800 transition shadow-xs flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${getSeverityBadge(
                      issue.severity
                    )}`}
                  >
                    {issue.severity}
                  </span>
                  <h4 className="text-sm font-black text-slate-950">
                    {issue.title}
                  </h4>
                </div>
              </div>

              {/* What is wrong */}
              <div className="text-xs text-slate-800 font-semibold leading-relaxed">
                <strong className="text-slate-950">What&apos;s wrong: </strong>
                {issue.whatIsWrong}
              </div>

              {/* Why it matters */}
              <div className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Why it matters: </strong>
                  {issue.whyItMatters}
                </span>
              </div>

              {/* One-Tap Fix Button */}
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onApplyFix(issue)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>1-Tap Fix: {issue.oneTapFixLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            Indian Railways rules prevail · Zero non-refundable surprises
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Modify Details
            </button>

            <button
              type="button"
              onClick={onProceedAnyway}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                hasCriticalOrHigh
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-blue-700 hover:bg-blue-800 text-white"
              }`}
            >
              <span>{hasCriticalOrHigh ? "I Understand & Proceed" : "Ignore & Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegretShieldSheet;

