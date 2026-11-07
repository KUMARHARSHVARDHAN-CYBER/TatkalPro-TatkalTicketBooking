"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  Lock,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
} from "lucide-react";
import { BotShieldMetrics, botShieldService } from "../lib/railway/botShield";

interface AdminBotShieldDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBotShieldDashboard: React.FC<AdminBotShieldDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<BotShieldMetrics>(() => botShieldService.getTelemetryMetrics());
  const [activeTab, setActiveTab] = useState<"FLAGGED" | "THRESHOLDS" | "QUEUE">("FLAGGED");
  const [filterQuery, setFilterQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const refreshData = () => {
    setMetrics(botShieldService.getTelemetryMetrics());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBlock = (val: string) => {
    botShieldService.blockEntity(val, "Blocked by Administrator via Bot Shield console");
    refreshData();
    setStatusMessage(`Entity ${val} has been blocked.`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleAllowlist = (val: string) => {
    botShieldService.allowlistEntity(val);
    refreshData();
    setStatusMessage(`Entity ${val} added to Allow-list.`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleUpdateThreshold = (key: keyof BotShieldMetrics["thresholdSettings"], value: number) => {
    botShieldService.updateThresholds({ [key]: value });
    refreshData();
  };

  const filteredEntities = metrics.flaggedEntities.filter(
    (e) =>
      e.value.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.reason.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Bot Shield Admin Console
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Defensive Rate Limiting & Queue Health Center
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Total Requests Today</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {metrics.totalRequestsToday.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-blue-600 font-bold mt-1 inline-block">Real-time GDS Traffic</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Automated Bots Blocked</span>
              <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                {metrics.blockedRequestsCount.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-rose-600 font-bold mt-1 inline-block">99.4% Precision (Zero False Positives)</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">Waiting Room Queue</span>
              <div className="text-2xl font-black text-orange-600 font-mono mt-1">
                {metrics.activeQueueLength} Users
              </div>
              <span className="text-[10px] text-orange-600 font-bold mt-1 inline-block">5-Min Single-Use Passes Active</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-500">p95 Gateway Latency</span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {metrics.p95LatencyMs} ms
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">Sub-100ms Tatkal SLA Target</span>
            </div>
          </div>

          {/* Risk Score Distribution Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Privacy-Safe Behavioral Risk Distribution</span>
              <span className="text-[11px] text-slate-500">Evaluates ergonomic typing & pointer cadence</span>
            </div>
            
            {/* Multi-segment Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
              <div style={{ width: `${metrics.riskDistribution.low}%` }} className="bg-emerald-500 h-full" title={`Low Risk (Human): ${metrics.riskDistribution.low}%`} />
              <div style={{ width: `${metrics.riskDistribution.medium}%` }} className="bg-amber-400 h-full" title={`Medium Risk (Captcha Required): ${metrics.riskDistribution.medium}%`} />
              <div style={{ width: `${metrics.riskDistribution.high}%` }} className="bg-orange-500 h-full" title={`High Risk (Step-Up OTP): ${metrics.riskDistribution.high}%`} />
              <div style={{ width: `${metrics.riskDistribution.critical}%` }} className="bg-rose-500 h-full" title={`Critical Risk (Blocked): ${metrics.riskDistribution.critical}%`} />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Low / Human ({metrics.riskDistribution.low}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Medium / Captcha ({metrics.riskDistribution.medium}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>High / OTP ({metrics.riskDistribution.high}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical / Blocked ({metrics.riskDistribution.critical}%)</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Flagged Entities vs Thresholds */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab("FLAGGED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "FLAGGED"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flagged Suspicious Activity ({metrics.flaggedEntities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("THRESHOLDS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "THRESHOLDS"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policy Thresholds & Quotas</span>
            </button>
          </div>

          {/* Tab 1: Flagged Entities Table */}
          {activeTab === "FLAGGED" && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter by IP, device fingerprint or detection reason..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Entity / Identifier</th>
                      <th className="py-2.5 px-4">Risk Score</th>
                      <th className="py-2.5 px-4">Detection Signals</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntities.map((entity) => (
                      <tr key={entity.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          <span className="text-[10px] text-slate-400 mr-1.5 font-sans">[{entity.type}]</span>
                          {entity.value}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                              entity.riskScore >= 85
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : entity.riskScore >= 50
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {entity.riskScore} / 100
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{entity.reason}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                              entity.status === "BLOCKED"
                                ? "bg-rose-100 text-rose-800"
                                : entity.status === "ALLOWLISTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {entity.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {entity.status !== "BLOCKED" && (
                              <button
                                onClick={() => handleBlock(entity.value)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                              >
                                Block
                              </button>
                            )}
                            {entity.status !== "ALLOWLISTED" && (
                              <button
                                onClick={() => handleAllowlist(entity.value)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px]"
                              >
                                Allow
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Security Thresholds & Quota Sliders */}
          {activeTab === "THRESHOLDS" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Accessible Captcha Trigger Threshold</span>
                  <span className="font-mono font-bold text-amber-600">{metrics.thresholdSettings.captchaThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={metrics.thresholdSettings.captchaThreshold}
                  onChange={(e) => handleUpdateThreshold("captchaThreshold", Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="text-slate-400 text-[11px]">Requests with risk scores above this trigger audio/visual captcha verification.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Step-Up OTP Challenge Threshold</span>
                  <span className="font-mono font-bold text-orange-600">{metrics.thresholdSettings.otpThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  value={metrics.thresholdSettings.otpThreshold}
                  onChange={(e) => handleUpdateThreshold("otpThreshold", Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <p className="text-slate-400 text-[11px]">Suspicious parallel traffic triggers SMS OTP step-up verification.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Maximum Bookings per Account per 24h</span>
                  <span className="font-mono font-bold text-blue-600">{metrics.thresholdSettings.maxBookingsPerDay} Passengers</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={16}
                  value={metrics.thresholdSettings.maxBookingsPerDay}
                  onChange={(e) => handleUpdateThreshold("maxBookingsPerDay", Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="text-slate-400 text-[11px]">Enforces Railway anti-touting caps to prevent commercial bulk hoarders.</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

