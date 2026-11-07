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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Official Rail Enquiry
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Live 10-Digit PNR Status Tracker
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            required
            maxLength={10}
            placeholder="Enter 10-digit PNR (e.g. 3583523304)..."
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={isLoading || pnrInput.length < 10}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer ${
              isLoading || pnrInput.length < 10
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm"
            }`}
          >
            {isLoading ? "Searching..." : "Track Status"}
          </button>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Card */}
        {pnrResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {pnrResult.trainNumber} - {pnrResult.trainName}
                </span>
                <p className="text-slate-500 mt-0.5">
                  Route: {pnrResult.fromStation.code} ➔ {pnrResult.toStation.code} • Class: {pnrResult.classCode}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {pnrResult.status}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Date of Journey:</span>
              <strong className="text-slate-800">{pnrResult.journeyDate}</strong>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Chart Status:</span>
              <strong className="text-slate-800">{pnrResult.chartStatus.replace(/_/g, " ")}</strong>
            </div>

            <div className="border-t border-slate-200 pt-2 flex flex-col gap-1.5">
              <span className="font-bold text-slate-800">Passenger Seat Allocations:</span>
              {pnrResult.passengers.map((p, idx) => (
                <div key={p.id} className="flex justify-between text-slate-700">
                  <span>{idx + 1}. {p.name} ({p.age}, {p.gender})</span>
                  <strong className="font-mono text-blue-700">{p.allocatedSeat || "CNF"}</strong>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onViewBookingDetails(pnrResult)}
              className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
            >
              View Full E-Ticket
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PNRLookupModal;
