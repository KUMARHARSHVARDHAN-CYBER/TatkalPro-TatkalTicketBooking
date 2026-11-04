"use client";

import React, { useState, useEffect } from "react";
import {
  Train,
  Clock,
  Search,
  ShieldAlert,
  Moon,
  Sun,
  Globe,
  Ticket,
  ChevronDown,
} from "lucide-react";
import { Language, translations } from "../lib/i18n";

interface HeaderNavProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenPnrModal: () => void;
  onOpenScamModal: () => void;
  onOpenHistoryModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  lang,
  onLanguageChange,
  onOpenPnrModal,
  onOpenScamModal,
  onOpenHistoryModal,
  isDarkMode,
  onToggleTheme,
}) => {
  const [countdownText, setCountdownText] = useState("00:00:00");
  const [isAcTatkal, setIsAcTatkal] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();

      // AC Tatkal is 10:00 AM, Non-AC is 11:00 AM
      const target = new Date();
      if (currentHour < 10) {
        target.setHours(10, 0, 0, 0);
        setIsAcTatkal(true);
      } else if (currentHour < 11) {
        target.setHours(11, 0, 0, 0);
        setIsAcTatkal(false);
      } else {
        // Next day 10:00 AM
        target.setDate(target.getDate() + 1);
        target.setHours(10, 0, 0, 0);
        setIsAcTatkal(true);
      }

      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#07172e] border-b border-slate-800 text-white sticky top-[30px] z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Bar with Branding & Quick Actions */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & IRCTC Style Identifier */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-orange-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#0a192f] rounded-[10px] flex items-center justify-center">
                <Train className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                  Tatkal<span className="text-orange-500">Pro</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  IRCTC CONNECT
                </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-none hidden sm:block">
                Modern Mobile-First Rail Ticket Booking
              </p>
            </div>
          </div>

          {/* Center: Persistent One-Line Tatkal Status */}
          <div className="flex items-center gap-2 bg-[#0e223f] border border-blue-500/30 px-3 py-1 rounded-full text-xs shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
              {isAcTatkal ? "AC Tatkal (10 AM)" : "Non-AC (11 AM)"}:
            </span>
            <span className="font-mono font-bold text-amber-400 tracking-wider">
              {countdownText}
            </span>
          </div>

          {/* Right Controls: Language, PNR, Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* PNR Search Trigger */}
            <button
              onClick={onOpenPnrModal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition"
              title="Check live PNR & Chart status"
            >
              <Search className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden md:inline">PNR Status</span>
            </button>

            {/* My Bookings */}
            <button
              onClick={onOpenHistoryModal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition"
              title="View booked E-Tickets"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">My Bookings</span>
            </button>

            {/* Scam Advisory */}
            <button
              onClick={onOpenScamModal}
              className="p-1.5 rounded-lg text-amber-400 hover:bg-slate-800 transition"
              title="Scam Safety Advisory"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 transition"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="uppercase text-[10px]">{lang}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#0a192f] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 w-28">
                  <button
                    onClick={() => { onLanguageChange("en"); setIsLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>English</span>
                    {lang === "en" && <span className="text-orange-400 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { onLanguageChange("hi"); setIsLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>हिंदी</span>
                    {lang === "hi" && <span className="text-orange-400 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { onLanguageChange("hinglish"); setIsLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Hinglish</span>
                    {lang === "hinglish" && <span className="text-orange-400 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

export default HeaderNav;

