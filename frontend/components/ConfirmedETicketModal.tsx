"use client";

import React from "react";
import { X, Download, Home } from "lucide-react";
import { BookingRecord } from "../lib/railway/types";

interface ConfirmedETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
}

export const ConfirmedETicketModal: React.FC<ConfirmedETicketModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  if (!isOpen) return null;

  // Extract / fallback data bound to booking record matching specimen
  const trainNumber = booking?.trainNumber || "12951";
  const trainName = booking?.trainName || "New Delhi Rajdhani Express";
  const classCode = booking?.classCode || "3A";
  const quotaRaw = booking?.quota || "TATKAL";
  const quotaLabel = quotaRaw === "TATKAL" ? "Tatkal" : quotaRaw;
  const quotaShort = quotaLabel;

  // Strict Demo Reference format: TP-DEMO-XXXX (Never a 10-digit number, never a real PNR)
  const demoRef = booking?.pnr
    ? `TP-DEMO-${booking.pnr.replace(/\D/g, "").slice(-4) || "3707"}`
    : "TP-DEMO-3707";

  const fromCode = booking?.fromStation?.code || (booking as any)?.fromStationCode || "MMCT";
  const fromName = booking?.fromStation?.name || (fromCode === "MMCT" ? "Mumbai Central" : fromCode);
  const toCode = booking?.toStation?.code || (booking as any)?.toStationCode || "NDLS";
  const toName = booking?.toStation?.name || (toCode === "NDLS" ? "New Delhi" : toCode);

  const depTime = booking?.departureTime || "16:55";
  const arrTime = booking?.arrivalTime || "08:35";
  const duration = (booking as any)?.duration || "15h 40m";

  // Parse passenger info
  const primaryPax = booking?.passengers?.[0];
  const passengerName = primaryPax?.name || "Rahul Sharma";
  const passengerAge = primaryPax?.age || 32;
  const passengerGender =
    primaryPax?.gender === "F"
      ? "Female"
      : "Male";
  const passengerDetails = `${passengerAge} · ${passengerGender} · Veg meal`;

  // Coach & Seat parsing
  const allocatedSeat = primaryPax?.allocatedSeat || "Coach B6 · Seat 12";
  const coachSeat = allocatedSeat.includes("Coach")
    ? allocatedSeat
    : allocatedSeat.includes("-")
    ? `Coach ${allocatedSeat.split("-")[0]} · Seat ${allocatedSeat.split("-")[1].split(" ")[0]}`
    : `Coach B6 · Seat 12`;

  // Fare
  const totalFare = booking?.totalFare || 5416;
  const fareAmount = totalFare.toLocaleString("en-IN");

  // Dates
  const routeDate = "06 Nov, Fri";
  const depFullDate = "06 Nov 2026 · 16:55";
  const arrFullDate = "07 Nov · 08:35";

  // Download demo ticket implementation
  const handleDownloadDemoTicket = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TatkalPro Demo Ticket - ${demoRef}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F1F5F9;
      color: #0F172A;
      margin: 0;
      padding: 40px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .ticket-card {
      position: relative;
      width: 100%;
      max-width: 480px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-size: 14px;
      font-weight: 900;
      color: rgba(244, 63, 94, 0.35);
      white-space: nowrap;
      pointer-events: none;
      z-index: 20;
      letter-spacing: 3px;
      border-top: 2px dashed rgba(244, 63, 94, 0.4);
      border-bottom: 2px dashed rgba(244, 63, 94, 0.4);
      padding: 6px 30px;
      text-transform: uppercase;
    }
    .navy-header {
      background: #0B1528;
      color: #FFFFFF;
      padding: 20px 24px 16px;
    }
    .header-row1 {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .train-name {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .sim-tag {
      background: #063321;
      color: #34D399;
      border: 1px solid rgba(5, 150, 105, 0.4);
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .sim-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34D399;
    }
    .header-quota {
      font-size: 12px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .header-ref {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      font-size: 12px;
      color: #94A3B8;
    }
    .ref-code {
      color: #FFFFFF;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      font-size: 12px;
    }
    .body-section {
      padding: 24px 24px 8px;
    }
    .route-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stn-code {
      font-size: 28px;
      font-weight: 900;
      color: #0F172A;
      line-height: 1;
    }
    .stn-name {
      font-size: 13px;
      color: #64748B;
      margin-top: 5px;
    }
    .stn-time {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 8px;
    }
    .route-mid {
      text-align: center;
      font-size: 12px;
      color: #64748B;
    }
    .arrow-line {
      width: 80px;
      height: 2px;
      background: #2563EB;
      margin: 6px auto;
    }
    .overnight-pill {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 9px;
      border-radius: 9999px;
      background: #EBF3FE;
      color: #2563EB;
      font-size: 10px;
      font-weight: 700;
    }
    .date-dots {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    .chips-row {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .chip {
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
    .chip-grey {
      background: #F1F5F9;
      color: #334155;
    }
    .chip-blue {
      background: #EBF3FE;
      color: #2563EB;
    }
    .perforated-wrap {
      position: relative;
      padding: 14px 0;
    }
    .notch-l {
      position: absolute;
      left: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
    }
    .notch-r {
      position: absolute;
      right: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
    }
    .dashed-line {
      width: 100%;
      border-top: 1px dashed #CBD5E1;
    }
    .pax-section {
      padding: 0 24px 16px;
    }
    .pax-label {
      font-size: 10px;
      font-weight: 800;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .pax-fare-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pax-name {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
    }
    .pax-meta {
      font-size: 12px;
      color: #64748B;
      margin-top: 3px;
    }
    .fare-amt {
      font-size: 24px;
      font-weight: 800;
      color: #F97316;
      font-family: ui-monospace, monospace;
      text-align: right;
    }
    .payment-tag {
      font-size: 12px;
      color: #10B981;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
      justify-content: flex-end;
      margin-top: 3px;
    }
    .notice-card {
      margin: 8px 24px 24px;
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 16px;
      padding: 14px 16px;
      color: #92400E;
      font-size: 11.5px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="watermark">DEMO · NOT VALID FOR TRAVEL</div>
    <div class="navy-header">
      <div class="header-row1">
        <span class="train-name">${trainNumber} · ${trainName}</span>
        <span class="sim-tag"><span class="sim-dot"></span>SIMULATED</span>
      </div>
      <div class="header-quota">${classCode} · ${quotaLabel} quota</div>
      <div class="header-ref">
        <span>DEMO REF</span>
        <span class="ref-code">${demoRef}</span>
        <span>· Not a PNR</span>
      </div>
    </div>
    <div class="body-section">
      <div class="route-row">
        <div>
          <div class="stn-code">${fromCode}</div>
          <div class="stn-name">${fromName}</div>
          <div class="stn-time">${depTime}</div>
        </div>
        <div class="route-mid">
          <div>${duration}</div>
          <div class="arrow-line"></div>
          <div>${routeDate}</div>
          <div class="overnight-pill">Overnight</div>
        </div>
        <div style="text-align: right;">
          <div class="stn-code">${toCode}</div>
          <div class="stn-name">${toName}</div>
          <div class="stn-time">${arrTime}</div>
        </div>
      </div>
      <div class="date-dots">
        <div><span style="color: #2563EB;">●</span> ${depFullDate}</div>
        <div><span style="color: #F97316;">●</span> ${arrFullDate}</div>
      </div>
      <div class="chips-row">
        <div class="chip chip-grey">${classCode} · ${quotaShort}</div>
        <div class="chip chip-blue">${coachSeat}</div>
      </div>
    </div>
    <div class="perforated-wrap">
      <div class="notch-l"></div>
      <div class="dashed-line"></div>
      <div class="notch-r"></div>
    </div>
    <div class="pax-section">
      <div class="pax-label">PASSENGER & FARE</div>
      <div class="pax-fare-row">
        <div>
          <div class="pax-name">${passengerName}</div>
          <div class="pax-meta">${passengerDetails}</div>
        </div>
        <div>
          <div class="fare-amt">₹${fareAmount}</div>
          <div class="payment-tag"><span style="color: #10B981;">●</span> Simulated payment</div>
        </div>
      </div>
    </div>
    <div class="notice-card">
      <strong style="display: block; margin-bottom: 3px;">Not valid for travel</strong>
      No real booking, PNR or payment. TatkalPro is not affiliated with IRCTC or Indian Railways.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TatkalPro-Demo-Ticket-${demoRef}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4 sm:p-6 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Your demo ticket"
    >
      <div className="relative w-full max-w-[480px] flex flex-col items-center">
        
        {/* Close X Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          aria-label="Close ticket dialog"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Ticket Card Matching Specimen */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden relative">
          
          {/* Watermark Diagonal Overlay across Card Body */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden flex items-center justify-center select-none">
            <div
              className="transform -rotate-[28deg] border-y-2 border-dashed border-rose-400/40 py-1 px-8 text-rose-500/35 font-black text-xs sm:text-sm tracking-[0.22em] uppercase whitespace-nowrap"
            >
              DEMO · NOT VALID FOR TRAVEL
            </div>
          </div>

          {/* Dark Navy Card Header */}
          <div className="bg-[#0B1528] px-6 pt-5 pb-4 text-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[17px] tracking-tight text-white">
                {trainNumber} · {trainName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#063321] text-[#34D399] border border-[#059669]/40 text-[10px] font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block" />
                SIMULATED
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-normal">
              {classCode} · {quotaLabel} quota
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <span className="text-slate-400 font-semibold tracking-wider text-[11px]">
                DEMO REF
              </span>
              <span className="text-white font-mono font-bold tracking-wider text-xs">
                {demoRef}
              </span>
              <span className="text-slate-400 font-normal">· Not a PNR</span>
            </div>
          </div>

          {/* Card Middle: Route, Station codes, Timings, Duration */}
          <div className="px-6 pt-6 pb-2">
            <div className="grid grid-cols-3 items-center">
              <div>
                <div className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                  {fromCode}
                </div>
                <div className="text-sm text-slate-500 leading-tight mt-1.5 font-normal truncate">
                  {fromName}
                </div>
                <div className="text-xl font-bold text-slate-900 leading-tight mt-2">
                  {depTime}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-medium">{duration}</span>
                <div className="w-20 sm:w-24 flex items-center justify-center my-1.5">
                  <div className="w-full h-[2px] bg-[#2563EB] relative" />
                </div>
                <span className="text-xs text-slate-600 font-medium">{routeDate}</span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#EBF3FE] text-[#2563EB] text-[10px] font-semibold">
                  Overnight
                </span>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                  {toCode}
                </div>
                <div className="text-sm text-slate-500 leading-tight mt-1.5 font-normal truncate">
                  {toName}
                </div>
                <div className="text-xl font-bold text-slate-900 leading-tight mt-2">
                  {arrTime}
                </div>
              </div>
            </div>

            {/* Date dots row */}
            <div className="mt-5 flex items-center justify-between text-xs text-slate-600 font-medium px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block shrink-0" />
                <span>{depFullDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F97316] inline-block shrink-0" />
                <span>{arrFullDate}</span>
              </div>
            </div>

            {/* Chips row: Class & Coach/Seat */}
            <div className="mt-4 flex items-center gap-2.5">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                {classCode} · {quotaShort}
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-[#EBF3FE] text-[#2563EB] text-xs font-semibold">
                {coachSeat}
              </span>
            </div>
          </div>

          {/* Ticket Perforation & Cutout Notches */}
          <div className="relative py-3.5 flex items-center">
            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100/90 border border-slate-300/80 shadow-inner" />
            <div className="w-full border-t border-dashed border-slate-300" />
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100/90 border border-slate-300/80 shadow-inner" />
          </div>

          {/* Card Bottom: Passenger & Fare */}
          <div className="px-6 pb-4 pt-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              PASSENGER & FARE
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900 leading-tight">
                  {passengerName}
                </div>
                <div className="text-xs text-slate-500 leading-tight mt-1 font-normal">
                  {passengerDetails}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-[#F97316] leading-tight">
                  ₹{fareAmount}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                  <span className="text-xs text-[#10B981] font-medium">
                    Simulated payment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amber Warning Card: "Not valid for travel" (Inside card bottom) */}
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
            <h4 className="text-xs font-bold leading-tight mb-1 text-[#92400E]">
              Not valid for travel
            </h4>
            <p className="text-[11.5px] text-[#92400E]/90 leading-relaxed font-normal">
              No real booking, PNR or payment. TatkalPro is not affiliated with IRCTC or Indian Railways.
            </p>
          </div>

        </div>

        {/* Action CTAs below ticket card */}
        <div className="w-full mt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadDemoTicket}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm tracking-wide shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download demo ticket
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <Home className="w-4 h-4" />
            Back to home
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmedETicketModal;
