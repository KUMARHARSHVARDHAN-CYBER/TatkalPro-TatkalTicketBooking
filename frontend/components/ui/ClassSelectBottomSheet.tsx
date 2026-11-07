"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "./Button";
import { TravelClassCode } from "../../types";

export interface ClassOption {
  code: TravelClassCode;
  name: string;
}

export interface ClassSelectBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: TravelClassCode;
  onSelectClass: (code: TravelClassCode) => void;
  classes?: ClassOption[];
}

// User specified strict serial order: SL, 3A, 2A, First Class
const DEFAULT_CLASSES: ClassOption[] = [
  { code: "SL", name: "Sleeper · SL" },
  { code: "3A", name: "AC 3 Tier · 3A" },
  { code: "2A", name: "AC 2 Tier · 2A" },
  { code: "1A", name: "First Class · 1A" },
];

export const ClassSelectBottomSheet: React.FC<ClassSelectBottomSheetProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onSelectClass,
  classes = DEFAULT_CLASSES,
}) => {
  const [tempSelected, setTempSelected] = useState<TravelClassCode>(selectedClass);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectClass(tempSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-slate-200 animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Pull handle for mobile */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900">Select travel class</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Radio List matching Figma in Serial SL, 3A, 2A, First Class */}
        <div className="flex flex-col gap-2">
          {classes.map((cls) => {
            const isSelected = tempSelected === cls.code;
            return (
              <label
                key={cls.code}
                onClick={() => setTempSelected(cls.code)}
                className={`min-h-[44px] px-4 py-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                  isSelected
                    ? "border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm">{cls.name}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </label>
            );
          })}
        </div>

        {/* Orange Apply CTA matching Figma */}
        <Button variant="primary" fullWidth onClick={handleApply} className="mt-1">
          Apply class
        </Button>

      </div>
    </div>
  );
};
