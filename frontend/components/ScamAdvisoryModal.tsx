"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, X, ShieldCheck } from "lucide-react";

interface ScamAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScamAdvisoryModal: React.FC<ScamAdvisoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0c1a30] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Official Rail Safety Bulletin
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Scam-Aware Railway Booking Guide</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Safety Guidelines */}
        <div className="flex flex-col gap-3 text-xs text-slate-300">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">NEVER Enter UPI PIN to Receive Money:</strong>
              <p className="text-[11px] mt-0.5">
                UPI PIN is only used for deducting money from your account. If any agent asks you to approve a request or enter your PIN to get a refund or ticket confirmation, it is a scam.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#071224] border border-slate-800 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Beware of Fake Tatkal Booking APKs:</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Never download unofficial third-party APKs claiming "100% Tatkal Bot Guarantee". They steal banking credentials and result in immediate PNR cancellation by CRIS.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#071224] border border-slate-800 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Verified Domain Security:</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Always verify SSL certificates. TatkalPro operates exclusively within authenticated sandboxes with 256-bit encryption.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition"
        >
          I Understand & Stay Alert
        </button>

      </div>
    </div>
  );
};

export default ScamAdvisoryModal;

