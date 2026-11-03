"use client";

import React, { useState, useTransition } from "react";
import Navbar from "../components/Navbar";
import HeroSearchWidget from "../components/HeroSearchWidget";
import TrainCard from "../components/TrainCard";
import SkeletonTrainCard from "../components/SkeletonTrainCard";
import FilterSidebar from "../components/FilterSidebar";
import SplitTicketAlert from "../components/SplitTicketAlert";
import BookingModal from "../components/BookingModal";
import { MOCK_TRAINS, POPULAR_STATIONS } from "../lib/mock-data";
import {
  Train,
  ClassAvailability,
  SearchQueryParams,
  FilterState,
  QuotaType,
} from "../types";
import { Train as TrainIcon, SlidersHorizontal, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RailwayBookingPage() {
  const [searchParams, setSearchParams] = useState<SearchQueryParams>({
    fromStation: "NDLS",
    toStation: "MMCT",
    journeyDate: "2026-11-10",
    quota: "TATKAL",
  });

  const [filters, setFilters] = useState<FilterState>({
    departureTime: [],
    classes: [],
    trainTypes: [],
    sortBy: "departure",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Booking Modal State
  const [selectedTrainForBooking, setSelectedTrainForBooking] = useState<{
    train: Train;
    classInfo: ClassAvailability;
  } | null>(null);

  // Search Handler simulating network delay
  const handleSearch = (params: SearchQueryParams) => {
    setSearchParams(params);
    setIsLoading(true);

    // Simulate realistic railway GDS response delay
    setTimeout(() => {
      setIsLoading(false);
    }, 750);
  };

  // Filter & Sort Logic
  const filteredTrains = MOCK_TRAINS.filter((train) => {
    // Class filter
    if (filters.classes.length > 0) {
      const hasClass = train.classes.some((c) => filters.classes.includes(c.classCode));
      if (!hasClass) return false;
    }

    // Train Type filter
    if (filters.trainTypes.length > 0) {
      if (!filters.trainTypes.includes(train.type)) return false;
    }

    // Departure Time filter
    if (filters.departureTime.length > 0) {
      const hour = parseInt(train.departureTime.split(":")[0], 10);
      const matchesTime = filters.departureTime.some((timeId) => {
        if (timeId === "early_morning" && hour >= 0 && hour < 6) return true;
        if (timeId === "morning" && hour >= 6 && hour < 12) return true;
        if (timeId === "afternoon" && hour >= 12 && hour < 18) return true;
        if (timeId === "night" && hour >= 18 && hour < 24) return true;
        return false;
      });
      if (!matchesTime) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === "departure") {
      return a.departureTime.localeCompare(b.departureTime);
    }
    if (filters.sortBy === "duration") {
      const durA = parseInt(a.duration.split("h")[0], 10);
      const durB = parseInt(b.duration.split("h")[0], 10);
      return durA - durB;
    }
    if (filters.sortBy === "availability") {
      const availA = a.classes.reduce((sum, c) => sum + c.availableSeats, 0);
      const availB = b.classes.reduce((sum, c) => sum + c.availableSeats, 0);
      return availB - availA;
    }
    return 0;
  });

  const handleResetFilters = () => {
    setFilters({
      departureTime: [],
      classes: [],
      trainTypes: [],
      sortBy: "departure",
    });
  };

  const handleOpenBooking = (train: Train, classInfo: ClassAvailability) => {
    setSelectedTrainForBooking({ train, classInfo });
  };

  return (
    <div className="min-h-screen bg-[#071224] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* 2. Hero & Glassmorphism Search Widget */}
      <HeroSearchWidget onSearch={handleSearch} isLoading={isLoading} />

      {/* 3. Main Content: Side-by-Side Results & Filters (Responsive) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Results Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Trains: {searchParams.fromStation} ➔ {searchParams.toStation}
              </h2>
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {searchParams.quota} QUOTA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Journey Date: <span className="font-semibold text-white">{searchParams.journeyDate}</span> • Showing live seat counters
            </p>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-4 py-2 rounded-xl bg-[#112240] border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span>Filter & Sort ({filteredTrains.length})</span>
          </button>
        </div>

        {/* Smart Split-Ticket Alert (Illustrated when direct is tight) */}
        <div className="mb-6">
          <SplitTicketAlert
            fromCode={searchParams.fromStation}
            toCode={searchParams.toStation}
            onExploreSplit={() => {
              alert(
                `Smart Split-Routing Algorithm: Evaluated intermediate station KOTA (Kota Junction). Train 12952 -> KOTA has 10 seats, Train 12954 KOTA -> ${searchParams.toStation} has 15 seats with a 1h 25m platform transfer layover.`
              );
            }}
          />
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Sidebar Filters (Col 3.5) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              totalResults={filteredTrains.length}
            />
          </aside>

          {/* Mobile Drawer Filters */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden col-span-12 mb-4"
              >
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleResetFilters}
                  totalResults={filteredTrains.length}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Train Cards Column (Col 8.5) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {isLoading ? (
              /* Shimmering Skeleton Loaders */
              <>
                <SkeletonTrainCard />
                <SkeletonTrainCard />
                <SkeletonTrainCard />
              </>
            ) : filteredTrains.length > 0 ? (
              /* Actual Train Cards */
              filteredTrains.map((train) => (
                <TrainCard
                  key={train.id}
                  train={train}
                  quota={searchParams.quota}
                  onBookNow={handleOpenBooking}
                />
              ))
            ) : (
              /* Empty State */
              <div className="bg-[#0c1a30] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-base font-bold text-white">No Trains Found</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  No trains match your selected filters. Try clearing your departure time or class filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Booking Checkout Modal */}
      {selectedTrainForBooking && (
        <BookingModal
          isOpen={!!selectedTrainForBooking}
          onClose={() => setSelectedTrainForBooking(null)}
          train={selectedTrainForBooking.train}
          selectedClass={selectedTrainForBooking.classInfo}
          quota={searchParams.quota}
          journeyDate={searchParams.journeyDate}
        />
      )}

      {/* 4. Global Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050e1a] py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">IRCTC NEXT-GEN</span>
            <span>• Built for 10:00 AM Concurrency</span>
          </div>
          <p>© 2026 Indian Railways Catering and Tourism Corporation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
