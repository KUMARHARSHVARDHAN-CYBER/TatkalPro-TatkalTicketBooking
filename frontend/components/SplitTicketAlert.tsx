"use client";

import React from "react";
import { Sparkles, ArrowRight, Clock, ShieldCheck, GitFork } from "lucide-react";
import { motion } from "framer-motion";

interface SplitTicketAlertProps {
  fromCode: string;
  toCode: string;
  onExploreSplit: () => void;
}

export const SplitTicketAlert: React.FC<SplitTicketAlertProps> = ({
  fromCode,
  toCode,
  onExploreSplit,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl bg-gradient-to-r from-blue-950/70 via-[#0e2448] to-[#0a1a36] border border-blue-500/40 p-4 sm:p-5 shadow-xl relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded border border-blue-500/30">
                Split-Ticket Available
              </span>
              <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                Direct Tatkal Waitlisted?
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
              Confirmed 2-Leg Route found via <span className="text-orange-400">Kota Junction (KOTA)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Train 12952 to KOTA (10 seats) ➔ 1h 25m platform transfer ➔ Train 12954 to {toCode} (15 seats).
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onExploreSplit}
          className="self-stretch sm:self-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>View Split Route</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SplitTicketAlert;
