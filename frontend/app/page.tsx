"use client";

import React, { useState, useEffect, useRef } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { HeaderNav } from "../components/HeaderNav";
import { StepperProgress, BookingStep } from "../components/StepperProgress";
import { HeroSearchWidget } from "../components/HeroSearchWidget";
import { HomeInfoSections } from "../components/HomeInfoSections";
import { TrainCard } from "../components/TrainCard";
import SkeletonTrainCard from "../components/SkeletonTrainCard";
import FilterSidebar from "../components/FilterSidebar";
import { LivePassengerManager } from "../components/LivePassengerManager";
import { ReviewAndCaptchaModal } from "../components/ReviewAndCaptchaModal";
import { PaymentModal } from "../components/PaymentModal";
import { AutoRefundTracker } from "../components/AutoRefundTracker";
import { ConfirmedETicketModal } from "../components/ConfirmedETicketModal";
import { PNRLookupModal } from "../components/PNRLookupModal";
import { ScamAdvisoryModal } from "../components/ScamAdvisoryModal";
import { VirtualWaitingRoom } from "../components/VirtualWaitingRoom";
import { WaitlistPredictorCard } from "../components/WaitlistPredictorCard";
import { SplitTicketCard } from "../components/SplitTicketCard";
import { AdminBotShieldDashboard } from "../components/AdminBotShieldDashboard";
import { VoiceBooking } from "../components/VoiceBooking";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { EmptyState } from "../components/ui/ModalsAndStates";
import { Button } from "../components/ui/Button";

import { SafetyRulesEngine } from "../lib/safetyNet/rulesEngine";
import { RegretShieldIssue, FailureAutopsyRecord } from "../lib/safetyNet/types";
import { RegretShieldSheet } from "../components/safetyNet/RegretShieldSheet";
import { GroupSplitModal } from "../components/safetyNet/GroupSplitModal";
import { FailureAutopsyCard } from "../components/safetyNet/FailureAutopsyCard";
import { SafetyNetAdminModal } from "../components/safetyNet/SafetyNetAdminModal";
import { FailureAutopsyService } from "../lib/safetyNet/failureAutopsy";

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
import Link from "next/link";
import { botShieldService } from "../lib/railway/botShield";
import { formatDisplayDate } from "../lib/dateUtils";
import { computeSmartPickBadges, generateDateFlexibilityStrip } from "../lib/resultsHelper";
import {
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
  Zap,
  Users,
  ArrowLeft,
  Dumbbell,
  ArrowRight,
  X,
  ChevronDown,
  Clock,
  RotateCcw,
  Check,
  GitFork,
  Calendar,
  Mic,
} from "lucide-react";

export default function TatkalProMainPage() {
  // 1. Language & Display States
  const [lang, setLang] = useState<Language>("en");
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);

  // 2. Stepper Progress State (Search > Passengers > Review > Pay > Ticket)
  const [currentStep, setCurrentStep] = useState<BookingStep>("SEARCH");

  // 3. Search Query States
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

  const [rawTrains, setRawTrains] = useState<TrainSchedule[]>(() => {
    return TRAINS.filter((train) => {
      const srcIdx = train.stops.findIndex((s) => s.stationCode === "NDLS");
      const dstIdx = train.stops.findIndex((s) => s.stationCode === "MMCT");
      return srcIdx !== -1 && dstIdx !== -1 && srcIdx < dstIdx;
    });
  });
  const [splitAlternatives, setSplitAlternatives] = useState<SplitTicketAlternative[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Search Results Layout & UX Enhancement States
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState<boolean>(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState<boolean>(false);
  const [showAllTrains, setShowAllTrains] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeMobileTrain, setActiveMobileTrain] = useState<UITrain | null>(null);
  const [activeMobileClass, setActiveMobileClass] = useState<ClassAvailability | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  // 4. Filter States
  const [filters, setFilters] = useState<FilterState>({
    departureTime: [],
    classes: [],
    trainTypes: [],
    sortBy: "departure",
  });

  // 5. Live Editable Passenger Management State
  const [passengerCount, setPassengerCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const p = parseInt(urlParams.get("passengers") || "", 10);
      if (!isNaN(p) && p >= 1 && p <= 4) return p;
    }
    return 1;
  });

  const handlePassengerCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(4, newCount));
    setPassengerCount(count);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("passengers", String(count));
      window.history.replaceState({}, "", url.toString());
    }
  };

  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: "p_1",
      name: "Rahul Sharma",
      age: 32,
      gender: "M",
      berthPreference: "LOWER",
      foodPreference: "VEG",
      idType: "AADHAAR",
      idNumber: "XXXXXXXX4829",
      nationality: "Indian",
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
      nationality: "Indian",
    },
  ]);

  // 6. Active Train, Class & Admission Token Selection
  const [selectedTrain, setSelectedTrain] = useState<TrainSchedule | null>(TRAINS[1] || TRAINS[0]);
  const [selectedClass, setSelectedClass] = useState<ClassFareAndAvailability | null>(
    (TRAINS[1]?.classes as any)?.TATKAL?.[0] || TRAINS[0]?.classes.GENERAL?.[0]
  );
  const [admissionPassToken, setAdmissionPassToken] = useState<string>("");
  const [activeHoldToken, setActiveHoldToken] = useState<string>("");

  // 7. Modals
  const [showWaitingRoom, setShowWaitingRoom] = useState<boolean>(false);
  const [showReviewCaptcha, setShowReviewCaptcha] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showAutoRefundTracker, setShowAutoRefundTracker] = useState<boolean>(false);
  const [showETicketModal, setShowETicketModal] = useState<boolean>(false);
  const [showPnrModal, setShowPnrModal] = useState<boolean>(false);
  const [showScamModal, setShowScamModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // 8. Tatkal Safety Net States
  const [showRegretShieldSheet, setShowRegretShieldSheet] = useState<boolean>(false);
  const [regretShieldIssues, setRegretShieldIssues] = useState<RegretShieldIssue[]>([]);
  const [pendingHoldToken, setPendingHoldToken] = useState<string>("");
  const [showGroupSplitModal, setShowGroupSplitModal] = useState<boolean>(false);
  const [showSafetyNetAdmin, setShowSafetyNetAdmin] = useState<boolean>(false);
  const [latestAutopsy, setLatestAutopsy] = useState<FailureAutopsyRecord | null>(null);
  const [showAutopsyModal, setShowAutopsyModal] = useState<boolean>(false);

  // 8. Completed Booking & Payment State
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [failedTx, setFailedTx] = useState<PaymentTransaction | null>(null);

  // Load split ticket suggestions
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
        console.error("Failed to load split alternatives", err);
      }
    }
    loadSplits();
  }, [searchParams.fromStation, searchParams.toStation, searchParams.quota]);

  // Restore search params from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("from") && sp.has("to")) {
      const fromStation = sp.get("from") || "NDLS";
      const toStation = sp.get("to") || "MMCT";
      const quota = (sp.get("quota") as QuotaType) || "TATKAL";
      const selectedClass = (sp.get("class") as TravelClassCode) || "SL";
      const journeyDate = sp.get("date") || searchParams.journeyDate;
      const p = parseInt(sp.get("passengers") || "", 10);
      if (!isNaN(p) && p >= 1 && p <= 4) setPassengerCount(p);
      setSearchParams({ fromStation, toStation, journeyDate, quota, selectedClass });
      setHasSearched(true);
      setIsSearchCollapsed(true);
    }
  }, []);

  // Sync search state changes to URL for Back/Refresh retention
  useEffect(() => {
    if (typeof window === "undefined" || !hasSearched) return;
    const sp = new URLSearchParams();
    sp.set("from", searchParams.fromStation);
    sp.set("to", searchParams.toStation);
    sp.set("date", searchParams.journeyDate);
    sp.set("quota", searchParams.quota);
    sp.set("passengers", String(passengerCount));
    if (searchParams.selectedClass) sp.set("class", searchParams.selectedClass);
    window.history.replaceState(null, "", window.location.pathname + "?" + sp.toString());
  }, [searchParams, hasSearched, passengerCount]);

  // Handle browser Back / Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has("from") && sp.has("to")) {
        const p = parseInt(sp.get("passengers") || "", 10);
        if (!isNaN(p) && p >= 1 && p <= 4) setPassengerCount(p);
        setSearchParams({
          fromStation: sp.get("from") || "NDLS",
          toStation: sp.get("to") || "MMCT",
          journeyDate: sp.get("date") || searchParams.journeyDate,
          quota: (sp.get("quota") as QuotaType) || "TATKAL",
          selectedClass: (sp.get("class") as TravelClassCode) || "SL",
        });
        setHasSearched(true);
        setIsSearchCollapsed(true);
      } else {
        setIsSearchCollapsed(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [searchParams.journeyDate]);

  // Handle Esc key to close filter drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFiltersDrawerOpen) {
        setIsFiltersDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFiltersDrawerOpen]);

  const scrollToResults = () => {
    setTimeout(() => {
      const targetEl = searchSectionRef.current || resultsRef.current;
      if (!targetEl || typeof window === "undefined") return;
      const headerHeight = 64; // matches --header-height
      const elementPos = targetEl.getBoundingClientRect().top;
      const offsetPos = elementPos + window.pageYOffset - headerHeight;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, offsetPos),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }, 60);
  };

  // Search Trains Handler
  const handleSearch = async (params: SearchQueryParams) => {
    setSearchParams(params);
    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);
    setIsSearchCollapsed(true);
    setShowAllTrains(false);

    scrollToResults();

    try {
      const res = await fetch(
        `/api/trains?from=${params.fromStation}&to=${params.toStation}&date=${params.journeyDate}&quota=${params.quota}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRawTrains(data.data);
      } else {
        setRawTrains([]);
      }
    } catch {
      setRawTrains([]);
      setSearchError("Unable to fetch train schedules from the railway network. Please try again.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        const heading = document.getElementById("results-heading");
        if (heading) heading.focus();
      }, 300);
    }
  };

  // Convert TrainSchedule to UITrain
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
      classes: quotaClasses
        .slice()
        .sort((a: ClassFareAndAvailability, b: ClassFareAndAvailability) => {
          const serial: Record<string, number> = { SL: 1, "3A": 2, "2A": 3, "1A": 4, CC: 5, EC: 6, "2S": 7 };
          return (serial[a.classCode] || 99) - (serial[b.classCode] || 99);
        })
        .map((c: ClassFareAndAvailability): ClassAvailability => ({
          classCode: c.classCode as TravelClassCode,
          className: c.className,
          fare: c.totalFare,
          status: c.status,
          statusText: c.statusText,
          availableSeats: c.availableSeats,
          updatedAt: c.updatedAt,
          baseFare: c.baseFare,
          tatkalCharge: c.tatkalCharge,
          superfastCharge: c.superfastCharge,
          gstAmount: c.gstAmount,
          pgFee: c.pgFee,
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
        const durA = parseInt(a.duration.split("h")[0], 10) * 60 + parseInt(a.duration.split("h")[1] || "0", 10);
        const durB = parseInt(b.duration.split("h")[0], 10) * 60 + parseInt(b.duration.split("h")[1] || "0", 10);
        return durA - durB;
      }
      if (filters.sortBy === "fare") {
        const minFareA = Math.min(...a.classes.map((c) => c.fare));
        const minFareB = Math.min(...b.classes.map((c) => c.fare));
        return minFareA - minFareB;
      }
      if (filters.sortBy === "availability") {
        const availA = a.classes.reduce((sum, c) => sum + c.availableSeats, 0);
        const availB = b.classes.reduce((sum, c) => sum + c.availableSeats, 0);
        return availB - availA;
      }
      return 0;
    });

  // Smart-Pick Badges evaluated on filtered trains and active class filter
  const smartPickBadges = React.useMemo(() => {
    return computeSmartPickBadges(filteredTrains, filters.classes);
  }, [filteredTrains, filters.classes]);

  // 7-Day Date Flexibility Strip
  const dateFlexStrip = React.useMemo(() => {
    const lowestFare =
      uiTrains.length > 0
        ? Math.min(...uiTrains.flatMap((t) => t.classes.map((c) => c.fare)))
        : 540;
    return generateDateFlexibilityStrip(
      searchParams.journeyDate,
      lowestFare,
      `${searchParams.fromStation}-${searchParams.toStation}`
    );
  }, [searchParams.journeyDate, searchParams.fromStation, searchParams.toStation, uiTrains]);

  // Handle in-place Date selection in Flexibility Strip
  const handleDateStripSelect = async (dateStr: string) => {
    if (dateStr === searchParams.journeyDate) return;
    setIsLoading(true);
    const updated = { ...searchParams, journeyDate: dateStr };
    setSearchParams(updated);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("date", dateStr);
      url.searchParams.set("passengers", String(passengerCount));
      window.history.replaceState({}, "", url.toString());
    }

    try {
      const res = await fetch(
        `/api/trains?from=${updated.fromStation}&to=${updated.toStation}&date=${dateStr}&quota=${updated.quota}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRawTrains(data.data);
      }
    } catch {
      // Keep current list on network error
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 70); // Sub-100ms snappy transition
    }
  };

  const activeFilterCount =
    filters.classes.length +
    filters.departureTime.length +
    filters.trainTypes.length +
    (filters.sortBy !== "departure" ? 1 : 0);

  // 1-Tap Book Now on Train Card
  const handleOpenBooking = (train: UITrain, classInfo: ClassAvailability) => {
    const rawTrain = rawTrains.find((t) => t.trainNumber === train.number) || rawTrains[0];
    const quotaList = (rawTrain.classes as any)[searchParams.quota] || rawTrain.classes.GENERAL;
    const rawClass =
      quotaList.find((c: ClassFareAndAvailability) => c.classCode === classInfo.classCode) ||
      quotaList[0];

    setSelectedTrain(rawTrain);
    setSelectedClass(rawClass);

    // If Tatkal quota, verify waiting room & issue signed admission pass
    if (searchParams.quota === "TATKAL" || searchParams.quota === "PREMIUM_TATKAL") {
      setShowWaitingRoom(true);
    } else {
      setCurrentStep("PASSENGERS");
    }
  };

  // Waiting Room Admitted: Issue signed Bot Shield token
  const handleQueueAdmitted = () => {
    setShowWaitingRoom(false);
    const pass = botShieldService.issueAdmissionPass("usr_demo", "127.0.0.1", "fp_browser_verified");
    setAdmissionPassToken(pass.passId);
    setCurrentStep("PASSENGERS");
  };

  // Proceed from Passengers to Review & Captcha
  const handleProceedToReview = () => {
    if (passengers.length === 0) {
      alert("Please add at least one passenger to proceed with booking.");
      return;
    }
    // Tatkal Safety Net: If group exceeds 4 passengers in Tatkal, coordinate split automatically
    if (
      (searchParams.quota === "TATKAL" || searchParams.quota === "PREMIUM_TATKAL") &&
      passengers.length > 4
    ) {
      setShowGroupSplitModal(true);
      return;
    }
    setCurrentStep("REVIEW");
    setShowReviewCaptcha(true);
  };

  // Proceed from Captcha to Payment with Pre-Payment Regret Shield (<100ms)
  const handleProceedToPayment = (holdToken: string) => {
    setActiveHoldToken(holdToken);
    setPendingHoldToken(holdToken);

    if (selectedTrain && selectedClass) {
      const passengerCount = Math.max(1, passengers.length);
      const testDraft: BookingDraft = {
        draftId: `draft_${Date.now()}`,
        trainNumber: selectedTrain.trainNumber,
        trainName: selectedTrain.trainName,
        fromStationCode: selectedTrain.fromStation.code,
        toStationCode: selectedTrain.toStation.code,
        journeyDate: searchParams.journeyDate,
        classCode: selectedClass.classCode,
        quota: searchParams.quota as QuotaCode,
        passengers,
        fareBreakdown: {
          baseFareTotal: selectedClass.baseFare * passengerCount,
          tatkalChargesTotal: selectedClass.tatkalCharge * passengerCount,
          superfastChargesTotal: selectedClass.superfastCharge * passengerCount,
          gstTotal: selectedClass.gstAmount * passengerCount,
          pgFee: selectedClass.pgFee,
          grandTotal: selectedClass.totalFare * passengerCount,
        },
        holdToken,
      };

      const scanResult = SafetyRulesEngine.runRegretShield(testDraft, {
        searchedFrom: searchParams.fromStation,
        searchedTo: searchParams.toStation,
        departureTime: selectedTrain.departureTime,
      });

      // If any critical or high-risk mistakes found, display the 10-Second Safety Check
      if (!scanResult.isClean) {
        setRegretShieldIssues(scanResult.issues);
        setShowRegretShieldSheet(true);
        return;
      }
    }

    // Clean booking: Zero extra taps, proceeds immediately to payment in <100ms!
    setShowReviewCaptcha(false);
    setCurrentStep("PAYMENT");
    setShowPaymentModal(true);
  };

  // 1-Tap Fix Handler for Regret Shield Issues
  const handleApplySafetyFix = (issue: RegretShieldIssue) => {
    SafetyRulesEngine.recordWarningOutcome("FIXED");

    if (issue.fixActionType === "CHANGE_STATION" && issue.fixPayload?.targetStation) {
      setSearchParams((prev) => ({ ...prev, fromStation: issue.fixPayload.targetStation }));
    } else if (issue.fixActionType === "CHANGE_QUOTA" && issue.fixPayload?.targetQuota) {
      setSearchParams((prev) => ({ ...prev, quota: issue.fixPayload.targetQuota }));
    } else if (issue.fixActionType === "REMOVE_DUPLICATE" && issue.fixPayload?.passengerId) {
      setPassengers((prev) => prev.filter((p) => p.id !== issue.fixPayload.passengerId));
    } else if (issue.fixActionType === "FIX_ID") {
      setPassengers((prev) =>
        prev.map((p) => {
          if (p.id === issue.fixPayload?.passengerId) {
            return {
              ...p,
              idType: p.idType || "AADHAAR",
              idNumber: issue.fixPayload.correctedId || "XXXXXXXX4829",
              name: issue.fixPayload.cleanedName || p.name,
            };
          }
          return p;
        })
      );
    } else if (issue.fixActionType === "SPLIT_GROUP") {
      setShowRegretShieldSheet(false);
      setShowGroupSplitModal(true);
      return;
    } else if (issue.fixActionType === "ADJUST_DATE") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSearchParams((prev) => ({ ...prev, journeyDate: tomorrow.toISOString().split("T")[0] }));
    }

    // Fix applied: Close sheet and proceed straight to payment!
    setShowRegretShieldSheet(false);
    setShowReviewCaptcha(false);
    setCurrentStep("PAYMENT");
    setShowPaymentModal(true);
  };

  const handleProceedAnywayFromSafety = () => {
    SafetyRulesEngine.recordWarningOutcome("IGNORED");
    setShowRegretShieldSheet(false);
    setShowReviewCaptcha(false);
    setCurrentStep("PAYMENT");
    setShowPaymentModal(true);
  };

  // Payment Success: Confirm and Issue PNR
  const handlePaymentSuccess = async (tx: PaymentTransaction) => {
    setShowPaymentModal(false);

    if (!selectedTrain || !selectedClass) return;

    try {
      const passengerCount = Math.max(1, passengers.length);
      const draft: BookingDraft = {
        draftId: `draft_${Date.now()}`,
        trainNumber: selectedTrain.trainNumber,
        trainName: selectedTrain.trainName,
        fromStationCode: selectedTrain.fromStation.code,
        toStationCode: selectedTrain.toStation.code,
        journeyDate: searchParams.journeyDate,
        classCode: selectedClass.classCode,
        quota: searchParams.quota as QuotaCode,
        passengers,
        fareBreakdown: {
          baseFareTotal: selectedClass.baseFare * passengerCount,
          tatkalChargesTotal: selectedClass.tatkalCharge * passengerCount,
          superfastChargesTotal: selectedClass.superfastCharge * passengerCount,
          gstTotal: selectedClass.gstAmount * passengerCount,
          pgFee: selectedClass.pgFee,
          grandTotal: selectedClass.totalFare * passengerCount,
        },
        holdToken: activeHoldToken,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          holdToken: activeHoldToken,
          draft,
          payment: tx,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        setCurrentStep("TICKET");
        setShowETicketModal(true);
      } else {
        alert(data.error?.message || "Failed to confirm booking. Please try again.");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        alert("Booking confirmation request timed out. Please verify your PNR or try again.");
      } else {
        alert("Error confirming booking. Please try again.");
      }
    }
  };

  // Payment Failure Simulation & Failure Autopsy
  const handlePaymentFailureSimulated = (failed: PaymentTransaction) => {
    setFailedTx(failed);
    setShowPaymentModal(false);

    // Generate detailed privacy-safe Failure Autopsy Report
    if (selectedTrain && selectedClass) {
      const autopsy = FailureAutopsyService.createAutopsy(
        `attempt_${Date.now()}`,
        "BANK_OTP",
        {
          trainNumber: selectedTrain.trainNumber,
          trainName: selectedTrain.trainName,
          travelClass: selectedClass.classCode,
          quota: searchParams.quota,
          bankName: "HDFC 3D-Secure Gateway",
          elapsedSeconds: 40,
        }
      );
      setLatestAutopsy(autopsy);
      setShowAutopsyModal(true);
    } else {
      setShowAutoRefundTracker(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Visible Demo / Simulated Sandbox Badge with Low-Bandwidth Switch */}
      <DemoBanner
        lowBandwidth={lowBandwidth}
        onToggleLowBandwidth={() => setLowBandwidth(!lowBandwidth)}
        lang={lang}
      />

      {/* 2. Light Themed Header with Server-Synced Tatkal Countdown */}
      <HeaderNav
        lang={lang}
        onLanguageChange={setLang}
        onOpenPnrModal={() => setShowPnrModal(true)}
        onOpenScamModal={() => setShowScamModal(true)}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onHomeClick={() => setCurrentStep("SEARCH")}
      />

      {/* 3. Progress Stepper: Search > Passengers > Review > Pay > Ticket */}
      <StepperProgress
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step === "SEARCH") setCurrentStep("SEARCH");
          if (step === "PASSENGERS") setCurrentStep("PASSENGERS");
          if (step === "REVIEW") {
            setCurrentStep("REVIEW");
            setShowReviewCaptcha(true);
          }
        }}
      />

      {/* VIEW A: Search & Train Listing Screen */}
      {currentStep === "SEARCH" && (
        <main ref={searchSectionRef} className="w-full flex-1 flex flex-col pb-20 sm:pb-8">
          {/* Hero Search Widget with 250ms transition and collapse state */}
          <HeroSearchWidget
            onSearch={handleSearch}
            isLoading={isLoading}
            isCollapsed={isSearchCollapsed}
            onExpand={() => setIsSearchCollapsed(false)}
            currentParams={searchParams}
            passengerCount={passengerCount}
            onPassengerCountChange={handlePassengerCountChange}
          />

          {/* Results Area */}
          <div
            ref={resultsRef}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-1"
          >
            {/* Error State if Search Failed */}
            {searchError && (
              <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 sm:p-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <h3 className="text-base font-extrabold text-rose-950">
                  Unable to Load Train Schedules
                </h3>
                <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
                  {searchError}
                </p>
                <button
                  type="button"
                  onClick={() => handleSearch(searchParams)}
                  className="mt-4 min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Train List Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="results-heading"
                    tabIndex={-1}
                    className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight outline-none"
                  >
                    {filteredTrains.length} {filteredTrains.length === 1 ? "train" : "trains"} found: {searchParams.fromStation} ➔ {searchParams.toStation}
                  </h2>
                  <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    {searchParams.quota} QUOTA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Journey Date: <strong className="text-slate-800">{formatDisplayDate(searchParams.journeyDate)}</strong> • Showing simulated live seat availability
                </p>
              </div>

              <div className="flex items-center gap-2">
                {splitAlternatives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("split-ticket-card");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-300 hover:bg-blue-100 text-xs font-bold text-blue-900 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    title="Jump to 2-leg split journey alternative"
                  >
                    <GitFork className="w-3.5 h-3.5 text-blue-600" />
                    <span>Split routes ({splitAlternatives.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFiltersDrawerOpen(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  aria-label="Open filter options"
                >
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
                </button>
              </div>
            </div>

            {/* Aria-Live region for screen readers */}
            <div aria-live="polite" className="sr-only">
              {filteredTrains.length} trains found for route {searchParams.fromStation} to {searchParams.toStation}
            </div>

            {/* Date Flexibility Strip (7 Days: Selected day ± 3 days) */}
            <div className="mb-3 bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1.5 px-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Date Flexibility (Lowest Fare · Simulated Availability):</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Tap day to switch date in-place
                </span>
              </div>

              <div
                role="tablist"
                aria-label="7-day date flexibility selector"
                className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-thin"
              >
                {dateFlexStrip.map((item, idx) => (
                  <button
                    key={item.dateStr}
                    type="button"
                    role="tab"
                    aria-selected={item.isSelected}
                    aria-label={`${item.weekday}, ${item.displayDate}: lowest fare ₹${item.lowestFare}, ${item.statusLabel}${item.isDisabled ? " (Unavailable)" : ""}`}
                    disabled={item.isDisabled}
                    tabIndex={item.isSelected ? 0 : -1}
                    onClick={() => handleDateStripSelect(item.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") {
                        const next = dateFlexStrip[idx + 1];
                        if (next && !next.isDisabled) handleDateStripSelect(next.dateStr);
                      } else if (e.key === "ArrowLeft") {
                        const prev = dateFlexStrip[idx - 1];
                        if (prev && !prev.isDisabled) handleDateStripSelect(prev.dateStr);
                      }
                    }}
                    className={`min-w-[88px] sm:flex-1 py-1 px-2 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 snap-center cursor-pointer min-h-[44px] ${
                      item.isDisabled
                        ? "opacity-35 bg-slate-50 border-slate-200 cursor-not-allowed"
                        : item.isSelected
                        ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-300 shadow-xs"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                    title={item.disabledReason || `${item.weekday}, ${item.displayDate} · From ₹${item.lowestFare}`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold leading-tight">
                      <span className={item.isSelected ? "text-blue-900" : "text-slate-500"}>
                        {item.weekday}
                      </span>
                      <span className={item.isSelected ? "font-black text-blue-900" : "text-slate-900"}>
                        {item.displayDate}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono font-black text-slate-900 leading-tight">
                      ₹{item.lowestFare.toLocaleString("en-IN")}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-semibold leading-tight">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                      <span className={item.isSelected ? "text-blue-950 font-bold" : "text-slate-600"}>
                        {item.statusLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Quick Filter Chips Bar */}
            <div className="flex flex-col gap-2.5 mb-5 bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
              {/* Sort Chips Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Sort:
                </span>
                {[
                  { id: "duration", label: "Fastest" },
                  { id: "fare", label: "Cheapest" },
                  { id: "departure", label: "Earliest" },
                  { id: "availability", label: "Best availability" },
                ].map((s) => {
                  const isActive = filters.sortBy === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, sortBy: s.id as any }))}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-[#2563EB] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Quick Filters Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Class:
                </span>

                {/* Class Filters (SL, 3A, 2A, First Class) */}
                {(["SL", "3A", "2A", "1A"] as TravelClassCode[]).map((cls) => {
                  const isSelected = filters.classes.includes(cls);
                  const label = cls === "1A" ? "First Class" : cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          classes: isSelected
                            ? prev.classes.filter((c) => c !== cls)
                            : [...prev.classes, cls],
                        }));
                      }}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border-blue-400 ring-1 ring-blue-300"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                <div className="h-4 w-px bg-slate-200 shrink-0 mx-1" />

                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Time:
                </span>

                {/* Departure Time Slots */}
                {[
                  { id: "early_morning", label: "Early Morning" },
                  { id: "morning", label: "Morning" },
                  { id: "afternoon", label: "Afternoon" },
                  { id: "night", label: "Night" },
                ].map((time) => {
                  const isSelected = filters.departureTime.includes(time.id);
                  return (
                    <button
                      key={time.id}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          departureTime: isSelected
                            ? prev.departureTime.filter((t) => t !== time.id)
                            : [...prev.departureTime, time.id],
                        }));
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                        isSelected
                          ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {time.label}
                    </button>
                  );
                })}

                {/* Reset Filters shortcut if any active */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        departureTime: [],
                        classes: [],
                        trainTypes: [],
                        sortBy: "departure",
                      })
                    }
                    className="min-h-[38px] px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold shrink-0 ml-auto cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Train Cards List: Preview First (Initial 3 Trains, Expand on Demand) */}
            <div className="flex flex-col gap-4">
              <ErrorBoundary fallbackTitle="Unable to render train cards">
                {isLoading ? (
                  <>
                    <SkeletonTrainCard />
                    <SkeletonTrainCard />
                    <SkeletonTrainCard />
                  </>
                ) : filteredTrains.length > 0 ? (
                  <>
                    {(showAllTrains ? filteredTrains : filteredTrains.slice(0, 3)).map((train) => {
                      const hasWaitlist = train.classes.some((c) => c.status === "WL" || c.status === "RAC");
                      return (
                        <div key={train.id} className="flex flex-col gap-2">
                          <TrainCard
                            train={train}
                            quota={searchParams.quota}
                            journeyDate={searchParams.journeyDate}
                            passengerCount={passengerCount}
                            badges={smartPickBadges[train.id] || []}
                            onBookNow={handleOpenBooking}
                            onSelectClass={(t, c) => {
                              setActiveMobileTrain(t);
                              setActiveMobileClass(c);
                            }}
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
                    })}

                    {/* Expand on demand button */}
                    {!showAllTrains && filteredTrains.length > 3 && (
                      <div className="flex justify-center pt-2 pb-4">
                        <button
                          type="button"
                          onClick={() => setShowAllTrains(true)}
                          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
                        >
                          <span>Show all {filteredTrains.length} trains</span>
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    )}
                    {/* Split Ticket Alternative Card */}
                    {splitAlternatives.length > 0 && (
                      <div className="mt-4 mb-2">
                        <SplitTicketCard
                          alternative={splitAlternatives[0]}
                          journeyDate={searchParams.journeyDate}
                          passengerCount={passengerCount}
                          directTrain={filteredTrains[0]}
                          onSelectSplit={(alt) => {
                            alert(
                              `Selected Split Journey: Leg 1 on Train ${alt.leg1.trainNumber} to ${alt.intermediateStation.code}, then Leg 2 on Train ${alt.leg2.trainNumber} to ${alt.leg2.toCode}.`
                            );
                            setCurrentStep("PASSENGERS");
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center w-full bg-white border border-slate-200 rounded-2xl p-6 text-center">
                    <EmptyState
                      type="trains"
                      onAction={() => {
                        setFilters({
                          departureTime: [],
                          classes: [],
                          trainTypes: [],
                          sortBy: "departure",
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          departureTime: [],
                          classes: [],
                          trainTypes: [],
                          sortBy: "departure",
                        })
                      }
                      className="mt-3 min-h-[44px] px-5 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </div>

          {/* Full Filters Drawer: Slide-over on Desktop, Bottom Sheet on Mobile */}
          {isFiltersDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div
                onClick={() => setIsFiltersDrawerOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
              />

              {/* Drawer Container */}
              <div
                className="relative z-10 w-full sm:max-w-md lg:max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
                role="dialog"
                aria-modal="true"
                aria-labelledby="filters-drawer-title"
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 id="filters-drawer-title" className="text-base font-black text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                    <span>Filter & Sort Trains</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFiltersDrawerOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Close filters drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
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
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        departureTime: [],
                        classes: [],
                        trainTypes: [],
                        sortBy: "departure",
                      })
                    }
                    className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white transition cursor-pointer"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFiltersDrawerOpen(false)}
                    className="min-h-[44px] flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Apply Filters ({filteredTrains.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Continuation Bar (Unified Desktop & Mobile) */}
          {activeMobileTrain && activeMobileClass && currentStep === "SEARCH" && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-500 truncate">
                    {activeMobileTrain.number} · {activeMobileTrain.name}
                  </div>
                  <div className="text-sm font-black text-slate-900 truncate">
                    {activeMobileClass.classCode === "1A" ? "First Class" : activeMobileClass.classCode} · ₹{(activeMobileClass.fare * passengerCount).toLocaleString("en-IN")}
                    {passengerCount > 1 && (
                      <span className="text-xs text-slate-500 font-normal ml-1.5">
                        <span className="sm:hidden">({passengerCount} pax)</span>
                        <span className="hidden sm:inline">({passengerCount} passengers)</span>
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleOpenBooking(activeMobileTrain, activeMobileClass)}
                  className="min-h-[44px] px-6 py-2.5 text-xs sm:text-sm font-extrabold tracking-wide shrink-0 shadow-sm cursor-pointer"
                >
                  Continue with {activeMobileClass.classCode === "1A" ? "First Class" : activeMobileClass.classCode} · ₹{(activeMobileClass.fare * passengerCount).toLocaleString("en-IN")}
                </Button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* 3 Informational Sections Below Hero Before Footer */}
      {currentStep === "SEARCH" && (
        <HomeInfoSections
          lang={lang}
          onOpenScamModal={() => setShowScamModal(true)}
        />
      )}

      {/* VIEW B: Real-Time Live Passenger Management Screen */}
      {currentStep === "PASSENGERS" && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          <ErrorBoundary fallbackTitle="Passenger Manager Encountered an Error">
            <LivePassengerManager
              train={selectedTrain}
              selectedClass={selectedClass}
              quota={searchParams.quota as QuotaCode}
              passengers={passengers}
              onChangePassengers={setPassengers}
              onProceedToReview={handleProceedToReview}
              onBackToTrains={() => setCurrentStep("SEARCH")}
            />
          </ErrorBoundary>
        </main>
      )}

      {/* VIEW C: Review & Captcha Modal (Step REVIEW) */}
      {selectedTrain && selectedClass && (
        <ReviewAndCaptchaModal
          isOpen={showReviewCaptcha}
          onClose={() => {
            setShowReviewCaptcha(false);
            setCurrentStep("PASSENGERS");
          }}
          train={selectedTrain}
          classInfo={selectedClass}
          quota={searchParams.quota as QuotaCode}
          journeyDate={searchParams.journeyDate}
          passengers={passengers}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* VIEW D: Payment Modal with Auto-Fallback (Step PAYMENT) */}
      {selectedClass && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setCurrentStep("PASSENGERS");
          }}
          totalAmount={selectedClass.totalFare * Math.max(1, passengers.length)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailureSimulated={handlePaymentFailureSimulated}
        />
      )}

      {/* VIEW E: Confirmed E-Ticket Modal & Slip (Step TICKET) */}
      <ConfirmedETicketModal
        isOpen={showETicketModal}
        onClose={() => {
          setShowETicketModal(false);
          setCurrentStep("SEARCH");
        }}
        booking={confirmedBooking}
      />

      {/* Aux 1: Virtual Waiting Room (Admission Token Generation) */}
      <VirtualWaitingRoom
        isOpen={showWaitingRoom}
        onAdmitted={handleQueueAdmitted}
      />

      {/* Aux 2: Auto-Refund & Reconciliation Tracker */}
      <AutoRefundTracker
        isOpen={showAutoRefundTracker}
        onClose={() => setShowAutoRefundTracker(false)}
        failedTransaction={failedTx}
        onRetryWithBackup={() => {
          setShowAutoRefundTracker(false);
          setShowPaymentModal(true);
        }}
      />

      {/* Aux 3: Live PNR Lookup Modal */}
      <PNRLookupModal
        isOpen={showPnrModal}
        onClose={() => setShowPnrModal(false)}
        onViewBookingDetails={(booking) => {
          setConfirmedBooking(booking);
          setShowPnrModal(false);
          setShowETicketModal(true);
          setCurrentStep("TICKET");
        }}
      />

      {/* Aux 4: Railway Anti-Scam Advisory */}
      <ScamAdvisoryModal
        isOpen={showScamModal}
        onClose={() => setShowScamModal(false)}
      />

      {/* Aux 5: Bot Shield Admin Telemetry Dashboard */}
      <AdminBotShieldDashboard
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      {/* Tatkal Safety Net 1: Regret Shield Bottom Sheet (<100ms Pre-Payment Check) */}
      <RegretShieldSheet
        isOpen={showRegretShieldSheet}
        issues={regretShieldIssues}
        onApplyFix={handleApplySafetyFix}
        onProceedAnyway={handleProceedAnywayFromSafety}
        onClose={() => setShowRegretShieldSheet(false)}
      />

      {/* Tatkal Safety Net 2: Group Split Coordinator Modal (>4 Pax) */}
      <GroupSplitModal
        isOpen={showGroupSplitModal}
        onClose={() => setShowGroupSplitModal(false)}
        passengers={passengers}
        trainName={selectedTrain?.trainName}
        trainNumber={selectedTrain?.trainNumber}
        onProceedWithBatch={(batchPax) => {
          setPassengers(batchPax);
          setCurrentStep("REVIEW");
          setShowReviewCaptcha(true);
        }}
      />

      {/* Tatkal Safety Net 3: Configurable Rules & Telemetry Admin */}
      <SafetyNetAdminModal
        isOpen={showSafetyNetAdmin}
        onClose={() => setShowSafetyNetAdmin(false)}
      />

      {/* Tatkal Safety Net 4: Failure Autopsy & Timeline Modal */}
      {showAutopsyModal && latestAutopsy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowAutopsyModal(false)} />
          <div className="relative w-full max-w-xl z-10">
            <FailureAutopsyCard
              autopsy={latestAutopsy}
              onRetry={() => {
                setShowAutopsyModal(false);
                setShowPaymentModal(true);
              }}
              onTryAlternative={() => {
                setShowAutopsyModal(false);
                setCurrentStep("SEARCH");
              }}
            />
          </div>
        </div>
      )}

      {/* Global Footer with Safety Net Verification Notice */}
      <footer className="border-t-2 border-slate-900 bg-white py-8 mt-12 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-black text-slate-950 text-sm">TatkalPro Safety Net</span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                Rules last verified: 04 Nov 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Official Indian Railways (IRCTC/CRIS) rules prevail. Zero non-refundable mistakes · In-memory real-time pre-check.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafetyNetAdmin(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-700 text-slate-900 font-bold transition cursor-pointer shadow-2xs"
            >
              Safety Rules Admin
            </button>
            <button
              type="button"
              onClick={() => setShowGroupSplitModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0A3D78] hover:bg-[#072F5E] text-white font-bold transition cursor-pointer shadow-2xs"
            >
              Group Split (&gt; 4 Pax)
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Gnani Voice Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setShowVoiceModal(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          aria-label="Open Voice Booking Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <Mic className="w-4 h-4" />
          <span>Voice Agent</span>
        </button>
      </div>

      {/* Voice Booking Modal (Gnani.ai Prisma STT & Timbre TTS) */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowVoiceModal(false)} />
          <div className="relative w-full max-w-xl z-10">
            <VoiceBooking
              isOpen={showVoiceModal}
              onClose={() => setShowVoiceModal(false)}
              onApplyRoute={(from, to) => {
                setShowVoiceModal(false);
                const fromStationCode = from.toLowerCase().includes("delhi") ? "NDLS" : from;
                const toStationCode = to.toLowerCase().includes("mumbai") ? "MMCT" : to;
                setSearchParams((prev) => ({
                  ...prev,
                  fromStation: fromStationCode,
                  toStation: toStationCode,
                }));
                handleSearch({
                  fromStation: fromStationCode,
                  toStation: toStationCode,
                  journeyDate: searchParams.journeyDate,
                  quota: searchParams.quota,
                });
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
