"use client";

import React from "react";
import { GitFork, ArrowRight, Clock, ShieldCheck, Zap } from "lucide-react";
import { SplitTicketAlternative } from "../lib/railway/types";

interface SplitTicketCardProps {
  alternative: SplitTicketAlternative;
  onSelectSplit: (alt: SplitTicketAlternative) => void;
}

export const SplitTicketCard: React.FC<SplitTicketCardProps> = ({
  alternative,
  onSelectSplit,
}) => {
  const { intermediateStation, leg1, leg2, layoverMinutes, totalDurationMinutes, totalFare, summary } =
    alternative;

  const durationHrs = Math.floor(totalDurationMinutes / 60);
  const durationMins = totalDurationMinutes % 60;
  const layoverHrs = Math.floor(layoverMinutes / 60);
  const layoverMins = layoverMinutes % 60;

  return (
    <div className="w-full bg-gradient-to-r from-[#0d1e3a] via-[#102447] to-[#0a1932] border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3.5">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">Confirmed 2-Leg Split Journey</span>
            <p className="text-[10px] text-slate-400">Via {intermediateStation.name} ({intermediateStation.code})</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-bold text-slate-300">
            Total: {durationHrs}h {durationMins}m
          </span>
          <span className="text-sm font-black text-emerald-400 font-mono">
            ₹{totalFare.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Visual Connection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-center text-xs">
        
        {/* Leg 1 */}
        <div className="bg-[#091529] p-3 rounded-xl border border-slate-700/80">
          <span className="text-[10px] text-orange-400 font-bold uppercase">Leg 1 • Train #{leg1.trainNumber}</span>
          <p className="font-bold text-white truncate">{leg1.trainName}</p>
          <div className="flex justify-between text-slate-300 font-mono text-[11px] mt-1">
            <span>{leg1.fromCode} ({leg1.departureTime})</span>
            <span>➔</span>
            <span>{leg1.toCode} ({leg1.arrivalTime})</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
            ✓ {leg1.availableSeats} Confirmed Seats Available
          </span>
        </div>

        {/* Layover */}
        <div className="flex flex-col items-center justify-center p-2 text-center bg-blue-950/40 rounded-xl border border-blue-500/20">
          <Clock className="w-4 h-4 text-blue-400 mb-0.5" />
          <span className="font-mono font-bold text-white text-xs">
            {layoverHrs > 0 ? `${layoverHrs}h ` : ""}{layoverMins}m Layover
          </span>
          <span className="text-[10px] text-slate-400">Platform Transfer at {intermediateStation.code}</span>
        </div>

        {/* Leg 2 */}
        <div className="bg-[#091529] p-3 rounded-xl border border-slate-700/80">
          <span className="text-[10px] text-orange-400 font-bold uppercase">Leg 2 • Train #{leg2.trainNumber}</span>
          <p className="font-bold text-white truncate">{leg2.trainName}</p>
          <div className="flex justify-between text-slate-300 font-mono text-[11px] mt-1">
            <span>{leg2.fromCode} ({leg2.departureTime})</span>
            <span>➔</span>
            <span>{leg2.toCode} ({leg2.arrivalTime})</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 mt-1 block">
            ✓ {leg2.availableSeats} Confirmed Seats Available
          </span>
        </div>

      </div>

      {/* Rationale & Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#071224] p-3 rounded-xl border border-slate-800 text-xs">
        <p className="text-slate-300 text-[11px] flex-1">
          💡 <strong>Why Split-Ticket?</strong> Direct Tatkal is waitlisted, but intermediate quotas have guaranteed confirmed berths with zero overlap.
        </p>

        <button
          onClick={() => onSelectSplit(alternative)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 shrink-0"
        >
          Book Confirmed Split Journey
        </button>
      </div>

    </div>
  );
};

export default SplitTicketCard;

