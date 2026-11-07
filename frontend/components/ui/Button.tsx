"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText = "Please wait...",
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      ...props
    },
    ref
  ) => {
    // Base styles matching Figma: 44px min controls, 8px grid, Inter font, 12px radii
    const baseClasses =
      "inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl select-none focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed";

    // Height / Sizing variants
    const sizeClasses = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2 min-h-[44px]", // Exact 44px min tap target
      lg: "h-12 px-6 text-base gap-2.5 min-h-[48px]",
    }[size];

    // Figma Variant specifications
    const variantClasses = {
      primary:
        "bg-[#F97316] hover:bg-[#EA580C] active:bg-[#C2410C] text-white shadow-sm hover:shadow focus:ring-orange-300 disabled:bg-[#FED7AA] disabled:text-white/80 disabled:shadow-none",
      secondary:
        "bg-white hover:bg-blue-50/70 active:bg-blue-100 text-[#2563EB] border border-[#2563EB] shadow-2xs hover:border-[#1D4ED8] focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200",
      ghost:
        "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 focus:ring-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent",
    }[variant];

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

