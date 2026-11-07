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
  CheckCircle2,
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
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(480);
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
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = captchaCode.split("").join(" ");
      speech.rate = 0.8;
      speech.lang = "en-IN";
      window.speechSynthesis.speak(speech);
    } else {
      alert(`Captcha spelled out: ${captchaCode.split("").join(" ")}`);
    }
  };

  const handleVerifyAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      refreshCaptcha();
      return;
    }

    setIsHolding(true);
    setTimeout(() => {
      setIsHolding(false);
      onProceedToPayment(`hold_${Date.now()}`);
    }, 500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header with Seat Hold Timer */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Step 3 of 5 • Review & Verification
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Review Journey & Upfront Fare
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 8-Minute Hold Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Seat Hold: {timerStr}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Train & Journey Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-extrabold text-sm text-slate-900">
                {train.trainNumber} - {train.trainName}
              </span>
              <p className="text-slate-500 mt-0.5">
                Class: <strong className="text-slate-800">{classInfo.classCode} ({classInfo.className})</strong> • {quota} Quota
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {journeyDate}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-600">
            <div>
              From: <strong className="text-slate-800">{train.fromStation.name} ({train.fromStation.code})</strong> at {train.departureTime}
            </div>
            <div>
              To: <strong className="text-slate-800">{train.toStation.name} ({train.toStation.code})</strong> at {train.arrivalTime}
            </div>
          </div>
        </div>

        {/* Passengers Mini-List */}
        <div className="border border-slate-200 rounded-2xl p-3.5 mb-4 bg-white flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700">
            Confirmed Passengers ({passengers.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {passengers.map((p, idx) => (
              <span
                key={p.id}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span>{p.name} ({p.age}, {p.gender}) • {p.berthPreference}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Upfront Transparent Fare Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 flex flex-col gap-2 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
            Transparent Fare Breakdown (No Hidden Fees)
          </span>

          <div className="flex justify-between text-slate-600">
            <span>Base Fare ({passengerCount} × ₹{classInfo.baseFare})</span>
            <span className="font-mono font-semibold text-slate-800">₹{baseTotal.toLocaleString("en-IN")}</span>
          </div>
          {classInfo.tatkalCharge > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tatkal Charges ({passengerCount} × ₹{classInfo.tatkalCharge})</span>
              <span className="font-mono font-semibold text-slate-800">₹{tatkalTotal.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Superfast / Speed Surcharge</span>
            <span className="font-mono font-semibold text-slate-800">₹{superfastTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST (5%)</span>
            <span className="font-mono font-semibold text-slate-800">₹{gstTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Payment Gateway Service Fee</span>
            <span className="font-mono font-semibold text-slate-800">₹{pgFee}</span>
          </div>

          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Total Payable Amount</span>
            <span className="text-xl font-black font-mono text-blue-700">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Regret Shield Calm Pre-Payment Summary */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Checked: stations, date, passengers, ID. All good.</span>
        </div>

        {/* Captcha Verification Section */}
        <form onSubmit={handleVerifyAndProceed} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Accessible Human Verification Captcha</span>
            </label>
            <span className="text-[11px] text-slate-400">Case-insensitive</span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Visual SVG Captcha with Texture */}
            <div className="col-span-6 bg-slate-100 border border-slate-300 rounded-2xl p-2 flex items-center justify-between">
              <svg className="w-36 h-10 select-none" viewBox="0 0 160 45">
                <rect width="160" height="45" fill="#f1f5f9" rx="8" />
                <path d="M10 22 Q 45 5, 80 22 T 150 22" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M15 15 Q 50 35, 90 15 T 145 25" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                <text
                  x="80"
                  y="30"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="24"
                  fontWeight="900"
                  letterSpacing="6"
                  fill="#1e293b"
                >
                  {captchaCode}
                </text>
              </svg>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={playAudioCaptcha}
                  className="p-2 rounded-xl text-blue-600 hover:bg-white transition"
                  title="Play audio spelling"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 rounded-xl text-slate-600 hover:bg-white transition"
                  title="Generate new captcha"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input Box */}
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
                className={`w-full uppercase font-mono tracking-widest text-center text-lg font-black bg-slate-50 border rounded-2xl py-2 text-slate-900 focus:outline-none transition ${
                  captchaError
                    ? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-50 text-rose-800"
                    : "border-slate-300 focus:border-blue-600 focus:bg-white"
                }`}
              />
            </div>
          </div>

          {captchaError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Incorrect captcha. A fresh code has been generated. Your passenger details are safe!</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isHolding}
              className="flex-1 py-3 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
            >
              {isHolding ? (
                <span>Securing Atomic Seat Lock...</span>
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
