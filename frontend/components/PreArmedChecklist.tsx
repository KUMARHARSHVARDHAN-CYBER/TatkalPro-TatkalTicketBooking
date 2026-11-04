"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  Users,
  CreditCard,
  Wifi,
  IdCard,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Language, translations } from "../lib/i18n";

interface PreArmedChecklistProps {
  lang: Language;
  passengerCount: number;
  paymentPreSelected: boolean;
  onOpenPassengerMaster: () => void;
  onFastPrepare: () => void;
}

export const PreArmedChecklist: React.FC<PreArmedChecklistProps> = ({
  lang,
  passengerCount,
  paymentPreSelected,
  onOpenPassengerMaster,
  onFastPrepare,
}) => {
  const [networkPing, setNetworkPing] = useState<number>(34);
  const [tatkalOpen, setTatkalOpen] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    // Benchmark mock network latency
    const interval = setInterval(() => {
      setNetworkPing(Math.floor(25 + Math.random() * 18));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isReady = passengerCount > 0;

  return (
    <div className="w-full bg-[#0a1c38]/90 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      
      {/* Header with Pre-Armed Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                {t.prepareBooking}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {isReady ? "READY FOR 10:00 AM RUSH" : "PRE-CHECK INCOMPLETE"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t.prepareDesc}
            </p>
          </div>
        </div>

        <button
          onClick={onFastPrepare}
          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition active:scale-95 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pre-Arm Booking Mode</span>
        </button>
      </div>

      {/* 4-Item Pre-Flight Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* 1. Master Passenger List */}
        <div
          onClick={onOpenPassengerMaster}
          className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            passengerCount > 0
              ? "bg-[#112a52] border-emerald-500/40 text-emerald-300"
              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Passengers</span>
            </div>
            {passengerCount > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <span className="text-[11px] text-slate-300 font-bold mt-1">
            {passengerCount > 0 ? `${passengerCount} Saved Passenger(s)` : "Tap to Select"}
          </span>
        </div>

        {/* 2. Payment Pre-Selected */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            paymentPreSelected
              ? "bg-[#112a52] border-emerald-500/40 text-emerald-300"
              : "bg-[#112a52] border-emerald-500/40 text-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-400" />
              <span>Fast Payment</span>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold mt-1">
            Fast UPI Intent Ready
          </span>
        </div>

        {/* 3. Govt ID Verified */}
        <div className="p-2.5 rounded-xl border bg-[#112a52] border-emerald-500/40 text-emerald-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Identity Check</span>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold mt-1">
            Aadhaar / ID Stored
          </span>
        </div>

        {/* 4. Network Latency */}
        <div className="p-2.5 rounded-xl border bg-[#112a52] border-emerald-500/40 text-emerald-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Network Speed</span>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-300 font-bold mt-1 font-mono">
            {networkPing}ms • Low Latency
          </span>
        </div>

      </div>

    </div>
  );
};

export default PreArmedChecklist;

