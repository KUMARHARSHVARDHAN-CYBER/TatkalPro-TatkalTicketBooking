"use client";

import React from "react";
import { Check, Search, Users, FileText, CreditCard, Ticket } from "lucide-react";

export type BookingStep = "SEARCH" | "PASSENGERS" | "REVIEW" | "PAYMENT" | "TICKET";

interface StepperProgressProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
}

const STEPS: { id: BookingStep; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "SEARCH", label: "Search", icon: Search },
  { id: "PASSENGERS", label: "Passengers", icon: Users },
  { id: "REVIEW", label: "Review", icon: FileText },
  { id: "PAYMENT", label: "Pay", icon: CreditCard },
  { id: "TICKET", label: "Ticket", icon: Ticket },
];

export const StepperProgress: React.FC<StepperProgressProps> = ({ currentStep, onStepClick }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-2xs py-3.5 px-4 select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex || currentStep === "TICKET";
          const isCurrent = idx === currentIndex && currentStep !== "TICKET";

          return (
            <React.Fragment key={step.id}>
              {/* Step Pill */}
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => onStepClick && isCompleted && onStepClick(step.id)}
                className={`flex items-center gap-2 group transition-all text-left ${
                  isCompleted ? "cursor-pointer hover:opacity-85" : isCurrent ? "cursor-default" : "opacity-45 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400 border border-slate-300"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span
                    className={`text-xs font-extrabold leading-tight ${
                      isCurrent ? "text-[#2563EB]" : isCompleted ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>

              {/* Connecting Line matching Figma specimen */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    idx < currentIndex ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepperProgress;
