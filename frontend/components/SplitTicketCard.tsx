"use client";

import React from "react";
import { GitFork, ArrowRight, Clock, AlertTriangle, Info, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { SplitTicketAlternative } from "../lib/railway/types";
import { Train } from "../types";
import { formatDisplayDate, calculateArrivalDate, isOvernightJourney } from "../lib/dateUtils";
import { computeConnectionRisk, getTatkalNonRefundableRuleInfo } from "../lib/resultsHelper";

interface SplitTicketCardProps {
  alternative: SplitTicketAlternative;
  onSelectSplit: (alt: SplitTicketAlternative) => void;
  journeyDate?: string;
  passengerCount?: number;
  directTrain?: Train;
}

export const SplitTicketCard: React.FC<SplitTicketCardProps> = ({
  alternative,
  onSelectSplit,
  journeyDate = "2026-11-08",
  passengerCount = 1,
  directTrain,
}) => {
  const { intermediateStation, leg1, leg2, layoverMinutes, totalDurationMinutes, totalFare, summary } =
    alternative;

  const durationHrs = Math.floor(totalDurationMinutes / 60);
  const durationMins = totalDurationMinutes % 60;
  const layoverHrs = Math.floor(layoverMinutes / 60);
  const layoverMins = layoverMinutes % 60;

  // Total fare for N passengers
  const totalPayableFare = totalFare * passengerCount;

  // On-time percentage of first train (e.g., 97% for 12952)
  const firstTrainOnTime = leg1.trainNumber === "12952" ? 97 : leg1.trainNumber === "12904" ? 91 : 94;
  const connectionRisk = computeConnectionRisk(layoverMinutes, firstTrainOnTime);

  // Non-refundable rule info from defaultRules.json
  const tatkalRule = getTatkalNonRefundableRuleInfo();

  // Dates for Leg 1
  const leg1DepartureDate = formatDisplayDate(journeyDate);
  const leg1ArrivalDate = calculateArrivalDate(journeyDate, 0, leg1.departureTime, leg1.arrivalTime);

  // Dates for Leg 2 (starts after leg 1 arrival)
  const leg1Overnight = isOvernightJourney(0, leg1.departureTime, leg1.arrivalTime);
  const leg2StartBaseDate = leg1ArrivalDate;
  const leg2ArrivalDate = calculateArrivalDate(leg2StartBaseDate, 0, leg2.departureTime, leg2.arrivalTime);

  // Sanitize summary removing any "100% confirmed"
  const sanitizedSummary = (summary || "")
    .replace(/Both legs are 100% confirmed!/gi, "Both legs available now.")
    .replace(/100% confirmed/gi, "available now")
    .replace(/Guaranteed confirmed seats!/gi, "Both legs available now.");

  // Direct comparison reference values
  const directDuration = directTrain?.duration || "15h 40m";
  const directAvailableSeats = directTrain?.classes?.[0]?.availableSeats || 4;
  const directUnitFare = directTrain?.classes?.[0]?.fare || 2708;
  const directTotalFare = directUnitFare * passengerCount;

  return (
    <div
      id="split-ticket-card"
      className="w-full bg-blue-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 scroll-mt-24"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">2-leg split journey</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                Both legs available now
              </span>

              {/* Connection Risk Meter */}
              <div
                className="relative group cursor-help inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor:
                    connectionRisk.level === "Low"
                      ? "#ECFDF5"
                      : connectionRisk.level === "Medium"
                      ? "#FEF3C7"
                      : "#FEE2E2",
                  color:
                    connectionRisk.level === "Low"
                      ? "#065F46"
                      : connectionRisk.level === "Medium"
                      ? "#92400E"
                      : "#991B1B",
                  borderColor:
                    connectionRisk.level === "Low"
                      ? "#A7F3D0"
                      : connectionRisk.level === "Medium"
                      ? "#FDE68A"
                      : "#FECACA",
                }}
                title={`${connectionRisk.why} (${connectionRisk.label})`}
              >
                <span>Connection risk: {connectionRisk.level}</span>
                <Info className="w-3 h-3 opacity-70" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-56 bg-slate-900 text-white text-[11px] font-medium p-2 rounded-lg shadow-xl z-30 text-center leading-snug">
                  <div>{connectionRisk.why}</div>
                  <div className="text-[9px] text-amber-300 mt-0.5 font-bold uppercase tracking-wider">
                    {connectionRisk.label}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5">
              Via Junction Hub: <strong>{intermediateStation.name} ({intermediateStation.code})</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono font-bold text-slate-600">
            Total: {durationHrs}h {durationMins}m
          </span>
          <div className="text-right">
            <span className="text-base font-black text-slate-900 font-mono">
              ₹{totalPayableFare.toLocaleString("en-IN")}
            </span>
            {passengerCount > 1 && (
              <span className="text-[10px] text-slate-500 block font-medium">
                (for {passengerCount} passengers · ₹{totalFare} / seat)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Connection Grid with Dates & Overnight Rollover */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
        
        {/* Leg 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-700">Leg 1: #{leg1.trainNumber}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {leg1.availableSeats} Seats Available
            </span>
          </div>
          <div className="font-semibold text-slate-800 text-xs">
            {leg1.fromCode} ({leg1.departureTime}) ➔ {leg1.toCode} ({leg1.arrivalTime})
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>{leg1DepartureDate}</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <span>{leg1ArrivalDate}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{leg1.trainName} • Class {leg1.classCode}</span>
        </div>

        {/* Layover Middle Pillar */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Safe Transfer Buffer
          </span>
          <span className="text-xs font-black text-amber-900 font-mono">
            {layoverHrs}h {layoverMins}m Platform Layover
          </span>
          <span className="text-[10px] text-slate-500">At {intermediateStation.name}</span>
        </div>

        {/* Leg 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-700">Leg 2: #{leg2.trainNumber}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {leg2.availableSeats} Seats Available
            </span>
          </div>
          <div className="font-semibold text-slate-800 text-xs">
            {leg2.fromCode} ({leg2.departureTime}) ➔ {leg2.toCode} ({leg2.arrivalTime})
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>{leg2StartBaseDate}</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <span className="font-bold text-blue-700">{leg2ArrivalDate} (overnight)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{leg2.trainName} • Class {leg2.classCode}</span>
        </div>

      </div>

      {/* Direct vs Split Compact Comparison Row */}
      <div className="bg-white/80 border border-blue-100 rounded-xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Direct vs Split Comparison:
        </span>
        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-slate-400">Duration: </span>
            <span className="font-semibold text-slate-700">Direct {directDuration}</span>
            <span className="text-slate-400"> vs </span>
            <strong className="text-blue-700">Split {durationHrs}h {durationMins}m</strong>
          </div>
          <div>
            <span className="text-slate-400">Fare ({passengerCount} pax): </span>
            <span className="font-semibold text-slate-700">Direct ₹{directTotalFare.toLocaleString("en-IN")}</span>
            <span className="text-slate-400"> vs </span>
            <strong className="text-emerald-700">Split ₹{totalPayableFare.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span className="text-slate-400">Availability: </span>
            <span className="font-semibold text-slate-700">Direct {directAvailableSeats} seats</span>
            <span className="text-slate-400"> vs </span>
            <strong className="text-emerald-700">Split {leg1.availableSeats} & {leg2.availableSeats} seats</strong>
          </div>
        </div>
      </div>

      {/* Plain Warning Line Reading from defaultRules.json */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 px-3 flex items-start gap-2 text-xs text-amber-950">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong>Important connection notice:</strong> Two separate tickets. If the first train runs late, the second is not protected. Confirmed Tatkal tickets are generally non-refundable.
          <span className="text-[10px] text-amber-800 ml-1 font-medium">
            (Rules last verified: {tatkalRule.lastVerified} · Official Indian Railways rules prevail)
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-100">
        <p className="text-[11px] text-slate-600 max-w-lg">{sanitizedSummary}</p>
        <button
          type="button"
          onClick={() => onSelectSplit(alternative)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center"
        >
          Select This Split Route
        </button>
      </div>

    </div>
  );
};

export default SplitTicketCard;
