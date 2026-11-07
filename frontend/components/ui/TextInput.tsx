"use client";

import React, { forwardRef } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string | boolean;
  success?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const isError = Boolean(error);
    const isSuccess = Boolean(success) && !isError;

    // Status styling based on Figma spec
    let borderAndRingClasses =
      "border-slate-200 hover:border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-slate-900";

    if (isError) {
      borderAndRingClasses =
        "border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";
    } else if (isSuccess) {
      borderAndRingClasses =
        "border-emerald-400 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
    }

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`text-xs font-bold leading-none ${
              isError ? "text-rose-700" : "text-slate-700"
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full h-11 min-h-[44px] bg-white border rounded-xl text-sm transition-all outline-none font-medium ${
              leftIcon ? "pl-10" : "pl-3.5"
            } ${rightIcon || isSuccess || isError ? "pr-10" : "pr-3.5"} ${borderAndRingClasses} ${className}`}
            {...props}
          />

          <div className="absolute right-3.5 flex items-center pointer-events-none">
            {isError ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              rightIcon
            )}
          </div>
        </div>

        {/* Helper / Validation message */}
        {(isError || isSuccess || helperText) && (
          <p
            className={`text-xs leading-normal font-medium ${
              isError
                ? "text-rose-600"
                : isSuccess
                ? "text-emerald-700 font-semibold"
                : "text-slate-500"
            }`}
          >
            {typeof error === "string"
              ? error
              : typeof success === "string"
              ? success
              : helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;

