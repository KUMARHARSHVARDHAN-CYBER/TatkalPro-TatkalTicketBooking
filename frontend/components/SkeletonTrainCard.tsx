"use client";

import React from "react";

export const SkeletonTrainCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs animate-pulse flex flex-col gap-4">
      {/* Header bar placeholder */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-44 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-24 bg-slate-100 rounded-full"></div>
        </div>
        <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
      </div>

      {/* Schedule Timeline Grid Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-1">
        {/* Departure */}
        <div className="md:col-span-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-200"></div>
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-6 w-20 bg-slate-200 rounded"></div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
        </div>

        {/* Center Line */}
        <div className="md:col-span-4 flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-16 bg-slate-200 rounded"></div>
          <div className="w-full h-1 bg-slate-200 rounded-full"></div>
          <div className="h-2.5 w-24 bg-slate-100 rounded"></div>
        </div>

        {/* Arrival */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3">
          <div className="flex flex-col items-start md:items-end gap-1.5 flex-1">
            <div className="h-6 w-20 bg-slate-200 rounded"></div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-200"></div>
        </div>
      </div>

      {/* Class Availability Pills Placeholder */}
      <div className="border-t border-slate-100 pt-3 flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[140px] p-3 rounded-xl bg-slate-100 flex flex-col gap-2"
          >
            <div className="flex justify-between">
              <div className="h-4 w-10 bg-slate-200 rounded"></div>
              <div className="h-4 w-12 bg-slate-200 rounded"></div>
            </div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
            <div className="h-5 w-full bg-slate-200 rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonTrainCard;
