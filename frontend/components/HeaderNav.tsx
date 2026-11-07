"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Train,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Ticket,
  ChevronDown,
  Search,
  Dumbbell,
} from "lucide-react";
import { Language, translations } from "../lib/i18n";

interface HeaderNavProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenPnrModal: () => void;
  onOpenScamModal: () => void;
  onOpenAdminModal: () => void;
  onHomeClick?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  lang,
  onLanguageChange,
  onOpenPnrModal,
  onOpenScamModal,
  onOpenAdminModal,
  onHomeClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isPracticeActive = Boolean(pathname?.startsWith("/practice"));
  const [countdownText, setCountdownText] = useState("00:42:10");
  const [countdownStatus, setCountdownStatus] = useState<"upcoming" | "open" | "expired">("upcoming");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();

      // AC Tatkal is 10:00 AM, Non-AC is 11:00 AM
      const target = new Date();
      if (currentHour < 10) {
        target.setHours(10, 0, 0, 0);
        setCountdownStatus("upcoming");
      } else if (currentHour < 11) {
        target.setHours(11, 0, 0, 0);
        setCountdownStatus("open");
      } else {
        target.setDate(target.getDate() + 1);
        target.setHours(10, 0, 0, 0);
        setCountdownStatus("upcoming");
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-white border-b-2 border-slate-900 sticky top-0 z-40 shadow-sm">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand & Railway Emblem */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          title="Return to Train Search"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0A3D78] text-white flex items-center justify-center shadow-md shadow-blue-900/30 border-2 border-[#05264F] group-hover:bg-[#072F5E] transition">
            <Train className="w-5 h-5 stroke-[2.5] text-amber-400 group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-950 tracking-tight group-hover:text-[#0A3D78] transition">
                TatkalPro
              </span>
              <span className="text-[10px] font-black text-[#0A3D78] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-300 uppercase tracking-wider hidden sm:inline-block">
                Tatkal toolkit
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
              Demo build
            </span>
          </div>
        </div>

        {/* Center: Live Station Tatkal Digital Countdown Pill */}
        <div className="hidden 2xl:flex items-center gap-2">
          {countdownStatus === "upcoming" && (
            <div className="flex items-center gap-2.5 bg-slate-900 border-2 border-amber-500 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-slate-200">AC Tatkal opens in</span>
              <strong className="font-mono font-black text-amber-300 text-sm tracking-wider">{countdownText}</strong>
              <span className="text-[10px] text-slate-950 font-black bg-amber-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                10:00 AM
              </span>
            </div>
          )}

          {countdownStatus === "open" && (
            <div className="flex items-center gap-2.5 bg-slate-900 border-2 border-emerald-500 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-bold">Tatkal Window Open:</span>
              <strong className="font-mono font-black text-emerald-200 text-sm tracking-wider">{countdownText}</strong>
              <span className="text-[10px] text-slate-950 font-black bg-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Live Seats
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: Clearly Distinguishable Railway Theme Options */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Option 1: Book Trains (Primary Railway Navy) */}
          <button
            type="button"
            onClick={onHomeClick}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0A3D78] hover:bg-[#072F5E] text-white border-2 border-[#05264F] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95"
            title="Search and Book Trains"
            aria-label="Book Trains"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Book Trains</span>
          </button>

          {/* Option 2: PNR Status (Signal Green) */}
          <button
            type="button"
            onClick={onOpenPnrModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-600 hover:border-emerald-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95"
            title="Check 10-digit Indian Railways PNR Status"
            aria-label="Check PNR Status"
          >
            <Ticket className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">PNR Status</span>
            <span className="sm:hidden">PNR</span>
          </button>

          {/* Option 2.5: Practice Mode Rehearsal (Calm Blue Tint, Right After PNR Status) */}
          <button
            type="button"
            onClick={() => router.push("/practice")}
            aria-label="Practice Tatkal booking · ~60s · zero risk"
            title="Practice Tatkal booking · ~60s · zero risk"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95 ${
              isPracticeActive
                ? "bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800 shadow-sm ring-2 ring-blue-300"
                : "bg-blue-50 hover:bg-blue-100 text-blue-950 border-2 border-blue-500 hover:border-blue-600"
            }`}
          >
            <Dumbbell className={`w-3.5 h-3.5 ${isPracticeActive ? "text-white" : "text-blue-700"}`} />
            <span className="hidden sm:inline">Practice</span>
          </button>

          {/* Option 3: Scam Advisory (Safety Amber Alert) */}
          <button
            type="button"
            onClick={onOpenScamModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-500 hover:border-amber-600 text-xs font-bold transition-all shadow-xs hidden md:flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95"
            title="Railway Scam & Fraud Advisory"
            aria-label="Railway Scam & Fraud Advisory"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden lg:inline">Scam Alert</span>
          </button>

          {/* Option 4: Bot Shield (Cyber Blue / Security) */}
          <button
            type="button"
            onClick={onOpenAdminModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-900 hover:text-blue-950 border-2 border-slate-700 hover:border-blue-700 text-xs font-bold transition-all shadow-xs hidden md:flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95"
            title="Bot Shield & Concurrency Telemetry"
            aria-label="Bot Shield & Concurrency Telemetry"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden lg:inline">Bot Shield</span>
          </button>

          {/* Option 5: Language Selector (English Only) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer min-h-[38px] shadow-xs active:scale-95"
              title="Language: English"
              aria-label="Language: English"
            >
              <Globe className="w-3.5 h-3.5 text-[#0A3D78]" />
              <span className="font-extrabold hidden sm:inline">English</span>
              <span className="font-extrabold sm:hidden">EN</span>
              <ChevronDown className="w-3 h-3 text-slate-600" />
            </button>

            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-white border-2 border-slate-800 rounded-xl shadow-xl py-1 z-50 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      onLanguageChange("en");
                      setIsLangMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-blue-700 bg-blue-50/60 transition flex items-center justify-between cursor-pointer"
                  >
                    <span>English</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Official Simulated Badge */}
          <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-400 px-2 py-1 rounded-md hidden xl:inline-flex uppercase tracking-wider">
            Simulated
          </span>

        </div>

      </div>

      {/* Mobile One-Line Countdown Status Bar */}
      <div className="lg:hidden bg-slate-900 border-t-2 border-slate-800 py-2 px-4 text-center text-xs text-slate-200 font-semibold flex items-center justify-center gap-2">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-slate-300">AC Tatkal countdown:</span>
        <strong className="font-mono text-amber-300 font-black text-sm">{countdownText}</strong>
        <span className="text-[10px] text-slate-950 font-black bg-amber-400 px-1.5 py-0.5 rounded">10 AM</span>
      </div>
    </header>
  );
};

export default HeaderNav;
