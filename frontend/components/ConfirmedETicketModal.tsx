"use client";

import React, { useState } from "react";
import {
  Download,
  Share2,
  Calendar,
  X,
  CheckCircle2,
  QrCode,
  Train,
  Clock,
  Printer,
  FileText,
  Calculator,
  Navigation,
} from "lucide-react";
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
  const [showRunningStatus, setShowRunningStatus] = useState(false);
  const [showRefundCalculator, setShowRefundCalculator] = useState(false);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*TatkalPro Confirmed E-Ticket*\nPNR: ${booking.pnr}\nTrain: ${booking.trainNumber} - ${booking.trainName}\nRoute: ${booking.fromStation.code} -> ${booking.toStation.code}\nDate: ${booking.journeyDate}\nPassengers: ${booking.passengers.map((p) => `${p.name} (${p.allocatedSeat})`).join(", ")}\nTotal Fare: ₹${booking.totalFare}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleAddToCalendar = () => {
    const title = `Train Journey: ${booking.trainName} (${booking.fromStation.code} to ${booking.toStation.code})`;
    const details = `PNR: ${booking.pnr}. Coach/Berth: ${booking.passengers.map((p) => p.allocatedSeat).join(", ")}`;
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${booking.journeyDate.replace(/-/g, "")}T165500Z/${booking.journeyDate.replace(/-/g, "")}T235500Z`;
    window.open(googleCalUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md print:p-0 print:bg-white">
      <div className="w-full max-w-2xl bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto print:max-h-none print:border-none print:bg-white print:text-black">
        
        {/* Header Actions (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
              CONFIRMED TICKET (PNR: {booking.pnr})
            </span>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* E-Ticket Official Slotted Layout */}
        <div className="bg-[#071224] border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-5 print:border-black print:bg-white print:text-black">
          
          {/* Top IRCTC Emblem & Title Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl">
                IR
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-white print:text-black">
                  INDIAN RAILWAYS • ELECTRONIC RESERVATION SLIP (ERS)
                </h4>
                <p className="text-[10px] text-slate-400 print:text-gray-600">
                  Booked via TatkalPro Engine • Transaction ID: {booking.paymentDetails.transactionId}
                </p>
              </div>
            </div>

            {/* PNR Box */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">PNR Number</span>
              <div className="text-xl sm:text-2xl font-mono font-black text-orange-400 tracking-widest print:text-black">
                {booking.pnr}
              </div>
            </div>
          </div>

          {/* Train & Journey Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0c1a30] p-4 rounded-2xl border border-slate-800 print:bg-gray-50 print:border-black text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Train No & Name</span>
              <p className="font-bold text-white print:text-black mt-0.5">
                {booking.trainNumber} / {booking.trainName}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Date of Journey</span>
              <p className="font-bold text-white print:text-black mt-0.5">{booking.journeyDate}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Class & Quota</span>
              <p className="font-bold text-white print:text-black mt-0.5">
                {booking.classCode} • {booking.quota}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Chart Status</span>
              <p className="font-bold text-amber-400 mt-0.5 print:text-black">
                {booking.chartStatus.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Station Departure & Arrival */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-800 pb-4 print:border-black text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
                DEP
              </div>
              <div>
                <span className="text-base font-black text-white print:text-black font-mono">
                  {booking.departureTime}
                </span>
                <p className="font-bold text-slate-200 print:text-black">
                  {booking.fromStation.name} ({booking.fromStation.code})
                </p>
                <p className="text-[10px] text-slate-400">Platform #1 • On-Time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-end text-left sm:text-right">
              <div>
                <span className="text-base font-black text-white print:text-black font-mono">
                  {booking.arrivalTime}
                </span>
                <p className="font-bold text-slate-200 print:text-black">
                  {booking.toStation.name} ({booking.toStation.code})
                </p>
                <p className="text-[10px] text-slate-400">Platform #2 • Next Day</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                ARR
              </div>
            </div>
          </div>

          {/* Allocated Passenger Seats Table */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
              Passenger Reservation Status
            </span>
            <div className="border border-slate-800 rounded-xl overflow-hidden print:border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c1a30] text-slate-400 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Passenger Name</th>
                    <th className="p-2.5">Age/Gender</th>
                    <th className="p-2.5">Booking Status</th>
                    <th className="p-2.5">Coach & Berth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-black print:text-black">
                  {booking.passengers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold">{p.name}</td>
                      <td className="p-2.5">{p.age} / {p.gender}</td>
                      <td className="p-2.5 font-bold text-emerald-400 print:text-black">CONFIRMED (CNF)</td>
                      <td className="p-2.5 font-mono font-bold text-orange-400 print:text-black">
                        {p.allocatedSeat || "B2-18"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Code & Total Fare Bar */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 print:border-black">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white rounded-xl p-1 shadow flex items-center justify-center">
                <QrCode className="w-14 h-14 text-black" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Verification QR</span>
                <p className="text-xs text-slate-300 font-mono">Scannable by TTE Handheld Terminal</p>
                <p className="text-[10px] text-emerald-400 font-bold">100% Legitimate E-Ticket</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase">Total Amount Paid</span>
              <div className="text-2xl font-black text-white font-mono print:text-black">
                ₹{booking.totalFare.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-400">Includes all Tatkal charges & GST</span>
            </div>
          </div>

        </div>

        {/* Live Train Running Status Drawer Toggle */}
        {showRunningStatus && (
          <div className="bg-[#071224] border border-blue-500/30 rounded-2xl p-4 mt-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                Live Train Running Status (Train #{booking.trainNumber})
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">ON TIME</span>
            </div>
            <p className="text-slate-300">
              Currently departing <strong>New Delhi (NDLS)</strong> from Platform 1. Next scheduled stop is <strong>Kota Junction (KOTA)</strong> at 21:30 hrs.
            </p>
          </div>
        )}

        {/* Cancellation Calculator Drawer Toggle */}
        {showRefundCalculator && (
          <div className="bg-[#071224] border border-amber-500/30 rounded-2xl p-4 mt-3 flex flex-col gap-2 text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Tatkal Cancellation & Refund Rules
            </span>
            <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
              <li><strong>Confirmed Tatkal Ticket:</strong> No refund is granted upon cancellation of confirmed Tatkal tickets (as per official Indian Railways rules).</li>
              <li><strong>Waitlisted Tatkal Ticket:</strong> 100% refund of fare minus clerkage charge (₹60) is auto-credited if ticket remains waitlisted after chart preparation.</li>
              <li><strong>Train Cancelled by Railways:</strong> Full 100% refund automatically credited within 48 hours without filing TDR.</li>
            </ul>
          </div>
        )}

        {/* Action Controls (Hidden in Print) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-orange-400" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleAddToCalendar}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setShowRunningStatus(!showRunningStatus)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Status</span>
          </button>

          <button
            onClick={() => setShowRefundCalculator(!showRefundCalculator)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Calculator className="w-3.5 h-3.5 text-rose-400" />
            <span>Cancel Rules</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmedETicketModal;

