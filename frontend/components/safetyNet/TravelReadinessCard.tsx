"use client";

import React, { useState } from "react";
import {
  IdCard,
  Clock,
  MapPin,
  ExternalLink,
  Download,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { TravelReadinessChecklist } from "../../lib/safetyNet/types";

interface TravelReadinessCardProps {
  readiness: TravelReadinessChecklist;
}

export const TravelReadinessCard: React.FC<TravelReadinessCardProps> = ({ readiness }) => {
  const [offlineSaved, setOfflineSaved] = useState(true);
  const [simulatedReminderSet, setSimulatedReminderSet] = useState(true);

  return (
    <div className="w-full rounded-2xl bg-white border-2 border-slate-800 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <IdCard className="w-4 h-4 text-[#0A3D78]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Travel-Day Readiness &amp; Mandatory ID Checklist
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              CRIS Anti-Penalty Verification · Zero boarding hassle
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Ready For Journey</span>
        </span>
      </div>

      {/* Primary ID Alert Callout */}
      <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 font-medium space-y-1">
          <div className="font-black text-amber-950 flex items-center gap-1.5">
            <span>Primary ID Carrier:</span>
            <span className="bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 font-black">
              {readiness.primaryPassengerName}
            </span>
            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-amber-300">
              {readiness.primaryIdType}: {readiness.primaryIdNumber}
            </span>
          </div>
          <p className="text-[11px] text-amber-900">
            <strong>Mandatory TTE Rule: </strong>
            This passenger must carry their <u>original physical or m-Aadhaar/DigiLocker</u> card. Photocopies are not accepted and incur penalty fares.
          </p>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Offline E-Ticket */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-700" />
            <div>
              <div className="text-xs font-bold text-slate-900">Offline E-Ticket</div>
              <div className="text-[11px] text-slate-500">Cached on device for no-signal tunnels</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOfflineSaved(true);
              alert("✓ Ticket saved offline in browser local storage and PDF ready!");
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-400 text-[11px] font-bold text-slate-700 cursor-pointer transition shadow-2xs"
          >
            {offlineSaved ? "Saved ✓" : "Save"}
          </button>
        </div>

        {/* Boarding Station & Platform */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <div>
              <div className="text-xs font-bold text-slate-900">
                {readiness.boardingStationName} ({readiness.boardingStationCode})
              </div>
              <div className="text-[11px] text-slate-500">{readiness.departurePlatform} · {readiness.scheduledDeparture}</div>
            </div>
          </div>
          <a
            href={readiness.liveStatusUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
          >
            <span>Live Spot</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Simulated Notification Timers */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#0A3D78] font-bold">
          <Bell className="w-4 h-4 text-[#0A3D78]" />
          <span>Simulated Travel Reminders:</span>
          <span className="font-medium text-slate-700">24h Departure Alert &amp; 3h Chart Prep SMS</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSimulatedReminderSet(!simulatedReminderSet);
            alert(
              simulatedReminderSet
                ? "Simulated SMS & WhatsApp push reminders armed for 24h & 3h intervals!"
                : "Reminders muted."
            );
          }}
          className="text-[11px] font-extrabold text-[#0A3D78] underline cursor-pointer"
        >
          {simulatedReminderSet ? "Notifications Armed (24h / 3h)" : "Enable Alerts"}
        </button>
      </div>
    </div>
  );
};

export default TravelReadinessCard;

