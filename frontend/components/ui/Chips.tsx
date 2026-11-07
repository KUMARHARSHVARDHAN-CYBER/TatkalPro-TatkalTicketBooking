"use client";

import React from "react";
import { Check } from "lucide-react";

// ----------------------------------------------------------------------------
// 1. Class Selection Chip
// ----------------------------------------------------------------------------
export interface ClassChipProps {
  label: string;
  code: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ClassChip: React.FC<ClassChipProps> = ({
  label,
  code,
  selected = false,
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
        selected
          ? "bg-blue-50 border-[#2563EB] text-[#2563EB] ring-2 ring-blue-100 shadow-2xs"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {selected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#2563EB]" />}
      <span>{code}</span>
      {label && <span className="text-xs font-normal opacity-70">({label})</span>}
    </button>
  );
};

// ----------------------------------------------------------------------------
// 2. Quota Selection Chip
// ----------------------------------------------------------------------------
export interface QuotaChipProps {
  label: string;
  code: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const QuotaChip: React.FC<QuotaChipProps> = ({
  label,
  code,
  selected = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
        selected
          ? "bg-blue-50 border-[#2563EB] text-[#2563EB] ring-2 ring-blue-100 shadow-2xs"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      } ${className}`}
    >
      {selected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#2563EB]" />}
      <span>{label}</span>
    </button>
  );
};

// ----------------------------------------------------------------------------
// 3. Availability Status Chip
// ----------------------------------------------------------------------------
export type AvailabilityStatus = "AVAILABLE" | "RAC" | "WL" | "REGRET" | "STANDBY";

export interface AvailabilityChipProps {
  status: AvailabilityStatus;
  seatCount?: number;
  label?: string;
  className?: string;
}

export const AvailabilityChip: React.FC<AvailabilityChipProps> = ({
  status,
  seatCount,
  label,
  className = "",
}) => {
  if (status === "AVAILABLE") {
    const text = label || (seatCount !== undefined ? `Available ${seatCount}` : "Available");
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>{text}</span>
      </span>
    );
  }

  if (status === "RAC" || status === "WL") {
    const text =
      label ||
      (status === "RAC"
        ? `RAC ${seatCount !== undefined ? String(seatCount).padStart(2, "0") : ""}`
        : `WL ${seatCount || ""}`);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>{text}</span>
      </span>
    );
  }

  if (status === "REGRET") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        <span>{label || "Not Available"}</span>
      </span>
    );
  }

  // Standby / Alert fallback
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
      <span>{label || "Standby / Alert"}</span>
    </span>
  );
};

