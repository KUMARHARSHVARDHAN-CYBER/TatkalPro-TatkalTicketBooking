"use client";

import React from "react";
import { Trophy, TrendingUp, History, Dumbbell } from "lucide-react";
import { PracticeStore, PracticeAttemptRecord } from "../../lib/practice/practiceStore";

interface PracticeHistoryViewProps {
  onSelectDifficulty?: (diff: any) => void;
}

export const PracticeHistoryView: React.FC<PracticeHistoryViewProps> = () => {
  const history = PracticeStore.getHistory();
  const stats = PracticeStore.getStats();

  if (history.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
        <Dumbbell className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
        <h4 className="font-bold text-slate-800 text-sm">No Rehearsal History Yet</h4>
        <p className="mt-1">Complete your first Tatkal practice run to track your speed and scores.</p>
      </div>
    );
  }

  // Trend line calculation (scores of last 6 attempts in chronological order)
  const recentScores = [...history.slice(0, 7)].reverse().map((h) => h.totalScore);
  const minScore = Math.min(...recentScores, 40);
  const maxScore = Math.max(...recentScores, 100);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
      
      {/* Stats Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        
        {/* Best Score */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
              Best Score
            </div>
            <div className="text-xl font-black text-amber-900 font-mono leading-tight">
              {stats.bestScore}<span className="text-xs font-normal text-amber-600">/100</span>
            </div>
          </div>
        </div>

        {/* Avg of Last 5 */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
              Avg of Last 5
            </div>
            <div className="text-xl font-black text-blue-900 font-mono leading-tight">
              {stats.avgLast5}<span className="text-xs font-normal text-blue-600">/100</span>
            </div>
          </div>
        </div>

        {/* Total Rehearsals */}
        <div className="hidden sm:flex p-3 rounded-xl bg-slate-50 border border-slate-200 items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Runs
            </div>
            <div className="text-xl font-black text-slate-900 font-mono leading-tight">
              {stats.totalRuns}
            </div>
          </div>
        </div>

      </div>

      {/* SVG Trend Line */}
      {recentScores.length > 1 && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
            <span>Score Trend (Recent Attempts)</span>
            <span className="font-mono text-slate-700 font-bold">
              {recentScores[recentScores.length - 1]} pts latest
            </span>
          </div>
          <div className="h-12 w-full flex items-end justify-between gap-1 pt-2">
            {recentScores.map((score, idx) => {
              const heightPct = Math.max(15, Math.min(100, ((score - minScore) / (maxScore - minScore || 1)) * 85 + 15));
              const isLatest = idx === recentScores.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-mono font-bold text-slate-500">
                    {score}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-sm transition-all ${
                      isLatest
                        ? "bg-blue-600"
                        : score >= 80
                        ? "bg-emerald-400"
                        : score >= 60
                        ? "bg-amber-400"
                        : "bg-slate-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Attempts List */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Recent Rehearsals
        </div>
        <div className="divide-y divide-slate-100">
          {history.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.totalScore >= 80
                      ? "bg-emerald-500"
                      : item.totalScore >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{item.ratingLabel}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.difficulty}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.dateFormatted} • {item.durationSeconds.toFixed(1)}s
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-sm font-mono text-slate-900">
                  {item.totalScore}
                </span>
                <span className="text-[10px] text-slate-400">/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PracticeHistoryView;

