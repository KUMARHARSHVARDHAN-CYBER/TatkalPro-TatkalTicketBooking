"use client";

import React from "react";

export const SkeletonTrainCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-[#0c1a30]/80 border border-slate-800 p-5 sm:p-6 shadow-xl animate-pulse flex flex-col gap-5">
      {/* Header bar placeholder */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-44 bg-slate-800 rounded-md"></div>
          <div className="h-4 w-16 bg-slate-800/80 rounded-md"></div>
          <div className="h-4 w-24 bg-slate-800/60 rounded-full"></div>
        </div>
        <div className="h-4 w-28 bg-slate-800/60 rounded-md"></div>
      </div>

      {/* Schedule Timeline Grid Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-2">
        {/* Departure */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80"></div>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-6 w-20 bg-slate-800 rounded"></div>
            <div className="h-4 w-32 bg-slate-800/70 rounded"></div>
            <div className="h-3 w-20 bg-slate-800/50 rounded"></div>
          </div>
        </div>

        {/* Center Line */}
        <div className="md:col-span-4 flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-16 bg-slate-800 rounded"></div>
          <div className="w-full h-1 bg-slate-800 rounded-full"></div>
          <div className="h-2.5 w-24 bg-slate-800/50 rounded"></div>
        </div>

        {/* Arrival */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3">
          <div className="flex flex-col items-start md:items-end gap-1.5 flex-1">
            <div className="h-6 w-20 bg-slate-800 rounded"></div>
            <div className="h-4 w-32 bg-slate-800/70 rounded"></div>
            <div className="h-3 w-20 bg-slate-800/50 rounded"></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800/80"></div>
        </div>
      </div>

      {/* Class Availability Pills Placeholder */}
      <div className="border-t border-slate-800/80 pt-4 flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[150px] p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 flex flex-col gap-2"
          >
            <div className="flex justify-between">
              <div className="h-3.5 w-8 bg-slate-800 rounded"></div>
              <div className="h-3.5 w-14 bg-slate-800 rounded"></div>
            </div>
            <div className="h-2.5 w-20 bg-slate-800/60 rounded"></div>
            <div className="h-4 w-full bg-slate-800/40 rounded mt-1"></div>
          </div>
        ))}
      </div>

      {/* Bottom CTA bar placeholder */}
      <div className="flex items-center justify-between pt-3">
        <div className="h-4 w-36 bg-slate-800 rounded"></div>
        <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
};

export default SkeletonTrainCard;
