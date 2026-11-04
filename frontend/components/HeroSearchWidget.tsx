"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  MapPin,
  Train,
  Sparkles,
  Zap,
  ChevronDown,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { POPULAR_STATIONS } from "../lib/mock-data";
import { QuotaType, SearchQueryParams, TravelClassCode } from "../types";

interface HeroSearchWidgetProps {
  onSearch: (params: SearchQueryParams) => void;
  isLoading: boolean;
}

export const HeroSearchWidget: React.FC<HeroSearchWidgetProps> = ({
  onSearch,
  isLoading,
}) => {
  const [fromCode, setFromCode] = useState<string>("NDLS");
  const [toCode, setToCode] = useState<string>("MMCT");
  const [journeyDate, setJourneyDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [quota, setQuota] = useState<QuotaType>("TATKAL");
  const [selectedClass, setSelectedClass] = useState<TravelClassCode | "ALL">("ALL");

  // Autocomplete Dropdown States
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  const fromStation = POPULAR_STATIONS.find((s) => s.code === fromCode) || {
    code: fromCode,
    name: "New Delhi",
    city: "Delhi",
  };
  const toStation = POPULAR_STATIONS.find((s) => s.code === toCode) || {
    code: toCode,
    name: "Mumbai Central",
    city: "Mumbai",
  };

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      fromStation: fromCode,
      toStation: toCode,
      journeyDate,
      quota,
      selectedClass: selectedClass === "ALL" ? undefined : selectedClass,
    });
  };

  const setDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setJourneyDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="relative w-full overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20">
      
      {/* Background with Vande Bharat Image Placeholder & Dark Blue Gradients */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center filter brightness-[0.35] scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://blog-content.ixigo.com/wp-content/uploads/2023/03/Vande-Bharat-1-2.jpeg')`,
          }}
        />
        {/* Layered Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071224] via-[#071224]/85 to-[#071224]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071224] via-transparent to-[#071224]/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Hero Headlines */}
        <div className="text-center max-w-3xl mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            2026 Next-Gen Railway Booking Experience
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight"
          >
            Lightning-Fast <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">Tatkal Booking</span> & Smart Routing
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Experience zero-lag seat reservations powered by Redis atomic locking, with automatic Dijkstra multi-leg routing for waitlisted routes.
          </motion.p>
        </div>

        {/* Floating Glassmorphism Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="w-full max-w-5xl rounded-3xl bg-[#0a192f]/85 backdrop-blur-2xl border border-white/10 p-5 sm:p-8 shadow-2xl shadow-black/70 relative"
        >
          {/* Quota Tabs on Top of Widget */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-5 mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
              {(
                [
                  { id: "GENERAL", label: "General Quota", isHot: false },
                  { id: "TATKAL", label: "⚡ Tatkal (10 AM)", isHot: true },
                  { id: "PREMIUM_TATKAL", label: "Premium Tatkal", isHot: false },
                  { id: "LADIES", label: "Ladies", isHot: false },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQuota(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    quota === tab.id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                  {tab.isHot && quota !== tab.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Date Pills */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <span className="mr-1">Quick Select:</span>
              <button
                type="button"
                onClick={() => setDateOffset(0)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateOffset(1)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition text-[11px] font-medium"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDateOffset(2)}
                className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition text-[11px] font-semibold flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Tatkal Window
              </button>
            </div>
          </div>

          {/* Core Interactive Inputs Grid */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 relative items-center">
              
              {/* FROM STATION (Col 5) */}
              <div className="lg:col-span-5 relative">
                <div
                  onClick={() => {
                    setIsFromOpen(!isFromOpen);
                    setIsToOpen(false);
                  }}
                  className="bg-[#102340]/90 hover:bg-[#132a4d] border border-slate-700/80 hover:border-orange-500/50 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition flex items-center gap-3.5 group shadow-inner"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      From Station
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold text-white truncate">
                        {fromStation.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {fromStation.code}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {isFromOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-[#0c1b33] border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto p-2"
                    >
                      {POPULAR_STATIONS.map((st) => (
                        <div
                          key={st.code}
                          onClick={() => {
                            setFromCode(st.code);
                            setIsFromOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                            fromCode === st.code ? "bg-orange-500/10 text-orange-400" : "text-slate-200"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{st.name}</p>
                            <p className="text-[10px] text-slate-400">{st.city}, {st.state}</p>
                          </div>
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {st.code}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SWAP STATIONS BUTTON (Col 1 on desktop, centered floating) */}
              <div className="lg:col-span-1 flex justify-center -my-2 lg:my-0 z-20">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-[#1e3a66] hover:bg-orange-500 text-orange-300 hover:text-white border border-white/20 shadow-xl flex items-center justify-center transition"
                  title="Swap Stations"
                >
                  <motion.div animate={{ rotate: isSwapped ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ArrowLeftRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>

              {/* TO STATION (Col 5) */}
              <div className="lg:col-span-6 relative">
                <div
                  onClick={() => {
                    setIsToOpen(!isToOpen);
                    setIsFromOpen(false);
                  }}
                  className="bg-[#102340]/90 hover:bg-[#132a4d] border border-slate-700/80 hover:border-orange-500/50 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition flex items-center gap-3.5 group shadow-inner"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      To Station
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold text-white truncate">
                        {toStation.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        {toStation.code}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {isToOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-[#0c1b33] border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto p-2"
                    >
                      {POPULAR_STATIONS.map((st) => (
                        <div
                          key={st.code}
                          onClick={() => {
                            setToCode(st.code);
                            setIsToOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                            toCode === st.code ? "bg-orange-500/10 text-orange-400" : "text-slate-200"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{st.name}</p>
                            <p className="text-[10px] text-slate-400">{st.city}, {st.state}</p>
                          </div>
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {st.code}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Date Picker & Search Button Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
              
              {/* Date Input (Col 6) */}
              <div className="sm:col-span-6 bg-[#102340]/90 border border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                  <Calendar className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-bold text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* SEARCH TRAINS CTA BUTTON (Col 6) */}
              <div className="sm:col-span-6">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-full h-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2.5 transition active:shadow-md cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Querying Live Railway Engine...</span>
                    </>
                  ) : (
                    <>
                      <Train className="w-5 h-5 text-white" />
                      <span>SEARCH TRAINS</span>
                    </>
                  )}
                </motion.button>
              </div>

            </div>
          </form>

        </motion.div>

      </div>
    </div>
  );
};

export default HeroSearchWidget;
