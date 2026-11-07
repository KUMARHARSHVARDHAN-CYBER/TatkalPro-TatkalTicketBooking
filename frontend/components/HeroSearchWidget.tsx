"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeftRight,
  Calendar,
  MapPin,
  ChevronDown,
  Search,
  ArrowRight,
  Edit3,
  Users,
  Plus,
  Minus,
} from "lucide-react";
import { POPULAR_STATIONS } from "../lib/mock-data";
import { QuotaType, SearchQueryParams, TravelClassCode } from "../types";
import { Button } from "./ui/Button";
import { QuotaChip } from "./ui/Chips";
import { ClassSelectBottomSheet } from "./ui/ClassSelectBottomSheet";
import { formatDisplayDate } from "../lib/dateUtils";

interface HeroSearchWidgetProps {
  onSearch: (params: SearchQueryParams) => void;
  isLoading: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
  currentParams?: SearchQueryParams;
  passengerCount?: number;
  onPassengerCountChange?: (count: number) => void;
}

export const HeroSearchWidget: React.FC<HeroSearchWidgetProps> = ({
  onSearch,
  isLoading,
  isCollapsed = false,
  onExpand,
  currentParams,
  passengerCount = 1,
  onPassengerCountChange,
}) => {
  const [fromCode, setFromCode] = useState<string>(currentParams?.fromStation || "NDLS");
  const [toCode, setToCode] = useState<string>(currentParams?.toStation || "MMCT");
  const [fromSearchQuery, setFromSearchQuery] = useState<string>("");
  const [toSearchQuery, setToSearchQuery] = useState<string>("");

  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const [journeyDate, setJourneyDate] = useState<string>(() => {
    if (currentParams?.journeyDate) return currentParams.journeyDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [quota, setQuota] = useState<QuotaType>((currentParams?.quota as QuotaType) || "TATKAL");
  const [selectedClass, setSelectedClass] = useState<TravelClassCode>(
    (currentParams?.selectedClass as TravelClassCode) || "SL"
  );
  const [isClassSheetOpen, setIsClassSheetOpen] = useState<boolean>(false);

  // Sync with currentParams if provided from external state / URL
  useEffect(() => {
    if (currentParams) {
      if (currentParams.fromStation) setFromCode(currentParams.fromStation);
      if (currentParams.toStation) setToCode(currentParams.toStation);
      if (currentParams.journeyDate) setJourneyDate(currentParams.journeyDate);
      if (currentParams.quota) setQuota(currentParams.quota as QuotaType);
      if (currentParams.selectedClass) setSelectedClass(currentParams.selectedClass as TravelClassCode);
    }
  }, [currentParams]);

  // Autocomplete Dropdown States
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  const fromStation = POPULAR_STATIONS.find((s) => s.code === fromCode) || {
    code: fromCode,
    name: "New Delhi",
    city: "Delhi",
  };
  const toStation = POPULAR_STATIONS.find((s) => s.code === toCode) || {
    code: toCode,
    name: "Mumbai Central",
    city: "Mumbai",
  };

  // Swap Stations Handler
  const handleSwapStations = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  // Filtered stations for autosuggest
  const filteredFromStations = POPULAR_STATIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(fromSearchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(fromSearchQuery.toLowerCase())
  );

  const filteredToStations = POPULAR_STATIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(toSearchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(toSearchQuery.toLowerCase())
  );

  // Submit Handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsFromOpen(false);
    setIsToOpen(false);
    onSearch({
      fromStation: fromCode,
      toStation: toCode,
      journeyDate,
      quota,
      selectedClass,
    });
  };

  const getClassDisplayName = (cls: TravelClassCode) => {
    switch (cls) {
      case "SL":
        return "Sleeper (SL)";
      case "3A":
        return "AC 3 Tier (3A)";
      case "2A":
        return "AC 2 Tier (2A)";
      case "1A":
        return "First Class (1A)";
      case "CC":
        return "AC Chair Car (CC)";
      case "EC":
        return "Exec Chair Car (EC)";
      default:
        return cls;
    }
  };

  return (
    <div
      className={`relative w-full border-b border-slate-200 overflow-hidden bg-[#0B1528] transition-all duration-250 ease-out ${
        isCollapsed
          ? "py-3 sm:py-4 min-h-[96px] sm:min-h-[110px]"
          : "min-h-[calc(100svh-var(--header-height,64px))] flex flex-col justify-center items-center py-3 sm:py-10"
      }`}
    >
      {/* Background Image: Vande Bharat Express edge-to-edge full bleed with next/image */}
      <div className="absolute inset-0 bg-[#0B1528] overflow-hidden">
        <Image
          src="/vande-bharat-bg.jpg"
          alt="Vande Bharat Express Train"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        {/* WCAG AA Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/65 to-slate-950/90 backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* State A: Collapsed Summary Bar (Slim Banner mode) */}
        {isCollapsed ? (
          <div className="w-full max-w-5xl rounded-2xl bg-white/95 backdrop-blur-md border border-white/50 px-4 py-2.5 sm:py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight font-mono">
                  {fromStation.code}
                </span>
                <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight font-mono">
                  {toStation.code}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{formatDisplayDate(journeyDate)}</span>
                </span>
                <span className="text-slate-400">·</span>
                <span>{getClassDisplayName(selectedClass)}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {quota}
                </span>
                <span className="text-slate-400">·</span>
                {/* Passenger Stepper with max 4 limit & friendly message */}
                <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-300 rounded-lg px-2 py-0.5 text-xs text-slate-800">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold">
                    {passengerCount} {passengerCount === 1 ? "passenger" : "passengers"}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (passengerCount > 1) onPassengerCountChange?.(passengerCount - 1);
                      }}
                      disabled={passengerCount <= 1}
                      className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                      aria-label="Decrease passenger count"
                      title="Decrease passengers"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (passengerCount < 4) onPassengerCountChange?.(passengerCount + 1);
                      }}
                      disabled={passengerCount >= 4}
                      className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                      aria-label="Increase passenger count"
                      title={passengerCount >= 4 ? "Max 4 passengers per Tatkal ticket" : "Increase passengers"}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {passengerCount >= 4 && (
                    <span className="text-[10px] text-amber-700 font-bold ml-1 hidden lg:inline" title="Indian Railways limits Tatkal bookings to a maximum of 4 passengers per PNR">
                      (Max 4 per Tatkal ticket)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onExpand}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-bold text-xs sm:text-sm border border-blue-200 transition flex items-center gap-1.5 cursor-pointer ml-auto"
              aria-label="Edit search parameters"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        ) : (
          /* State B: Full Floating Search Card */
          <>
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mb-2.5 sm:mb-6">
              <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                Tatkal Train Ticket Booking
              </h1>
            </div>

            {/* Floating Search Card */}
            <div className="w-full max-w-5xl rounded-3xl bg-white/95 backdrop-blur-md border border-white/40 p-3.5 sm:p-6 shadow-2xl relative">
              {/* Quota Chips matching Figma 03 specimen */}
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-4 mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <QuotaChip
                    label="General"
                    code="GENERAL"
                    selected={quota === "GENERAL"}
                    onClick={() => setQuota("GENERAL")}
                  />
                  <QuotaChip
                    label="Tatkal"
                    code="TATKAL"
                    selected={quota === "TATKAL"}
                    onClick={() => setQuota("TATKAL")}
                  />
                  <QuotaChip
                    label="Premium Tatkal"
                    code="PREMIUM_TATKAL"
                    selected={quota === "PREMIUM_TATKAL"}
                    onClick={() => setQuota("PREMIUM_TATKAL")}
                  />
                  <QuotaChip
                    label="Ladies"
                    code="LADIES"
                    selected={quota === "LADIES"}
                    onClick={() => setQuota("LADIES")}
                  />
                </div>

                {/* Dynamic Specimen helper text following selected route & date */}
                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Sample route: {fromStation.code} → {toStation.code} • {formatDisplayDate(journeyDate)}
                </div>
              </div>

              {/* Form Inputs Grid matching Figma 02 specimen */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 relative items-center">
                  {/* FROM STATION (Col 5) */}
                  <div className="lg:col-span-5 relative">
                    <div
                      onClick={() => {
                        setIsFromOpen(!isFromOpen);
                        setIsToOpen(false);
                        setFromSearchQuery("");
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-2.5 sm:p-3.5 cursor-pointer transition flex items-center gap-3 group min-h-[44px]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          From Station
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {fromStation.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {fromStation.code}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                    </div>

                    {/* Station Autosuggest Dropdown matching Figma 02 specimen */}
                    {isFromOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 flex flex-col gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="New Delhi"
                            value={fromSearchQuery}
                            onChange={(e) => setFromSearchQuery(e.target.value)}
                            autoFocus
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                          {filteredFromStations.length > 0 ? (
                            filteredFromStations.map((stn) => (
                              <button
                                key={stn.code}
                                type="button"
                                onClick={() => {
                                  setFromCode(stn.code);
                                  setIsFromOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 transition flex items-center justify-between text-xs cursor-pointer min-h-[44px]"
                              >
                                <div>
                                  <div className="font-bold text-slate-800">{stn.name}</div>
                                  <div className="text-[11px] text-slate-400">{stn.city}</div>
                                </div>
                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {stn.code}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-xs font-bold text-slate-800">No station found</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Try a city name or station code.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SWAP BUTTON (Col 2 on large screens, center absolute) */}
                  <div className="lg:col-span-2 flex justify-center -my-2 lg:my-0 z-20">
                    <button
                      type="button"
                      onClick={handleSwapStations}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition flex items-center justify-center shadow-xs cursor-pointer min-h-[44px] min-w-[44px]"
                      aria-label="Swap departure and arrival stations"
                      title="Swap Stations"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* TO STATION (Col 5) */}
                  <div className="lg:col-span-5 relative">
                    <div
                      onClick={() => {
                        setIsToOpen(!isToOpen);
                        setIsFromOpen(false);
                        setToSearchQuery("");
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-2.5 sm:p-3.5 cursor-pointer transition flex items-center gap-3 group min-h-[44px]"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          To Station
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {toStation.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                            {toStation.code}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                    </div>

                    {/* Station Autosuggest Dropdown matching Figma 02 specimen */}
                    {isToOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 flex flex-col gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Mumbai Central"
                            value={toSearchQuery}
                            onChange={(e) => setToSearchQuery(e.target.value)}
                            autoFocus
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                          {filteredToStations.length > 0 ? (
                            filteredToStations.map((stn) => (
                              <button
                                key={stn.code}
                                type="button"
                                onClick={() => {
                                  setToCode(stn.code);
                                  setIsToOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 transition flex items-center justify-between text-xs cursor-pointer min-h-[44px]"
                              >
                                <div>
                                  <div className="font-bold text-slate-800">{stn.name}</div>
                                  <div className="text-[11px] text-slate-400">{stn.city}</div>
                                </div>
                                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                  {stn.code}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-xs font-bold text-slate-800">No station found</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Try a city name or station code.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Journey Date, Travel Class, and Big CTA Button */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 items-center pt-1">
                  {/* Date Input */}
                  <div className="col-span-1 sm:col-span-4 bg-white border border-slate-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 min-h-[44px]">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 block truncate">
                        Journey Date
                      </span>
                      <input
                        type="date"
                        required
                        value={journeyDate}
                        onChange={(e) => setJourneyDate(e.target.value)}
                        className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer min-h-[26px]"
                      />
                    </div>
                  </div>

                  {/* Travel Class Trigger matching Figma Bottom Sheet */}
                  <div
                    onClick={() => setIsClassSheetOpen(true)}
                    className="col-span-1 sm:col-span-3 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between cursor-pointer min-h-[44px]"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 block truncate">
                        Travel Class
                      </span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                        {getClassDisplayName(selectedClass)}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                  </div>

                  {/* Main Orange Action Button */}
                  <div className="col-span-2 sm:col-span-5">
                    <Button
                      ref={searchButtonRef}
                      variant="primary"
                      type="submit"
                      fullWidth
                      isLoading={isLoading}
                      loadingText="Searching Trains..."
                      className="h-11 sm:h-12 text-sm sm:text-base tracking-wide min-h-[44px]"
                    >
                      Search trains
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Class Selection Bottom Sheet */}
      <ClassSelectBottomSheet
        isOpen={isClassSheetOpen}
        onClose={() => setIsClassSheetOpen(false)}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
      />
    </div>
  );
};

export default HeroSearchWidget;
