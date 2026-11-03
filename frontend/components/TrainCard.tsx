"use client";

import React, { useState } from "react";
import {
  Train as TrainIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Train, ClassAvailability, QuotaType } from "../types";

interface TrainCardProps {
  train: Train;
  quota: QuotaType;
  onBookNow: (train: Train, selectedClass: ClassAvailability) => void;
}

export const TrainCard: React.FC<TrainCardProps> = ({
  train,
  quota,
  onBookNow,
}) => {
  const [selectedClassCode, setSelectedClassCode] = useState<string>(
    train.classes[0]?.classCode || "3A"
  );
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const selectedClass =
    train.classes.find((c) => c.classCode === selectedClassCode) || train.classes[0];

  // Type Badge Colors
  const getTypeBadge = (type: Train["type"]) => {
    switch (type) {
      case "VANDE_BHARAT":
        return { label: "Vande Bharat", bg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" };
      case "RAJDHANI":
        return { label: "Rajdhani Express", bg: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
      case "TEJAS":
        return { label: "Tejas Express", bg: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
      case "SHATABDI":
        return { label: "Shatabdi Express", bg: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
      default:
        return { label: "Superfast", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
    }
  };

  const badgeInfo = getTypeBadge(train.type);

  // Status Styling Logic
  const getStatusBadge = (status: ClassAvailability["status"], text: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {text}
          </span>
        );
      case "RAC":
      case "WL":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            {text}
          </span>
        );
      case "REGRET":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            {text}
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-2xl bg-[#0c1a30] border transition-all duration-300 p-5 sm:p-6 shadow-xl ${
        isHovered
          ? "border-orange-500/60 shadow-orange-500/10 shadow-2xl"
          : "border-slate-800/90 hover:border-slate-700"
      }`}
    >
      {/* Top Header: Train Name, Number & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-extrabold text-white font-sans tracking-tight">
              {train.name}
            </span>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
              #{train.number}
            </span>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeInfo.bg}`}>
            {badgeInfo.label}
          </span>
        </div>

        {/* Running Days & On-time Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
              <span
                key={idx}
                className={`w-4 h-4 rounded flex items-center justify-center font-bold ${
                  idx < 5 ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-600"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <Zap className="w-3 h-3" /> {train.onTimePercentage}% On-Time
          </span>
        </div>
      </div>

      {/* Main Schedule Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-6">
        
        {/* Departure (Col 4) */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#112240] border border-slate-700/80 flex items-center justify-center text-orange-400 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight leading-none">
              {train.departureTime}
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {train.fromStation.name}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Station Code: {train.fromStation.code}
            </div>
          </div>
        </div>

        {/* Connecting Line & Duration (Col 4) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center px-2 py-1">
          <span className="text-xs font-bold text-slate-300 font-mono mb-1.5 flex items-center gap-1">
            <span>{train.duration}</span>
            {train.dayOffset > 0 && (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                +{train.dayOffset} Day
              </span>
            )}
          </span>

          <div className="relative w-full flex items-center justify-center">
            {/* Horizontal Line with Gradient */}
            <div className="w-full h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full" />
            
            {/* Animated Center Train Icon */}
            <motion.div
              animate={{ x: isHovered ? [0, 6, 0] : 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute w-7 h-7 rounded-full bg-[#0a192f] border border-orange-400/80 flex items-center justify-center text-orange-400 shadow-md shadow-orange-500/20"
            >
              <TrainIcon className="w-3.5 h-3.5" />
            </motion.div>
          </div>

          <span className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-semibold">
            Direct High-Speed Transit
          </span>
        </div>

        {/* Arrival (Col 4) */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3 text-left md:text-right">
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight leading-none">
              {train.arrivalTime}
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {train.toStation.name}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Station Code: {train.toStation.code}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#112240] border border-slate-700/80 flex items-center justify-center text-emerald-400 font-bold">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Horizontal Scrollable Class Availability Cards */}
      <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
          <span>Select Class Quota ({quota}):</span>
          <span className="text-[11px] text-slate-500">Live IRCTC GDS Sync</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {train.classes.map((cls) => {
            const isSelected = selectedClassCode === cls.classCode;
            return (
              <motion.div
                key={cls.classCode}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedClassCode(cls.classCode)}
                className={`min-w-[145px] sm:min-w-[160px] p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 shadow-sm ${
                  isSelected
                    ? "bg-[#14284d] border-orange-500 shadow-orange-500/20 shadow-md ring-1 ring-orange-500/50"
                    : "bg-[#091529]/90 border-slate-800 hover:border-slate-700 hover:bg-[#0d1e3a]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white tracking-wide">
                    {cls.classCode}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    ₹{cls.fare.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 truncate">
                  {cls.className}
                </div>

                <div className="mt-1">
                  {getStatusBadge(cls.status, cls.statusText)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hover Reveal / Bottom Action CTA Bar */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl"
        >
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
              {selectedClass.classCode}
            </span>
            <span>Total Fare:</span>
            <span className="text-base font-extrabold text-white font-mono">
              ₹{selectedClass.fare.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(incl. GST & reservation)</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onBookNow(train, selectedClass)}
            className={`py-2 px-5 rounded-xl font-bold text-xs sm:text-sm transition shadow-lg flex items-center gap-1.5 ${
              selectedClass.status === "REGRET"
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-95"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>BOOK NOW ({selectedClass.classCode})</span>
          </motion.button>
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};

export default TrainCard;
