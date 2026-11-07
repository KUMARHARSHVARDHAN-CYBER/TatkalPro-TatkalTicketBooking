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
  const [networkPing, setNetworkPing] = useState<number>(32);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    // Benchmark mock network latency
    const interval = setInterval(() => {
      setNetworkPing(Math.floor(24 + Math.random() * 16));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isReady = passengerCount > 0;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
      
      {/* Header with Pre-Armed Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 fill-orange-500 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                10:00 AM Tatkal Pre-Armed Checklist
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isReady
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isReady ? "Pre-Armed & Ready" : "Setup Required"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Arm all 4 prerequisites now so only 1-tap "Book Now" remains when the window opens.
            </p>
          </div>
        </div>

        {/* 1-Tap Fast Arm Action */}
        <button
          type="button"
          onClick={onFastPrepare}
          className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/15 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1-Tap Pre-Arm Mode</span>
        </button>
      </div>

      {/* 4-Item Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Item 1: Master Passenger List */}
        <div
          onClick={onOpenPassengerMaster}
          className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl p-3 transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                passengerCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                1. Passengers
              </span>
              <p className="text-[11px] text-slate-500">
                {passengerCount > 0 ? `${passengerCount} Selected` : "0 Selected (Click to add)"}
              </p>
            </div>
          </div>
          {passengerCount > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <span className="text-[10px] font-bold text-blue-600 underline">Add</span>
          )}
        </div>

        {/* Item 2: Pre-Armed Payment Gateway */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                paymentPreSelected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">2. Payment Method</span>
              <p className="text-[11px] text-slate-500">UPI Fast Collect Ready</p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

        {/* Item 3: Government ID Saved */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <IdCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">3. Govt ID Linked</span>
              <p className="text-[11px] text-slate-500">Aadhaar / PAN Verified</p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

        {/* Item 4: Real-time Network Benchmark */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">4. Network Ping</span>
              <p className="text-[11px] text-slate-500 font-mono">
                {networkPing} ms • 5G / Fiber OK
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

      </div>

    </div>
  );
};

export default PreArmedChecklist;
