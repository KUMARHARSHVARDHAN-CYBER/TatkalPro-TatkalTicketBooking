"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  Volume2,
  RotateCw,
  X,
  Lock,
  Receipt,
  AlertCircle,
  Zap,
} from "lucide-react";
import { TrainSchedule, ClassFareAndAvailability, Passenger, QuotaCode } from "../lib/railway/types";

interface ReviewAndCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  train: TrainSchedule;
  classInfo: ClassFareAndAvailability;
  quota: QuotaCode;
  journeyDate: string;
  passengers: Passenger[];
  onProceedToPayment: (holdToken: string) => void;
}

export const ReviewAndCaptchaModal: React.FC<ReviewAndCaptchaModalProps> = ({
  isOpen,
  onClose,
  train,
  classInfo,
  quota,
  journeyDate,
  passengers,
  onProceedToPayment,
}) => {
  const [captchaCode, setCaptchaCode] = useState("K9X4M");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(480); // 8 minutes hold
  const [isHolding, setIsHolding] = useState(false);

  // Generate fresh captcha
  const refreshCaptcha = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptchaInput("");
    setCaptchaError(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshCaptcha();
      setHoldRemainingSeconds(480);
    }
  }, [isOpen]);

  // Seat hold timer countdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setHoldRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Audio speech synthesis for accessible captcha
  const playAudioCaptcha = () => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = captchaCode.split("").join(" ");
      speech.rate = 0.8;
      speech.lang = "en-IN";
      window.speechSynthesis.speak(speech);
    } else {
      alert(`Captcha audio spelled out: ${captchaCode.split("").join(" ")}`);
    }
  };

  const handleVerifyAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      // Resilience feature: Never wipe passenger form! Just issue fresh captcha and shake.
      refreshCaptcha();
      return;
    }

    setIsHolding(true);
    setTimeout(() => {
      setIsHolding(false);
      onProceedToPayment(`hold_${Date.now()}`);
    }, 600);
  };

  const passengerCount = passengers.length || 1;
  const baseTotal = classInfo.baseFare * passengerCount;
  const tatkalTotal = classInfo.tatkalCharge * passengerCount;
  const superfastTotal = classInfo.superfastCharge * passengerCount;
  const gstTotal = Math.round(classInfo.gstAmount * passengerCount);
  const pgFee = classInfo.pgFee;
  const grandTotal = baseTotal + tatkalTotal + superfastTotal + gstTotal + pgFee;

  const mins = Math.floor(holdRemainingSeconds / 60);
  const secs = holdRemainingSeconds % 60;
  const timerStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header with Seat Hold Timer */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-extrabold text-white">Review Booking & Captcha</h3>
              <p className="text-[11px] text-slate-400">Step 2 of 3 • Tatkal Guaranteed Seat Hold</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs text-emerald-400 font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{timerStr}</span>
          </div>
        </div>

        {/* Seat Hold Assurance Banner */}
        <div className="bg-[#112444] border border-blue-500/30 rounded-2xl p-3 flex items-center gap-3 text-xs text-slate-300 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Seat Held in Memory: </span>
            <span>Your {classInfo.classCode} quota is held exclusively for you for 8 minutes while you complete captcha and payment.</span>
          </div>
        </div>

        {/* Journey & Passengers Summary */}
        <div className="bg-[#091529] border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div>
              <span className="font-bold text-white text-sm">{train.trainName} (#{train.trainNumber})</span>
              <p className="text-slate-400">{train.fromStation.code} ➔ {train.toStation.code} • {journeyDate}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
              {classInfo.classCode} ({quota})
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Passengers:</span>
            {passengers.map((p, idx) => (
              <div key={p.id || idx} className="flex items-center justify-between text-slate-200">
                <span>{idx + 1}. {p.name} ({p.gender}, {p.age} yrs)</span>
                <span className="text-slate-400 font-mono">Berth: {p.berthPreference}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transparent Upfront Fare Breakdown */}
        <div className="bg-[#091529] border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
            <Receipt className="w-3.5 h-3.5 text-orange-400" />
            <span>Upfront Total Fare Breakdown (No Hidden Charges)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Base Ticket Fare ({passengerCount} pax)</span>
            <span className="font-mono text-slate-200">₹{baseTotal}</span>
          </div>
          {tatkalTotal > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Tatkal Surcharge Charge</span>
              <span className="font-mono text-orange-400">+₹{tatkalTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Superfast & Reservation Charge</span>
            <span className="font-mono text-slate-200">+₹{superfastTotal}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>GST (5% on AC Classes)</span>
            <span className="font-mono text-slate-200">+₹{gstTotal}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>IRCTC / PG Convenience Fee</span>
            <span className="font-mono text-slate-200">+₹{pgFee}</span>
          </div>
          <div className="border-t border-slate-700/80 pt-2 mt-1 flex justify-between items-center text-sm font-black text-white">
            <span>Total Payable Amount</span>
            <span className="font-mono text-lg text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Accessible Audio & Visual Captcha Form */}
        <form onSubmit={handleVerifyAndProceed} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enter Verification Captcha
            </label>
            <span className="text-[10px] text-slate-400">Never wipes form on error</span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Visual Captcha Canvas Display */}
            <div className="col-span-6 bg-slate-900 border border-slate-700 rounded-2xl p-2 flex items-center justify-between">
              <div className="relative font-mono font-black text-xl tracking-[6px] text-white select-none px-3 py-1 bg-[#071224] rounded-xl border border-slate-800">
                {captchaCode}
                {/* Visual Distortion Line */}
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-orange-500/40 pointer-events-none -rotate-6" />
              </div>

              {/* Action Buttons: Audio & Refresh */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={playAudioCaptcha}
                  className="p-2 rounded-xl text-blue-400 hover:text-white hover:bg-slate-800 transition"
                  title="Listen to Captcha"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Generate New Captcha"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Big Input Box */}
            <div className="col-span-6">
              <input
                type="text"
                required
                maxLength={5}
                autoFocus
                placeholder="Type here..."
                value={userCaptchaInput}
                onChange={(e) => {
                  setUserCaptchaInput(e.target.value);
                  setCaptchaError(false);
                }}
                className={`w-full uppercase font-mono tracking-widest text-center text-lg font-black bg-[#112444] border rounded-2xl py-2 text-white focus:outline-none transition ${
                  captchaError
                    ? "border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20"
                    : "border-slate-700 focus:border-orange-500"
                }`}
              />
            </div>
          </div>

          {captchaError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Incorrect captcha. A new code has been loaded. Your passenger details are safely preserved!</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isHolding}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isHolding ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  <span>Securing Seat Lock...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>PROCEED TO PAYMENT (₹{grandTotal.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReviewAndCaptchaModal;

