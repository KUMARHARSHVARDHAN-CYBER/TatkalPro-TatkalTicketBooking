"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  Users,
  IdCard,
  AlertTriangle,
  Lock,
  ExternalLink,
  Zap,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import defaultRules from "../lib/safetyNet/defaultRules.json";
import { Language } from "../lib/i18n";

interface HomeInfoSectionsProps {
  lang?: Language;
  onOpenScamModal?: () => void;
}

export const HomeInfoSections: React.FC<HomeInfoSectionsProps> = ({
  lang = "en",
  onOpenScamModal,
}) => {
  const isHi = lang === "hi";

  // Sourced directly from safetyNet defaultRules.json
  const maxPaxRule = defaultRules.find((r) => r.id === "RULE_MAX_PASSENGERS");
  const idRule = defaultRules.find((r) => r.id === "RULE_PRIMARY_ID_REQUIRED");
  const refundRule = defaultRules.find((r) => r.id === "RULE_TATKAL_NON_REFUNDABLE");
  const windowRule = defaultRules.find((r) => r.id === "RULE_DATE_WINDOW_SANITY");
  const lastVerifiedDate = maxPaxRule?.last_verified || "04 Nov 2026";

  return (
    <div className="w-full bg-slate-50 border-t border-slate-200/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col gap-12 max-w-7xl mx-auto">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HOW TATKALPRO HELPS (Prepare, Protect, Recover)               */}
      {/* ========================================================================= */}
      <section aria-labelledby="how-tatkalpro-helps-heading" className="flex flex-col gap-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isHi ? "तात्काल प्रो कैसे मदद करता है" : "Zero-Mistake Tatkal Architecture"}</span>
          </div>
          <h2
            id="how-tatkalpro-helps-heading"
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
          >
            {isHi ? "तात्काल प्रो कैसे सहायता करता है" : "How TatkalPro Helps"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 font-medium">
            {isHi
              ? "तैयारी से लेकर रिफंड तक — हर कदम पर समय और पैसे की सुरक्षा।"
              : "End-to-end safeguard against rushed booking mistakes, timeout drops, and refund delays."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Prepare */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isHi ? "तैयारी (Prepare)" : "Prepare"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {isHi
                  ? "यात्रियों को पहले से सहेजें और विंडो खुलने से पहले तैयार रहें।"
                  : "Save passengers in advance and be fully prepared before the high-speed booking window opens."}
              </p>
            </div>
            <div className="mt-auto pt-2 text-[11px] font-semibold text-blue-700 flex items-center gap-1">
              <span>{isHi ? "सहेजे गए मास्टर यात्री" : "Pre-saved master list & instant autofill"}</span>
            </div>
          </div>

          {/* Card 2: Protect */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isHi ? "सुरक्षा (Protect)" : "Protect"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {isHi
                  ? "स्वतः सहेजे गए ड्राफ्ट, सीट-होल्ड टाइमर और प्री-पेमेंट गलती जांच।"
                  : "Autosaved booking drafts, atomic seat-hold timer, and pre-payment Regret Shield checks (<100ms)."}
              </p>
            </div>
            <div className="mt-auto pt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span>{isHi ? "शून्य-विलंबता पछतावा ढाल" : "Zero-latency sanity checks & single-tap fixes"}</span>
            </div>
          </div>

          {/* Card 3: Recover */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isHi ? "पुनर्प्राप्ति (Recover)" : "Recover"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {isHi
                  ? "भुगतान विफलता बैकअप और तत्काल ऑटो-रिफंड ट्रैकिंग।"
                  : "Multi-gateway payment fallback and transparent instant auto-refund tracker with RBI UTR numbers."}
              </p>
            </div>
            <div className="mt-auto pt-2 text-[11px] font-semibold text-orange-700 flex items-center gap-1">
              <span>{isHi ? "सत्र-रक्षक भुगतान स्विच" : "Session-preserving fallback & refund UTR"}</span>
            </div>
          </div>
        </div>

        {/* Practice Mode Promotion Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {isHi ? "तत्काल अभ्यास मोड (Practice Mode)" : "Rehearse Safely Before the Real Rush"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {isHi
                  ? "60 सेकंड का सुरक्षित सिम्युलेटर — बिना किसी वित्तीय जोखिम के स्कोर और टिप्स पाएं।"
                  : "Run a 60-second simulated Tatkal rush. Zero financial risk, zero PNR, instant ergonomics score."}
              </p>
            </div>
          </div>
          <Link
            href="/practice"
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white text-blue-950 hover:bg-blue-50 font-black text-xs sm:text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>{isHi ? "अभ्यास मोड आज़माएं" : "Try Practice Mode"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: TATKAL TIMINGS AND RULES (Table Sourced from Config)          */}
      {/* ========================================================================= */}
      <section aria-labelledby="tatkal-rules-heading" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{isHi ? "आधिकारिक नियम एवं समय" : "Official IRCTC Rules & Guidelines"}</span>
            </div>
            <h2
              id="tatkal-rules-heading"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
            >
              {isHi ? "तत्काल समय और नियम" : "Tatkal Timings and Rules"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isHi ? "नियम अंतिम बार सत्यापित:" : "Rules last verified:"}{" "}
            <strong className="text-slate-800">{lastVerifiedDate}</strong>.{" "}
            {isHi ? "आधिकारिक भारतीय रेल नियम प्रभावी हैं।" : "Official Indian Railways rules prevail."}
          </p>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 sm:px-6">{isHi ? "श्रेणी / नियम" : "Rule & Parameter"}</th>
                  <th className="py-3 px-4 sm:px-6">{isHi ? "आधिकारिक प्रावधान" : "Official Regulation"}</th>
                  <th className="py-3 px-4 sm:px-6">{isHi ? "स्रोत संदर्भ" : "Verified Source Reference"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {/* Rule 1: Window Timings */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{isHi ? "बुकिंग विंडो समय" : "Tatkal Window Timings"}</span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                    <span className="font-semibold text-slate-900">AC Classes open at 10:00 AM</span>;{" "}
                    <span className="font-semibold text-slate-900">Non-AC (Sleeper) open at 11:00 AM</span>, exactly one day before the journey date from train origin.
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-xs">
                    {windowRule?.source_note || "IRCTC Tatkal Booking Timings Schedule"}
                  </td>
                </tr>

                {/* Rule 2: Max Passengers */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{isHi ? "अधिकतम यात्री सीमा" : "Passenger Quota Limit"}</span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                    A <span className="font-semibold text-slate-900">maximum of 4 passengers</span> is permitted per Tatkal PNR. Larger groups require automated group partition.
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-xs">
                    {maxPaxRule?.source_note || "Railway Board Commercial Circular No. 59/2015"}
                  </td>
                </tr>

                {/* Rule 3: Photo ID Requirement */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{isHi ? "अनिवार्य पहचान प्रमाण" : "Mandatory Photo ID Proof"}</span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                    At least <span className="font-semibold text-slate-900">one passenger must carry an original government-approved photo ID</span> during journey (Aadhaar, Passport, PAN, Voter ID, Driving Licence).
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-xs">
                    {idRule?.source_note || "IRCTC Compulsory Photo ID Notice 2012"}
                  </td>
                </tr>

                {/* Rule 4: Non-Refundable Policy */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{isHi ? "रिफंड नीति (Non-Refundable)" : "Non-Refundable Cancellation"}</span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                    <span className="font-semibold text-rose-700">Confirmed Tatkal tickets are non-refundable</span> upon cancellation. Limited exceptions apply only if the train is cancelled or delayed by over 3 hours (TDR required).
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono text-xs">
                    {refundRule?.source_note || "Indian Railways Passenger Fare & Refund Rules 2015"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: TRUST AND SAFETY (Anti-Scam Security Tips & Demo Notice)      */}
      {/* ========================================================================= */}
      <section aria-labelledby="trust-safety-heading" className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHi ? "धोखाधड़ी से बचाव एवं सुरक्षा" : "Security & Anti-Scam Advisory"}</span>
            </div>
            <h2
              id="trust-safety-heading"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
            >
              {isHi ? "विश्वास और सुरक्षा" : "Trust and Safety"}
            </h2>
          </div>

          {onOpenScamModal ? (
            <button
              type="button"
              onClick={onOpenScamModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>{isHi ? "स्कैम अलर्ट एडवाइजरी पढ़ें" : "View Scam Advisory"}</span>
              <ExternalLink className="w-3 h-3 text-amber-600 ml-0.5" />
            </button>
          ) : (
            <Link
              href="/"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>{isHi ? "स्कैम अलर्ट एडवाइजरी पढ़ें" : "View Scam Advisory"}</span>
            </Link>
          )}
        </div>

        {/* 4 Security Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {isHi ? "ओटीपी या पिन कभी साझा न करें" : "Never Share OTP or PIN"}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isHi
                ? "भुगतान शीट के बाहर कभी भी ओटीपी या यूपीआई पिन साझा न करें।"
                : "Never share an OTP or UPI PIN outside the verified payment gateway sheet. Railway agents never request PINs."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ExternalLink className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {isHi ? "वेबसाइट का पता जांचें" : "Verify Website Address"}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isHi
                ? "हमेशा आधिकारिक यूआरएल और सुरक्षित एचटीटीपीएस ताला चिह्न की पुष्टि करें।"
                : "Always check the URL in your browser address bar. Beware of deceptive phishing domains mimicking IRCTC."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {isHi ? "अनचाहे यूपीआई अनुरोध से सावधान" : "Unsolicited UPI Requests"}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isHi
                ? "अज्ञात कलेक्ट अनुरोध स्वीकार न करें — यूपीआई पिन दर्ज करने से पैसे कटते हैं।"
                : "Be careful with unsolicited UPI collect requests. Entering your UPI PIN always debits funds from your account."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {isHi ? "कार्ड विवरण सुरक्षा" : "Zero External Card Requests"}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isHi
                ? "तात्काल प्रो भुगतान शीट के बाहर कभी भी कार्ड विवरण नहीं मांगता।"
                : "TatkalPro never asks for debit or credit card details outside the secure payment gateway sheet."}
            </p>
          </div>
        </div>

        {/* Clear Mandatory Demo Notice */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-[#92400E]">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="block text-amber-950 font-bold mb-0.5">
              {isHi ? "आधिकारिक कानूनी अस्वीकरण" : "Important Legal & Simulation Notice"}
            </strong>
            <p>
              TatkalPro is a demo on simulated data. No real booking, PNR or payment. Not affiliated with IRCTC or Indian Railways.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeInfoSections;

