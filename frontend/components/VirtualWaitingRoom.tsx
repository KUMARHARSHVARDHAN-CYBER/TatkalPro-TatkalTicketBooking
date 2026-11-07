"use client";

import React, { useState, useEffect } from "react";
import { Users, Clock, ShieldCheck, Lock, Zap } from "lucide-react";

interface VirtualWaitingRoomProps {
  isOpen: boolean;
  onAdmitted: () => void;
}

export const VirtualWaitingRoom: React.FC<VirtualWaitingRoomProps> = ({ isOpen, onAdmitted }) => {
  const [queuePosition, setQueuePosition] = useState(42);
  const [estimatedSeconds, setEstimatedSeconds] = useState(4);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setQueuePosition((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAdmitted();
          return 0;
        }
        return prev - Math.floor(10 + Math.random() * 8);
      });
      setEstimatedSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onAdmitted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4">
        
        {/* Pulsing Queue Indicator */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600">
            <Users className="w-10 h-10" />
          </div>
          <span className="animate-ping absolute top-0 right-0 h-4 w-4 rounded-full bg-orange-500 opacity-75" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
            10:00 AM Tatkal Rush Queue
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            You're Position <span className="text-blue-600 font-mono">#{Math.max(1, queuePosition)}</span> in Line
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Fairness Queue Active • Regulating concurrent load to prevent database deadlocks.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-orange-500 transition-all duration-700 rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, ((42 - queuePosition) / 42) * 100))}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span>Estimated admission: <strong className="text-slate-800">{estimatedSeconds}s</strong></span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center gap-2 text-left">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>A 5-minute single-use signed admission pass will be issued upon entry. Do not refresh.</span>
        </div>

        {/* Instant Fast Pass for Testing */}
        <button
          type="button"
          onClick={onAdmitted}
          className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Fast Pass: Enter Booking Room Now</span>
        </button>

      </div>
    </div>
  );
};

export default VirtualWaitingRoom;
