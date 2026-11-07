"use client";

import React from "react";
import { Search, Ticket, X } from "lucide-react";
import { Button } from "./Button";

// ----------------------------------------------------------------------------
// 1. Empty State
// ----------------------------------------------------------------------------
export type EmptyStateType = "trains" | "trips";

export interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, className = "" }) => {
  if (type === "trains") {
    return (
      <div
        className={`bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-3 shadow-2xs max-w-md mx-auto ${className}`}
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mt-1">No trains for this search</h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Try another date, route or travel class.
        </p>
        <Button variant="secondary" onClick={onAction} className="mt-2">
          Modify search
        </Button>
      </div>
    );
  }

  // Trips empty state
  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-3 shadow-2xs max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
        <Ticket className="w-6 h-6" />
      </div>
      <h3 className="text-base font-extrabold text-slate-900 mt-1">Your journeys start here</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
        Your demo tickets will appear here after booking.
      </p>
      <Button variant="secondary" onClick={onAction} className="mt-2">
        Book a trip
      </Button>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 2. Leave Booking Modal
// ----------------------------------------------------------------------------
export interface LeaveBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
}

export const LeaveBookingModal: React.FC<LeaveBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirmLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">Leave this booking?</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-600 leading-relaxed">
          Your journey details won't be saved. You can start a new search anytime.
        </p>

        {/* Actions matching Figma */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button variant="primary" fullWidth onClick={onClose}>
            Keep booking
          </Button>
          <Button variant="ghost" fullWidth onClick={onConfirmLeave} className="text-[#2563EB]">
            Leave booking
          </Button>
        </div>
      </div>
    </div>
  );
};

