"use client";

import React, { useState } from "react";
import {
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Zap,
  Split,
  Train,
} from "lucide-react";
import { Passenger } from "../../lib/railway/types";
import { GroupSplitCoordinator } from "../../lib/safetyNet/groupSplitCoordinator";
import { GroupSplitPlan, PlanBAlternative } from "../../lib/safetyNet/types";

interface GroupSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengers: Passenger[];
  trainName?: string;
  trainNumber?: string;
  onProceedWithBatch: (batchPassengers: Passenger[]) => void;
}

export const GroupSplitModal: React.FC<GroupSplitModalProps> = ({
  isOpen,
  onClose,
  passengers,
  trainName,
  trainNumber,
  onProceedWithBatch,
}) => {
  const [coachTogether, setCoachTogether] = useState(true);
  const [splitPlan, setSplitPlan] = useState<GroupSplitPlan>(() =>
    GroupSplitCoordinator.splitGroup(passengers, {
      coachTogether: true,
      trainName,
      trainNumber,
    })
  );
  const [partialSuccessNotice, setPartialSuccessNotice] = useState<string | null>(null);
  const [selectedPlanB, setSelectedPlanB] = useState<PlanBAlternative | null>(null);

  if (!isOpen) return null;

  const handleSimulatePartial = () => {
    const res = GroupSplitCoordinator.simulatePartialSuccess(splitPlan);
    setSplitPlan(res.updatedPlan);
    setPartialSuccessNotice(res.recoveryNotice);
    setSelectedPlanB(res.suggestedPlanB);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl border-2 border-slate-900 shadow-2xl flex flex-col overflow-hidden z-10">
        
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-slate-800 bg-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0A3D78] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950 tracking-tight">
                  Tatkal Group Split Coordinator
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full border border-blue-300">
                  {passengers.length} Travellers
                </span>
              </div>
              <p className="text-xs text-blue-900 font-medium">
                Complies with IRCTC 4-Pax Tatkal Limit with Coach-Together Placement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-blue-100 text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[65vh]">
          
          {/* Informational banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Split className="w-4 h-4 text-[#0A3D78]" />
                <span>Auto-Partitioned into {splitPlan.batches.length} Coordinated PNRs</span>
              </div>
              <p className="text-slate-600">
                To prevent booking rejections, groups over 4 passengers are automatically divided into parallel booking batches.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 shrink-0 select-none">
              <input
                type="checkbox"
                checked={coachTogether}
                onChange={(e) => setCoachTogether(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
              />
              <span className="text-[11px]">Same Coach Lock</span>
            </label>
          </div>

          {/* Batches Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Booking Batches &amp; Passenger Allocation
            </h4>

            {splitPlan.batches.map((batch) => (
              <div
                key={batch.batchNumber}
                className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-800 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Batch #{batch.batchNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      PNR: {batch.pnrMock}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        batch.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : batch.status === "WAITLISTED"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      {batch.status === "CONFIRMED"
                        ? "Confirmed (Coach B2)"
                        : batch.status === "WAITLISTED"
                        ? "Waitlisted (WL#2)"
                        : "Ready to Book"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 flex flex-wrap gap-2 pt-0.5">
                    {batch.passengers.map((p, pIdx) => (
                      <span
                        key={p.id || pIdx}
                        className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium"
                      >
                        {p.name} ({p.age}y, {p.gender})
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onProceedWithBatch(batch.passengers);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Book Batch #{batch.batchNumber} ({batch.passengers.length} pax)
                </button>
              </div>
            ))}
          </div>

          {/* Partial Success Notice (Simulated) */}
          {partialSuccessNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Simulated Partial Success &amp; Plan B Recovery
                  </h5>
                  <p className="text-xs text-amber-900 font-medium mt-0.5">
                    {partialSuccessNotice}
                  </p>
                </div>
              </div>

              {/* Plan B Alternatives */}
              <div className="pt-2 border-t border-amber-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                  Recommended Plan B Recovery for Waitlisted Passengers
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {splitPlan.planBAlternatives.map((alt, aIdx) => (
                    <div
                      key={alt.trainNumber}
                      onClick={() => setSelectedPlanB(alt)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        selectedPlanB?.trainNumber === alt.trainNumber
                          ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white/70 border-amber-300 hover:bg-white"
                      }`}
                    >
                      <div className="font-bold text-slate-900 truncate">{alt.trainName}</div>
                      <div className="text-[11px] text-slate-500">{alt.departureTime}</div>
                      <div className="flex items-center justify-between mt-1 text-[11px] font-bold">
                        <span className="text-emerald-700">{alt.availableSeats} seats</span>
                        <span className="text-blue-700">{alt.waitlistProbability}% Conf.</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPlanB && (
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        `Plan B Applied: Booking remaining passengers on ${selectedPlanB.trainName} (${selectedPlanB.trainNumber}) with ${selectedPlanB.waitlistProbability}% confirmation probability!`
                      );
                      onClose();
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Recovery on {selectedPlanB.trainName}</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSimulatePartial}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
          >
            ⚡ Test Partial Success Simulation
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onProceedWithBatch(splitPlan.batches[0].passengers);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#0A3D78] hover:bg-[#072F5E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Prepare All Batches (1-Tap Mode)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GroupSplitModal;

