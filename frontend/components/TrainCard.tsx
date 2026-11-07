"use client";

import React, { useState } from "react";
import {
  Train as TrainIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  Sparkles,
  Info,
} from "lucide-react";
import { Train, ClassAvailability, QuotaType } from "../types";
import { AvailabilityChip } from "./ui/Chips";
import { Button } from "./ui/Button";
import { formatDisplayDate, calculateArrivalDate } from "../lib/dateUtils";
import { SmartPickBadge } from "../lib/resultsHelper";

interface TrainCardProps {
  train: Train;
  quota: QuotaType;
  journeyDate?: string;
  passengerCount?: number;
  badges?: SmartPickBadge[];
  isSelected?: boolean;
  onBookNow: (train: Train, selectedClass: ClassAvailability) => void;
  onSelectClass?: (train: Train, selectedClass: ClassAvailability) => void;
}

// User specified strict serial order: SL, 3A, 2A, First Class (1A)
const CLASS_SERIAL_ORDER: Record<string, number> = {
  SL: 1,
  "3A": 2,
  "2A": 3,
  "1A": 4,
  CC: 5,
  EC: 6,
  "2S": 7,
};

export const TrainCard: React.FC<TrainCardProps> = ({
  train,
  quota,
  journeyDate,
  passengerCount = 1,
  badges = [],
  isSelected: externalIsSelected,
  onBookNow,
  onSelectClass,
}) => {
  const [showFareBreakdown, setShowFareBreakdown] = useState<boolean>(false);
  const sortedClasses = [...train.classes].sort(
    (a, b) => (CLASS_SERIAL_ORDER[a.classCode] || 99) - (CLASS_SERIAL_ORDER[b.classCode] || 99)
  );

  const safeDefaultClass: ClassAvailability = {
    classCode: "SL",
    className: "Sleeper Class",
    fare: 540,
    status: "AVAILABLE",
    statusText: "AVAILABLE - 24",
    availableSeats: 24,
    updatedAt: "Just now",
  };

  const [selectedClassCode, setSelectedClassCode] = useState<string>(
    sortedClasses[0]?.classCode || "SL"
  );
  const [internalSelected, setInternalSelected] = useState<boolean>(false);

  const selectedClass =
    sortedClasses.find((c) => c.classCode === selectedClassCode) ||
    sortedClasses[0] ||
    safeDefaultClass;

  const isCardActive = externalIsSelected || internalSelected;

  // Type Badge Info
  const getTypeBadge = (type: Train["type"]) => {
    switch (type) {
      case "VANDE_BHARAT":
        return { label: "Vande Bharat", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "RAJDHANI":
        return { label: "Rajdhani Express", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case "TEJAS":
        return { label: "Tejas Express", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "SHATABDI":
        return { label: "Shatabdi Express", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "PASSENGER":
        return { label: "Passenger Train", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "EXPRESS":
        return { label: "Mail / Express", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      default:
        return { label: "Superfast", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
  };

  const badgeInfo = getTypeBadge(train.type);

  return (
    <div
      className="rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow transition-all duration-200 p-5 sm:p-6 flex flex-col gap-4 select-none"
    >
      {/* Top Header: Train Name, Number & Specimen Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] font-bold">
            <TrainIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {train.name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {train.number}
              </span>

              {/* Smart-Pick Badges (Text + Icon + Rule Tooltip) */}
              {badges && badges.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {badges.map((b) => (
                    <div
                      key={b.type}
                      title={b.ruleTooltip}
                      className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs cursor-help ${
                        b.type === "FASTEST"
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : b.type === "CHEAPEST"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : "bg-blue-50 text-blue-900 border-blue-300"
                      }`}
                    >
                      {b.type === "FASTEST" && <Zap className="w-3 h-3 text-amber-600" />}
                      {b.type === "CHEAPEST" && <Tag className="w-3 h-3 text-emerald-600" />}
                      {b.type === "BEST_CHANCE" && <Sparkles className="w-3 h-3 text-blue-600" />}
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {train.number} · {badgeInfo.label}
            </span>
          </div>
        </div>

        {/* Running Days & On-Time Performance */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{train.onTimePercentage}% on-time</span>
          </span>
          <span className="text-slate-400 font-medium">
            Runs: <strong className="text-slate-700">Daily</strong>
          </span>
        </div>
      </div>

      {/* Middle Grid: Departure, Duration & Destination matching Figma 04 */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        
        {/* Origin Specimen */}
        <div className="sm:col-span-3 flex flex-col">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {train.departureTime}
          </span>
          <span className="text-xs font-bold text-slate-700 mt-0.5">
            {train.fromStation.code} · {train.fromStation.name}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatDisplayDate(journeyDate || "2026-11-08")}
          </span>
        </div>

        {/* Duration / Arrow Specimen */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center text-center px-2">
          <span className="text-[11px] font-mono font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{train.duration}</span>
          </span>
          <div className="w-full flex items-center gap-1.5">
            <div className="h-0.5 flex-1 bg-slate-200 rounded-full" />
            <div className="w-2 h-2 rounded-full border-2 border-[#2563EB] bg-white shrink-0" />
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">
            {train.hasPantry ? "Pantry Car Available" : "Direct Service"}
          </span>
        </div>

        {/* Destination & Right Specimen */}
        <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-4 text-right">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {train.arrivalTime}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">
              {train.toStation.code} · {train.toStation.name}
            </div>
            <div className="text-[11px] text-slate-400">
              {calculateArrivalDate(journeyDate || "2026-11-08", train.dayOffset, train.departureTime, train.arrivalTime)}
            </div>
          </div>

          {/* Price spec */}
          <div className="border-l border-slate-100 pl-4 text-right relative">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight leading-none">
              ₹{selectedClass.fare.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              per seat · {quota} fare
            </div>

            {/* Total for N passengers */}
            {passengerCount > 1 && (
              <div className="mt-1 text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                <span className="text-slate-600">Total ({passengerCount} pax):</span>
                <strong className="text-blue-700 font-mono">
                  ₹{(selectedClass.fare * passengerCount).toLocaleString("en-IN")}
                </strong>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFareBreakdown(!showFareBreakdown);
                  }}
                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                  aria-label="View upfront fare breakdown"
                  title="View upfront fare breakdown"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fare Breakdown Popover */}
            {showFareBreakdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-slate-800 rounded-xl p-3 shadow-xl z-30 text-left text-xs animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 font-bold text-slate-900">
                  <span>Upfront Fare Breakdown</span>
                  <button
                    type="button"
                    onClick={() => setShowFareBreakdown(false)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>

                {selectedClass.baseFare ? (
                  <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Base Fare ({passengerCount} × ₹{selectedClass.baseFare})</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{(selectedClass.baseFare * passengerCount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {Boolean(selectedClass.tatkalCharge) && (
                      <div className="flex justify-between">
                        <span>Tatkal Charge ({passengerCount} × ₹{selectedClass.tatkalCharge})</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{((selectedClass.tatkalCharge || 0) * passengerCount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    {Boolean(selectedClass.gstAmount) && (
                      <div className="flex justify-between">
                        <span>GST (5%)</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{Math.round((selectedClass.gstAmount || 0) * passengerCount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>PG Service Fee</span>
                      <span className="font-mono font-bold text-slate-900">₹{selectedClass.pgFee || 15}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-slate-900">
                      <span>Total for {passengerCount} pax</span>
                      <span className="text-blue-700 font-mono text-sm">
                        ₹{(selectedClass.fare * passengerCount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-600">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Total for {passengerCount} pax</span>
                      <span className="text-blue-700 font-mono text-sm">
                        ₹{(selectedClass.fare * passengerCount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Itemized breakdown provided on review screen.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] font-bold text-blue-700 mt-0.5">
              {selectedClass.classCode === "1A" ? "First Class" : selectedClass.classCode} · {quota}
            </div>
          </div>
        </div>
      </div>

      {/* Class Availability Selection Chips in serial: SL, 3A, 2A, First Class */}
      <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Select Travel Class (SL, 3A, 2A, First Class):</span>
          <span className="text-[11px] text-slate-400">Live Availability</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {sortedClasses.map((cls) => {
            const isClsSelected = selectedClassCode === cls.classCode;
            const displayCode = cls.classCode === "1A" ? "First Class (1A)" : cls.classCode;
            return (
              <div
                key={cls.classCode}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClassCode(cls.classCode);
                  setInternalSelected(true);
                  onSelectClass?.(train, cls);
                }}
                className={`min-w-[130px] p-2.5 rounded-xl border transition-all flex flex-col gap-1 shadow-2xs ${
                  isClsSelected
                    ? "bg-blue-50/80 border-[#2563EB] ring-2 ring-blue-200"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">
                    {displayCode}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    ₹{cls.fare.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 truncate">
                  {cls.className}
                </div>

                <div className="mt-1">
                  <AvailabilityChip
                    status={cls.status as any}
                    seatCount={cls.availableSeats}
                    label={cls.statusText}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
