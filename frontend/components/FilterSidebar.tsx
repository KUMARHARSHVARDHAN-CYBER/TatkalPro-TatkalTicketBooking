"use client";

import React from "react";
import { SlidersHorizontal, Sun, Sunrise, Sunset, Moon, RotateCcw } from "lucide-react";
import { FilterState, TravelClassCode } from "../types";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

// User specified strict serial order: SL, 3A, 2A, First Class (1A)
const CLASS_OPTIONS: { code: TravelClassCode; label: string }[] = [
  { code: "SL", label: "SL" },
  { code: "3A", label: "3A" },
  { code: "2A", label: "2A" },
  { code: "1A", label: "First Class" },
  { code: "CC", label: "CC" },
  { code: "EC", label: "EC" },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const toggleTime = (timeId: string) => {
    const exists = filters.departureTime.includes(timeId);
    const updated = exists
      ? filters.departureTime.filter((t) => t !== timeId)
      : [...filters.departureTime, timeId];
    onChange({ ...filters, departureTime: updated });
  };

  const toggleClass = (classCode: TravelClassCode) => {
    const exists = filters.classes.includes(classCode);
    const updated = exists
      ? filters.classes.filter((c) => c !== classCode)
      : [...filters.classes, classCode];
    onChange({ ...filters, classes: updated });
  };

  const toggleTrainType = (type: string) => {
    const exists = filters.trainTypes.includes(type);
    const updated = exists
      ? filters.trainTypes.filter((t) => t !== type)
      : [...filters.trainTypes, type];
    onChange({ ...filters, trainTypes: updated });
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-5 text-xs">
      
      {/* Title & Reset */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span>Filters & Sort ({totalResults})</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Sort Results By
        </span>
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "departure", label: "Earliest" },
            { id: "duration", label: "Fastest" },
            { id: "fare", label: "Cheapest" },
            { id: "availability", label: "Seats" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ ...filters, sortBy: s.id as any })}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filters.sortBy === s.id
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departure Time Slots */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Departure Time
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "early_morning", label: "00:00 - 06:00", name: "Early Morning", icon: Moon },
            { id: "morning", label: "06:00 - 12:00", name: "Morning", icon: Sunrise },
            { id: "afternoon", label: "12:00 - 18:00", name: "Afternoon", icon: Sun },
            { id: "night", label: "18:00 - 24:00", name: "Night", icon: Sunset },
          ].map((slot) => {
            const Icon = slot.icon;
            const isSelected = filters.departureTime.includes(slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleTime(slot.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 border-blue-500 text-blue-900"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{slot.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{slot.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Checkboxes in Serial: SL, 3A, 2A, First Class */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Travel Class (SL, 3A, 2A, First Class)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CLASS_OPTIONS.map((cls) => {
            const isSelected = filters.classes.includes(cls.code);
            return (
              <button
                key={cls.code}
                type="button"
                onClick={() => toggleClass(cls.code)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs border transition cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {cls.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Train Types including Passenger */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Train Category
        </span>
        <div className="flex flex-col gap-1.5">
          {[
            { id: "VANDE_BHARAT", label: "Vande Bharat Express" },
            { id: "RAJDHANI", label: "Rajdhani Express" },
            { id: "TEJAS", label: "Tejas Express" },
            { id: "SUPERFAST", label: "Superfast Express" },
            { id: "EXPRESS", label: "Mail / Express" },
            { id: "PASSENGER", label: "Passenger Train" },
          ].map((type) => {
            const isSelected = filters.trainTypes.includes(type.id);
            return (
              <label
                key={type.id}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTrainType(type.id)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600"
                />
                <span className="text-xs font-medium">{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default FilterSidebar;
