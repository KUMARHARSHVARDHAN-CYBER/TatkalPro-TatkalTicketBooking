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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Official Rail Cyber Safety Bulletin
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Scam-Aware Railway Booking Guide
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Rules */}
        <div className="flex flex-col gap-3 text-slate-700">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-950 font-bold">NEVER Enter UPI PIN to Receive Money:</strong>
              <p className="text-[11px] mt-0.5 text-rose-800">
                UPI PIN is strictly required only to debit funds from your account. If any agent claims you must approve a collect request or enter a PIN to receive a ticket refund or Tatkal confirmation, it is 100% a fraudulent scam.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-bold">Official IRCTC Customer Care Helpline: 139</strong>
              <p className="text-[11px] mt-0.5 text-slate-600">
                Never search Google for "IRCTC customer care number" as fake helpline numbers lead to cyber fraud rings. Only dial 139 (Railway RailMadad) or email care@irctc.co.in.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 font-bold">Beware of Illegal Tatkal Booking Bots (.exe / APKs)</strong>
              <p className="text-[11px] mt-0.5 text-slate-600">
                Using third-party auto-booking scripts or illegal automation software violates Section 143 of the Railways Act. TatkalPro uses defensive architectural rate limits and never employs illicit bypass mechanisms.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          I Understand & Acknowledge
        </button>

      </div>
    </div>
  );
};

export default ScamAdvisoryModal;
