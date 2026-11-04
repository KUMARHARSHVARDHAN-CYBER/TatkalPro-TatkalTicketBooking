"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, X, Train } from "lucide-react";
import { STATIONS } from "../lib/railway/data";
import { Station } from "../lib/railway/types";

interface StationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation: (station: Station) => void;
  title: string;
}

export const StationSearchModal: React.FC<StationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStation,
  title,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredStations = STATIONS.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.nameHindi.includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            autoFocus
            placeholder="Search by code, city or Hindi name (e.g. NDLS, नई दिल्ली)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#112240] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans"
          />
        </div>

        {/* Popular Station Quick Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold w-full">Popular Hubs:</span>
          {["NDLS", "MMCT", "HWH", "SBC", "MAS", "BPL", "KOTA"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                const s = STATIONS.find((st) => st.code === code);
                if (s) {
                  onSelectStation(s);
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:text-orange-400 hover:border-orange-500/50 transition"
            >
              {code}
            </button>
          ))}
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
          {filteredStations.map((station) => (
            <div
              key={station.code}
              onClick={() => {
                onSelectStation(station);
                onClose();
              }}
              className="p-3 rounded-xl hover:bg-[#112444] border border-transparent hover:border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                    {station.name}
                  </span>
                  <span className="text-xs text-slate-400">({station.nameHindi})</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {station.city}, {station.state}
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-orange-400">
                {station.code}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StationSearchModal;

