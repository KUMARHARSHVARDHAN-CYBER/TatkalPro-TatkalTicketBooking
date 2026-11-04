"use client";

import React, { useState, useEffect } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { HeaderNav } from "../components/HeaderNav";
import { PreArmedChecklist } from "../components/PreArmedChecklist";
import { HeroSearchWidget } from "../components/HeroSearchWidget";
import { TrainCard } from "../components/TrainCard";
import SkeletonTrainCard from "../components/SkeletonTrainCard";
import FilterSidebar from "../components/FilterSidebar";
import { PassengerSheet } from "../components/PassengerSheet";
import { ReviewAndCaptchaModal } from "../components/ReviewAndCaptchaModal";
import { PaymentModal } from "../components/PaymentModal";
import { AutoRefundTracker } from "../components/AutoRefundTracker";
import { ConfirmedETicketModal } from "../components/ConfirmedETicketModal";
import { PNRLookupModal } from "../components/PNRLookupModal";
import { ScamAdvisoryModal } from "../components/ScamAdvisoryModal";
import { VirtualWaitingRoom } from "../components/VirtualWaitingRoom";
import { WaitlistPredictorCard } from "../components/WaitlistPredictorCard";
import { SplitTicketCard } from "../components/SplitTicketCard";
import { StationSearchModal } from "../components/StationSearchModal";

import { TRAINS, STATIONS } from "../lib/railway/data";
import {
  TrainSchedule,
  ClassFareAndAvailability,
  Passenger,
  QuotaCode,
  Station,
  BookingRecord,
  PaymentTransaction,
  SplitTicketAlternative,
  BookingDraft,
} from "../lib/railway/types";
import {
  Train as UITrain,
  ClassAvailability,
  SearchQueryParams,
  FilterState,
  QuotaType,
  TravelClassCode,
} from "../types";
import { Language } from "../lib/i18n";
import { SlidersHorizontal, AlertCircle, Sparkles, Zap, GitFork } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TatkalProPage() {
  // 1. Language & Display States
  const [lang, setLang] = useState<Language>("en");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);

  // 2. Search States
  const [searchParams, setSearchParams] = useState<SearchQueryParams>({
    fromStation: "NDLS",
    toStation: "MMCT",
    journeyDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })(),
    quota: "TATKAL",
  });

  const [rawTrains, setRawTrains] = useState<TrainSchedule[]>(TRAINS);
  const [splitAlternatives, setSplitAlternatives] = useState<SplitTicketAlternative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // 3. Filter States
  const [filters, setFilters] = useState<FilterState>({
    departureTime: [],
    classes: [],
    trainTypes: [],
    sortBy: "departure",
  });

  // 4. Passenger Master List State
  const [selectedPassengers, setSelectedPassengers] = useState<Passenger[]>([
    {
      id: "p_1",
      name: "Rahul Sharma",
      age: 32,
      gender: "M",
      berthPreference: "LOWER",
      foodPreference: "VEG",
      idType: "AADHAAR",
      idNumber: "XXXXXXXX4829",
    },
    {
      id: "p_2",
      name: "Priya Sharma",
      age: 29,
      gender: "F",
      berthPreference: "LOWER",
      foodPreference: "VEG",
      idType: "AADHAAR",
      idNumber: "XXXXXXXX1904",
    },
  ]);
  const [isPaymentPreArmed, setIsPaymentPreArmed] = useState<boolean>(true);

  // 5. Booking Flow Modal States
  const [showPassengerModal, setShowPassengerModal] = useState<boolean>(false);
  const [showStationModal, setShowStationModal] = useState<"FROM" | "TO" | null>(null);
  const [showWaitingRoom, setShowWaitingRoom] = useState<boolean>(false);
  const [showReviewCaptcha, setShowReviewCaptcha] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAutoRefundTracker, setShowAutoRefundTracker] = useState<boolean>(false);
  const [showETicketModal, setShowETicketModal] = useState<boolean>(false);
  const [showPnrModal, setShowPnrModal] = useState<boolean>(false);
  const [showScamModal, setShowScamModal] = useState<boolean>(false);

  // Active Transaction and Selection States
  const [activeTrain, setActiveTrain] = useState<TrainSchedule | null>(null);
  const [activeClass, setActiveClass] = useState<ClassFareAndAvailability | null>(null);
  const [activeHoldToken, setActiveHoldToken] = useState<string>("");
  const [failedTx, setFailedTx] = useState<PaymentTransaction | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  // Fetch Split Alternatives on load or route change
  useEffect(() => {
    async function loadSplits() {
      try {
        const res = await fetch(
          `/api/split-ticket?from=${searchParams.fromStation}&to=${searchParams.toStation}&quota=${searchParams.quota}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setSplitAlternatives(data.data);
        }
      } catch (err) {
        console.error("Failed to load split ticket alternatives", err);
      }
    }
    loadSplits();
  }, [searchParams.fromStation, searchParams.toStation, searchParams.quota]);

  // Handle Search Submission
  const handleSearch = async (params: SearchQueryParams) => {
    setSearchParams(params);
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/trains?from=${params.fromStation}&to=${params.toStation}&date=${params.journeyDate}&quota=${params.quota}`
      );
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setRawTrains(data.data);
      } else {
        setRawTrains(TRAINS);
      }
    } catch {
      setRawTrains(TRAINS);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  // Fast Prepare Mode Clicked
  const handleFastPrepare = () => {
    setIsPaymentPreArmed(true);
    if (selectedPassengers.length === 0) {
      setShowPassengerModal(true);
    } else {
      alert("⚡ Pre-Armed Tatkal Mode Activated! Master passengers & UPI Fast Pay are verified. When the clock hits 10:00:00, simply click 'Book Now' on your train.");
    }
  };

  // Convert rich TrainSchedule to UITrain for TrainCard component
  const uiTrains: UITrain[] = rawTrains.map((ts) => {
    const quotaClasses = (ts.classes as any)[searchParams.quota] || ts.classes.GENERAL || [];
    return {
      id: ts.id,
      number: ts.trainNumber,
      name: ts.trainName,
      type: ts.trainType,
      fromStation: {
        code: ts.fromStation.code,
        name: ts.fromStation.name,
        city: ts.fromStation.city,
        state: ts.fromStation.state,
      },
      toStation: {
        code: ts.toStation.code,
        name: ts.toStation.name,
        city: ts.toStation.city,
        state: ts.toStation.state,
      },
      departureTime: ts.departureTime,
      arrivalTime: ts.arrivalTime,
      duration: ts.duration,
      dayOffset: ts.dayOffset,
      runningDays: ts.runningDays as any,
      hasPantry: ts.hasPantry,
      onTimePercentage: ts.onTimePercentage,
      classes: quotaClasses.map((c: ClassFareAndAvailability): ClassAvailability => ({
        classCode: c.classCode as TravelClassCode,
        className: c.className,
        fare: c.totalFare,
        status: c.status,
        statusText: c.statusText,
        availableSeats: c.availableSeats,
        updatedAt: c.updatedAt,
      })),
    };
  });

  // Filter & Sort Logic
  const filteredTrains = uiTrains
    .filter((train) => {
      if (filters.classes.length > 0) {
        const hasClass = train.classes.some((c) => filters.classes.includes(c.classCode));
        if (!hasClass) return false;
      }
      if (filters.trainTypes.length > 0) {
        if (!filters.trainTypes.includes(train.type)) return false;
      }
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
    })
    .sort((a, b) => {
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

  // Initiate Booking Sequence
  const handleOpenBooking = (train: UITrain, classInfo: ClassAvailability) => {
    const rawTrain = rawTrains.find((t) => t.trainNumber === train.number) || rawTrains[0];
    const quotaList = (rawTrain.classes as any)[searchParams.quota] || rawTrain.classes.GENERAL;
    const rawClass =
      quotaList.find((c: ClassFareAndAvailability) => c.classCode === classInfo.classCode) ||
      quotaList[0];

    setActiveTrain(rawTrain);
    setActiveClass(rawClass);

    // If no passengers selected, prompt passenger sheet first
    if (selectedPassengers.length === 0) {
      setShowPassengerModal(true);
      return;
    }

    // High concurrency simulation: if Tatkal quota, show quick queue admittance
    if (searchParams.quota === "TATKAL") {
      setShowWaitingRoom(true);
    } else {
      setShowReviewCaptcha(true);
    }
  };

  // Virtual Waiting Room Admitted
  const handleQueueAdmitted = () => {
    setShowWaitingRoom(false);
    setShowReviewCaptcha(true);
  };

  // Hold Secured & Proceed to Payment
  const handleProceedToPayment = (holdToken: string) => {
    setActiveHoldToken(holdToken);
    setShowReviewCaptcha(false);
    setShowPaymentModal(true);
  };

  // Payment Succeeded
  const handlePaymentSuccess = async (tx: PaymentTransaction) => {
    setShowPaymentModal(false);

    if (!activeTrain || !activeClass) return;

    try {
      const passengerCount = Math.max(1, selectedPassengers.length);
      const draft: BookingDraft = {
        draftId: `draft_${Date.now()}`,
        trainNumber: activeTrain.trainNumber,
        trainName: activeTrain.trainName,
        fromStationCode: activeTrain.fromStation.code,
        toStationCode: activeTrain.toStation.code,
        journeyDate: searchParams.journeyDate,
        classCode: activeClass.classCode,
        quota: searchParams.quota as QuotaCode,
        passengers: selectedPassengers,
        fareBreakdown: {
          baseFareTotal: activeClass.baseFare * passengerCount,
          tatkalChargesTotal: activeClass.tatkalCharge * passengerCount,
          superfastChargesTotal: activeClass.superfastCharge * passengerCount,
          gstTotal: activeClass.gstAmount * passengerCount,
          pgFee: activeClass.pgFee,
          grandTotal: activeClass.totalFare * passengerCount,
        },
        holdToken: activeHoldToken,
      };

      const res = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken: activeHoldToken,
          draft,
          payment: tx,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        setShowETicketModal(true);
      } else {
        alert(data.error?.message || "Failed to finalize booking");
      }
    } catch {
      alert("Error confirming booking");
    }
  };

  // Payment Failure (Simulated)
  const handlePaymentFailureSimulated = (failed: PaymentTransaction) => {
    setFailedTx(failed);
    setShowPaymentModal(false);
    setShowAutoRefundTracker(true);
  };

  // Retry Payment with Backup Gateway
  const handleRetryPaymentWithBackup = () => {
    setShowAutoRefundTracker(false);
    setShowPaymentModal(true);
  };

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white ${
        lowBandwidth ? "bg-[#050b14]" : "bg-[#071224]"
      }`}
    >
      {/* 1. Visible Demo / Simulated Sandbox Banner with Low-Bandwidth Toggle */}
      <DemoBanner
        lowBandwidth={lowBandwidth}
        onToggleLowBandwidth={() => setLowBandwidth(!lowBandwidth)}
        lang={lang}
      />

      {/* 2. Top Nav with Live Server-Synced Tatkal Countdown & Actions */}
      <HeaderNav
        lang={lang}
        onLanguageChange={setLang}
        onOpenPnrModal={() => setShowPnrModal(true)}
        onOpenScamModal={() => setShowScamModal(true)}
        onOpenHistoryModal={() => alert("Booking history is stored locally in your current browser session.")}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* 3. Pre-Armed Tatkal Window Readiness Checklist */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 w-full">
        <PreArmedChecklist
          lang={lang}
          passengerCount={selectedPassengers.length}
          paymentPreSelected={isPaymentPreArmed}
          onOpenPassengerMaster={() => setShowPassengerModal(true)}
          onFastPrepare={handleFastPrepare}
        />
      </div>

      {/* 4. Hero Search Widget with Glassmorphism */}
      <HeroSearchWidget onSearch={handleSearch} isLoading={isLoading} />

      {/* 5. Main Results Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
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
              Journey Date: <span className="font-semibold text-white">{searchParams.journeyDate}</span> • Showing live atomic seat counters
            </p>
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-4 py-2 rounded-xl bg-[#112240] border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span>Filters ({filteredTrains.length})</span>
          </button>
        </div>

        {/* Smart Split-Ticket Suggestion (Dijkstra algorithm) */}
        {splitAlternatives.length > 0 && (
          <div className="mb-6">
            <SplitTicketCard
              alternative={splitAlternatives[0]}
              onSelectSplit={(alt) => {
                alert(
                  `Split-Ticket Selected: Leg 1 on Train ${alt.leg1.trainNumber} to ${alt.intermediateStation.code}, then Leg 2 on Train ${alt.leg2.trainNumber} to ${alt.leg2.toCode}. Layover: ${Math.floor(alt.layoverMinutes / 60)}h ${alt.layoverMinutes % 60}m.`
                );
              }}
            />
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={() =>
                setFilters({
                  departureTime: [],
                  classes: [],
                  trainTypes: [],
                  sortBy: "departure",
                })
              }
              totalResults={filteredTrains.length}
            />
          </aside>

          {/* Mobile Filter Drawer */}
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
                  onReset={() =>
                    setFilters({
                      departureTime: [],
                      classes: [],
                      trainTypes: [],
                      sortBy: "departure",
                    })
                  }
                  totalResults={filteredTrains.length}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Train Cards Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {isLoading ? (
              <>
                <SkeletonTrainCard />
                <SkeletonTrainCard />
                <SkeletonTrainCard />
              </>
            ) : filteredTrains.length > 0 ? (
              filteredTrains.map((train) => {
                const hasWaitlist = train.classes.some((c) => c.status === "WL" || c.status === "RAC");
                return (
                  <div key={train.id} className="flex flex-col gap-2">
                    <TrainCard
                      train={train}
                      quota={searchParams.quota}
                      onBookNow={handleOpenBooking}
                    />

                    {/* AI Waitlist Probability Predictor when waitlisted */}
                    {hasWaitlist && (
                      <WaitlistPredictorCard
                        trainNumber={train.number}
                        classCode="3A"
                        currentWL={14}
                        probability={82}
                        rationale="Historically, WL up to 24 on this route confirms 4 hours prior to departure due to Tatkal chart preparation and quota reallocation."
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-[#0c1a30] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-10 h-10 text-orange-400" />
                <h3 className="text-base font-bold text-white">No Trains Found</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  No trains match your filters for {searchParams.fromStation} to {searchParams.toStation}. Try resetting your filters.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      departureTime: [],
                      classes: [],
                      trainTypes: [],
                      sortBy: "departure",
                    })
                  }
                  className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 6. Master Passenger List Sheet */}
      <PassengerSheet
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        selectedPassengers={selectedPassengers}
        onUpdateSelectedPassengers={setSelectedPassengers}
      />

      {/* 7. Virtual Waiting Room (Rush queue simulation) */}
      <VirtualWaitingRoom
        isOpen={showWaitingRoom}
        onAdmitted={handleQueueAdmitted}
      />

      {/* 8. Review & Audio-Accessible Captcha Modal (Zero Data Loss) */}
      {activeTrain && activeClass && (
        <ReviewAndCaptchaModal
          isOpen={showReviewCaptcha}
          onClose={() => setShowReviewCaptcha(false)}
          train={activeTrain}
          classInfo={activeClass}
          quota={searchParams.quota as QuotaCode}
          journeyDate={searchParams.journeyDate}
          passengers={selectedPassengers}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* 9. Multi-Gateway Payment Modal (with auto-fallback & intentional failure toggle) */}
      {activeClass && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          totalAmount={activeClass.totalFare * Math.max(1, selectedPassengers.length)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailureSimulated={handlePaymentFailureSimulated}
        />
      )}

      {/* 10. Auto-Refund & Reconciliation Tracker */}
      <AutoRefundTracker
        isOpen={showAutoRefundTracker}
        onClose={() => setShowAutoRefundTracker(false)}
        failedTransaction={failedTx}
        onRetryWithBackup={handleRetryPaymentWithBackup}
      />

      {/* 11. Confirmed E-Ticket Modal (Official IRCTC format with QR, Barcode, WhatsApp, Print) */}
      <ConfirmedETicketModal
        isOpen={showETicketModal}
        onClose={() => setShowETicketModal(false)}
        booking={confirmedBooking}
      />

      {/* 12. PNR Status Lookup Modal */}
      <PNRLookupModal
        isOpen={showPnrModal}
        onClose={() => setShowPnrModal(false)}
        onViewBookingDetails={(booking) => {
          setConfirmedBooking(booking);
          setShowPnrModal(false);
          setShowETicketModal(true);
        }}
      />

      {/* 13. Railway Anti-Scam Advisory Modal */}
      <ScamAdvisoryModal
        isOpen={showScamModal}
        onClose={() => setShowScamModal(false)}
      />

      {/* 14. Station Autocomplete Search Modal */}
      <StationSearchModal
        isOpen={showStationModal !== null}
        onClose={() => setShowStationModal(null)}
        title={showStationModal === "FROM" ? "Select Departure Station" : "Select Destination Station"}
        onSelectStation={(stn) => {
          if (showStationModal === "FROM") {
            setSearchParams({ ...searchParams, fromStation: stn.code });
          } else {
            setSearchParams({ ...searchParams, toStation: stn.code });
          }
          setShowStationModal(null);
        }}
      />

      {/* 15. Global Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050e1a] py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">TatkalPro</span>
            <span>• Built for 10:00 AM High Concurrency</span>
          </div>
          <p>© 2026 TatkalPro Railway Booking Engine (Simulated Environment). Not affiliated with IRCTC/CRIS.</p>
        </div>
      </footer>
    </div>
  );
}
