"use client";

import React from "react";
import { Filter, SlidersHorizontal, Sun, Sunrise, Sunset, Moon, RotateCcw } from "lucide-react";
import { FilterState, TravelClassCode } from "../types";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

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
    <div className="w-full bg-[#0c1a30] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      
      {/* Title & Reset */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-orange-400" />
          <span>Filters & Sort</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-orange-400 transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) =>
            onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })
          }
          className="w-full bg-[#112240] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
        >
          <option value="departure">Departure (Earliest First)</option>
          <option value="duration">Travel Duration (Fastest)</option>
          <option value="availability">Seat Availability (Highest)</option>
        </select>
      </div>

      {/* Departure Time Slots */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          Departure Time
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "early_morning", label: "00:00 - 06:00", name: "Early Morning", icon: Moon },
            { id: "morning", label: "06:00 - 12:00", name: "Morning", icon: Sunrise },
            { id: "afternoon", label: "12:00 - 18:00", name: "Mid Day", icon: Sun },
            { id: "night", label: "18:00 - 24:00", name: "Night", icon: Sunset },
          ].map((slot) => {
            const Icon = slot.icon;
            const isSelected = filters.departureTime.includes(slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleTime(slot.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isSelected
                    ? "bg-orange-500/15 border-orange-500 text-orange-300"
                    : "bg-[#112240] border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[11px] font-bold">{slot.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{slot.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Journey Classes */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          Journey Classes
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(["3A", "2A", "1A", "SL", "CC", "EC"] as TravelClassCode[]).map((cls) => {
            const isSelected = filters.classes.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                    : "bg-[#112240] text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* Train Types */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          Train Types
        </label>
        <div className="flex flex-col gap-2 text-xs">
          {[
            { id: "VANDE_BHARAT", label: "Vande Bharat Express" },
            { id: "RAJDHANI", label: "Rajdhani Express" },
            { id: "TEJAS", label: "Tejas Express" },
            { id: "SUPERFAST", label: "Superfast / Express" },
          ].map((type) => {
            const isSelected = filters.trainTypes.includes(type.id);
            return (
              <label
                key={type.id}
                className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTrainType(type.id)}
                  className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <span className="font-medium">{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Result Counter Footer */}
      <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
        Showing <span className="font-bold text-white">{totalResults}</span> trains matching filters
      </div>

    </div>
  );
};

export default FilterSidebar;
