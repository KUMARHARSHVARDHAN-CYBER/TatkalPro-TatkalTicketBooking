"use client";

import React, { useState } from "react";
import { Search, X, QrCode, Train, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { BookingRecord } from "../lib/railway/types";

interface PNRLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBookingDetails: (booking: BookingRecord) => void;
}

export const PNRLookupModal: React.FC<PNRLookupModalProps> = ({
  isOpen,
  onClose,
  onViewBookingDetails,
}) => {
  const [pnrInput, setPnrInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pnrResult, setPnrResult] = useState<BookingRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setPnrResult(null);

    try {
      const res = await fetch(`/api/pnr?pnr=${pnrInput.trim()}`);
      const data = await res.json();
      setIsLoading(false);

      if (res.status === 200 && data.success) {
        setPnrResult(data.data);
      } else {
        setErrorMsg(data.error?.message || "PNR not found or invalid format.");
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Failed to query live PNR status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Live PNR Status & Chart Lookup</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            required
            maxLength={10}
            autoFocus
            placeholder="Enter 10-digit PNR Number..."
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-[#112444] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider font-bold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isLoading ? "Querying..." : "Search PNR"}
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PNR Result Display */}
        {pnrResult && (
          <div className="bg-[#071224] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">PNR: {pnrResult.pnr}</span>
                <h4 className="font-bold text-white text-sm">{pnrResult.trainName} (#{pnrResult.trainNumber})</h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                {pnrResult.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400">Route & Date:</span>
                <p className="font-semibold text-white">{pnrResult.fromStation.code} ➔ {pnrResult.toStation.code} ({pnrResult.journeyDate})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Chart Preparation:</span>
                <p className="font-semibold text-amber-400">{pnrResult.chartStatus.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Passengers:</span>
              {pnrResult.passengers.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#0d1c33] px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="font-medium text-white">{p.name} ({p.gender}, {p.age})</span>
                  <span className="font-mono font-bold text-emerald-400">{p.allocatedSeat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                onViewBookingDetails(pnrResult);
                onClose();
              }}
              className="mt-1 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              View Full Electronic Reservation Slip (ERS)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PNRLookupModal;

