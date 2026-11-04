"use client";

import React, { useState, useEffect } from "react";
import { Users, Clock, ShieldCheck, Lock } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0c1a30] border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4">
        
        {/* Pulsing Queue Indicator */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-500/15 border-2 border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-10 h-10" />
          </div>
          <span className="animate-ping absolute top-0 right-0 h-4 w-4 rounded-full bg-orange-400 opacity-75"></span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded border border-orange-500/20">
            10:00 AM Tatkal Rush Queue
          </span>
          <h3 className="text-2xl font-black text-white mt-2">
            You're Position <span className="text-orange-400 font-mono">#{Math.max(1, queuePosition)}</span> in Line
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fairness Queue Active • Regulating concurrent load to prevent database deadlocks.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 rounded-full"
            style={{ width: `${Math.min(100, Math.max(10, ((42 - queuePosition) / 42) * 100))}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Estimated wait: <strong>{estimatedSeconds}s</strong></span>
        </div>

        <div className="bg-[#112444] border border-blue-500/30 rounded-2xl p-3 text-xs text-slate-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Your passenger details and seat hold are safe. Do not refresh your browser.</span>
        </div>

      </div>
    </div>
  );
};

export default VirtualWaitingRoom;

