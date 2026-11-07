"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, RotateCcw } from "lucide-react";

// ----------------------------------------------------------------------------
// 1. Toast Notification
// ----------------------------------------------------------------------------
export type ToastType = "success" | "error" | "undo";

export interface ToastProps {
  type: ToastType;
  message: string;
  onUndo?: () => void;
  undoLabel?: string;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onUndo,
  undoLabel = "Undo",
  className = "",
}) => {
  if (type === "undo") {
    return (
      <div
        className={`bg-slate-900 text-white shadow-2xl px-4 py-3 rounded-2xl flex items-center justify-between gap-4 border border-slate-800 text-sm font-medium ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw className="w-4 h-4 text-slate-300 shrink-0" />
          <span>{message}</span>
        </div>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-wider cursor-pointer transition hover:underline"
          >
            {undoLabel}
          </button>
        )}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div
        className={`bg-white border border-rose-200 text-rose-900 shadow-xl px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium ${className}`}
      >
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  // Success default
  return (
    <div
      className={`bg-white border border-emerald-200 text-emerald-900 shadow-xl px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium ${className}`}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 2. Status Banner
// ----------------------------------------------------------------------------
export type BannerType = "info" | "success" | "error";

export interface StatusBannerProps {
  type: BannerType;
  title: string;
  description?: string;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type,
  title,
  description,
  className = "",
}) => {
  const configs = {
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-950",
      icon: <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-950",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-950",
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${configs.bg} ${className}`}
    >
      {configs.icon}
      <div className="flex flex-col">
        <strong className="font-bold text-[13px]">{title}</strong>
        {description && <span className="text-slate-600 mt-0.5">{description}</span>}
      </div>
    </div>
  );
};

