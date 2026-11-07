"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  X,
  CheckCircle2,
  Sliders,
  RotateCcw,
  AlertTriangle,
  Info,
  Calendar,
  ExternalLink,
  Save,
  Check,
} from "lucide-react";
import { SafetyRulesEngine } from "../../lib/safetyNet/rulesEngine";
import { SafetyRule, RuleSeverity } from "../../lib/safetyNet/types";

interface SafetyNetAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyNetAdminModal: React.FC<SafetyNetAdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rules, setRules] = useState<SafetyRule[]>(() => SafetyRulesEngine.getRules());
  const [stats, setStats] = useState(() => SafetyRulesEngine.getTelemetryStats());
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleToggleRule = (ruleId: string) => {
    const r = rules.find((item) => item.id === ruleId);
    if (!r) return;
    const updated = SafetyRulesEngine.updateRule(ruleId, { enabled: !r.enabled });
    if (updated) {
      setRules([...SafetyRulesEngine.getRules()]);
      flashSaved();
    }
  };

  const handleSeverityChange = (ruleId: string, severity: RuleSeverity) => {
    const updated = SafetyRulesEngine.updateRule(ruleId, { severity });
    if (updated) {
      setRules([...SafetyRulesEngine.getRules()]);
      flashSaved();
    }
  };

  const handleReset = () => {
    SafetyRulesEngine.resetRules();
    setRules([...SafetyRulesEngine.getRules()]);
    flashSaved();
  };

  const flashSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl border-2 border-slate-900 shadow-2xl flex flex-col overflow-hidden z-10">
        
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-slate-800 bg-[#0A3D78] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center border border-white/20">
              <Sliders className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  Tatkal Safety Net: Rules &amp; Telemetry Admin
                </h3>
                {savedNotice && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Dynamic Rules Engine · Configurable without redeployment · Official IRCTC Benchmarks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Stats Bar */}
        <div className="bg-slate-50 border-b-2 border-slate-200 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-lg font-black text-slate-900">{stats.warningsShownCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Warnings Shown</div>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-lg font-black text-emerald-700">{stats.warningsFixedCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500">1-Tap Fixed</div>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-lg font-black text-amber-700">{stats.warningsIgnoredCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500">User Ignored</div>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300">
            <div className="text-lg font-black text-emerald-900">
              {stats.mistakesPreventedCount}
            </div>
            <div className="text-[10px] uppercase font-black text-emerald-800">
              Mistakes Prevented
            </div>
          </div>
        </div>

        {/* Rules Editor List */}
        <div className="p-5 overflow-y-auto space-y-3.5 max-h-[55vh]">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Active Booking Safety Rules ({rules.filter((r) => r.enabled).length}/{rules.length} Enabled)
            </h4>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-2xl border-2 transition ${
                rule.enabled
                  ? "bg-white border-slate-300 hover:border-slate-800 shadow-2xs"
                  : "bg-slate-100 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{rule.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {rule.id}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Source: <em>{rule.source_note}</em> · Last verified: <strong>{rule.last_verified}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Severity dropdown */}
                  <select
                    value={rule.severity}
                    onChange={(e) => handleSeverityChange(rule.id, e.target.value as RuleSeverity)}
                    disabled={!rule.enabled}
                    className="text-xs font-black rounded-lg border border-slate-300 px-2 py-1 bg-white cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule.id)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                      rule.enabled ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left">
            <strong>Rules last verified: 04 Nov 2026</strong> • Official Indian Railways (IRCTC/CRIS) rules prevail.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default SafetyNetAdminModal;

