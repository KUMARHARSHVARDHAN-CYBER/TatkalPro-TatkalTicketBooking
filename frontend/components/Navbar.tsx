"use client";

import React, { useState, useEffect } from "react";
import { Train, Clock, Search, ShieldCheck, User, Bell } from "lucide-react";
import { motion } from "framer-motion";

export const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [tatkalCountdown, setTatkalCountdown] = useState<string>("00:00:00");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );

      // Countdown to next 10:00 AM Tatkal window
      const target = new Date();
      if (now.getHours() >= 10) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(10, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTatkalCountdown(
        `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#071224]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Emblem */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#003B73] via-[#0A4D8C] to-orange-500 p-0.5 shadow-lg shadow-orange-500/10 flex items-center justify-center cursor-pointer"
            >
              <div className="w-full h-full bg-[#071224] rounded-[14px] flex items-center justify-center">
                <Train className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              </div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-sans">
                  IRCTC <span className="text-orange-500 font-black">NEXT</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 text-orange-400" /> Official Partner
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Ministry of Railways • Government of India
              </p>
            </div>
          </div>

          {/* Center Ticker: Tatkal 10:00 AM Countdown */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl shadow-inner">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">AC Tatkal (10:00 AM):</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              <span>{tatkalCountdown}</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs text-slate-400 font-mono">{currentTime}</span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition">
              <Search className="w-3.5 h-3.5 text-orange-400" />
              <span>PNR Status</span>
            </button>

            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 pl-1 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">Harshvardhan</p>
                <p className="text-[10px] text-emerald-400 font-mono leading-tight">IRCTC Verified</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
