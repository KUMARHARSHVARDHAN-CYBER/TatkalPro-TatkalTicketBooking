"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[TatkalPro Component Error Caught]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl bg-[#0c1a30] border border-amber-500/40 p-6 text-center flex flex-col items-center gap-3 my-4">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <h4 className="text-sm font-bold text-white">
            {this.props.fallbackTitle || "Component Failed to Load"}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm">
            {this.state.error?.message || "An isolated rendering error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

