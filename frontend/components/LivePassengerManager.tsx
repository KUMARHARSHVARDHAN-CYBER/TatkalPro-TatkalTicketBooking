"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  HeartHandshake,
  Baby,
  Edit2,
  Check,
} from "lucide-react";
import { Passenger, TrainSchedule, ClassFareAndAvailability, QuotaCode } from "../lib/railway/types";
import { Button } from "./ui/Button";
import { TextInput } from "./ui/TextInput";
import { Toast } from "./ui/Feedback";

interface LivePassengerManagerProps {
  train: TrainSchedule | null;
  selectedClass: ClassFareAndAvailability | null;
  quota: QuotaCode;
  passengers: Passenger[];
  onChangePassengers: (passengers: Passenger[]) => void;
  onProceedToReview: () => void;
  onBackToTrains: () => void;
}

export const MASTER_PASSENGER_DIRECTORY: Passenger[] = [
  {
    id: "master_1",
    name: "Aarav Sharma",
    age: 28,
    gender: "M",
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "AADHAAR",
    idNumber: "XXXXXXXX4829",
    nationality: "Indian",
  },
  {
    id: "master_2",
    name: "Priya Sharma",
    age: 27,
    gender: "F",
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "AADHAAR",
    idNumber: "XXXXXXXX1904",
    nationality: "Indian",
  },
  {
    id: "master_3",
    name: "Amitabh Verma",
    age: 62,
    gender: "M",
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "PAN",
    idNumber: "XXXXX4920K",
    nationality: "Indian",
  },
  {
    id: "master_4",
    name: "Sunita Verma",
    age: 58,
    gender: "F",
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "AADHAAR",
    idNumber: "XXXXXXXX8821",
    nationality: "Indian",
  },
];

export const LivePassengerManager: React.FC<LivePassengerManagerProps> = ({
  train,
  selectedClass,
  quota,
  passengers,
  onChangePassengers,
  onProceedToReview,
  onBackToTrains,
}) => {
  // Inline Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">(28);
  const [gender, setGender] = useState<Passenger["gender"]>("M");
  const [berthPreference, setBerthPreference] = useState<Passenger["berthPreference"]>("LOWER");
  const [foodPreference, setFoodPreference] = useState<Passenger["foodPreference"]>("VEG");
  const [idType, setIdType] = useState<NonNullable<Passenger["idType"]>>("AADHAAR");
  const [idNumber, setIdNumber] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 5-Second Undo Toast
  const [recentlyRemoved, setRecentlyRemoved] = useState<{ passenger: Passenger; index: number } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 8-minute seat-hold countdown timer
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(480);
  const [saveStatus, setSaveStatus] = useState<string>("Draft Autosaved");

  // Tatkal quota enforces maximum 4 passengers per booking
  const maxAllowed = quota === "TATKAL" || quota === "PREMIUM_TATKAL" ? 4 : 6;
  const isTatkalLimitReached = passengers.length >= maxAllowed;

  // Seat hold countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setHoldSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autosave simulation on passenger changes (<200ms)
  useEffect(() => {
    setSaveStatus("Syncing live fare...");
    const t = setTimeout(() => {
      setSaveStatus("Draft Autosaved");
    }, 180);
    return () => clearTimeout(t);
  }, [passengers]);

  // Format hold timer
  const mins = Math.floor(holdSecondsRemaining / 60);
  const secs = holdSecondsRemaining % 60;
  const holdTimer = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Helper for Initials (e.g. Aarav Sharma -> AS)
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Add passenger from pre-saved master list (1-Tap)
  const handleQuickAddMaster = (master: Passenger) => {
    if (isTatkalLimitReached) {
      alert(`Tatkal quota limit reached: Maximum ${maxAllowed} passengers per ticket.`);
      return;
    }
    const newPassenger: Passenger = {
      ...master,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    onChangePassengers([...passengers, newPassenger]);
  };

  // Reorder passengers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...passengers];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    onChangePassengers(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === passengers.length - 1) return;
    const reordered = [...passengers];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    onChangePassengers(reordered);
  };

  // Duplicate passenger
  const handleDuplicate = (p: Passenger) => {
    if (isTatkalLimitReached) {
      alert(`Tatkal quota limit reached: Maximum ${maxAllowed} passengers per ticket.`);
      return;
    }
    const duplicated: Passenger = {
      ...p,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${p.name} (Companion)`,
    };
    onChangePassengers([...passengers, duplicated]);
  };

  // Remove with 5-Second Undo Toast
  const handleRemovePassenger = (index: number) => {
    const removed = passengers[index];
    const updated = passengers.filter((_, i) => i !== index);
    onChangePassengers(updated);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setRecentlyRemoved({ passenger: removed, index });

    undoTimerRef.current = setTimeout(() => {
      setRecentlyRemoved(null);
    }, 5000);
  };

  // Undo removal
  const handleUndoRemove = () => {
    if (!recentlyRemoved) return;
    const restored = [...passengers];
    restored.splice(recentlyRemoved.index, 0, recentlyRemoved.passenger);
    onChangePassengers(restored);
    setRecentlyRemoved(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  // Start inline editing of an existing passenger
  const handleStartEdit = (p: Passenger) => {
    setEditingPassengerId(p.id);
    setName(p.name);
    setAge(p.age);
    setGender(p.gender);
    setBerthPreference(p.berthPreference);
    setFoodPreference(p.foodPreference);
    setIdType(p.idType || "AADHAAR");
    setIdNumber(p.idNumber || "");
    setErrors({});
  };

  // Save inline edits
  const handleSaveEdit = (passengerId: string) => {
    if (!name.trim()) {
      setErrors({ name: "Enter name exactly as on your photo ID." });
      return;
    }
    const updated = passengers.map((p) => {
      if (p.id === passengerId) {
        return {
          ...p,
          name: name.trim(),
          age: Number(age) || 28,
          gender,
          berthPreference,
          foodPreference,
          idType,
          idNumber: idNumber.trim() || p.idNumber,
        };
      }
      return p;
    });
    onChangePassengers(updated);
    setEditingPassengerId(null);
    setErrors({});
  };

  // Submit new passenger form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Enter name exactly as on your photo ID.";
    }
    if (!age || Number(age) <= 0 || Number(age) > 120) {
      newErrors.age = "Please enter a valid age (1-120).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPassenger: Passenger = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      age: Number(age),
      gender,
      berthPreference,
      foodPreference,
      idType,
      idNumber: idNumber.trim() || "XXXXXXXX4829",
      nationality: "Indian",
    };

    onChangePassengers([...passengers, newPassenger]);
    setName("");
    setAge(28);
    setShowAddForm(false);
    setErrors({});
  };

  // Live Fare Breakdown Calculations (<200ms reactive)
  const baseUnit = selectedClass?.baseFare || 2165;
  const tatkalUnit = quota === "TATKAL" ? (selectedClass?.tatkalCharge || 400) : 0;
  const superfastUnit = selectedClass?.superfastCharge || 45;
  const gstUnit = selectedClass?.gstAmount || 83;
  const pgFee = 15;

  const count = Math.max(1, passengers.length);
  const totalBase = baseUnit * count;
  const totalTatkal = tatkalUnit * count;
  const totalSuperfast = superfastUnit * count;
  const totalGst = gstUnit * count;
  const grandTotal = totalBase + totalTatkal + totalSuperfast + totalGst + pgFee;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-24">
      
      {/* Top Specimen Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Step 2 • Passengers
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              NDLS → MMCT • 06 Nov 2026 • 3A / Tatkal
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Passenger Details ({passengers.length}/{maxAllowed})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-validated against official Indian Railways passenger guidelines.
          </p>
        </div>

        {/* Live Seat Hold & Autosave Indicator */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>Seat hold: <strong className="font-mono text-slate-900 text-sm">{holdTimer}</strong></span>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Passengers Column (Left 7) + Live Fare Card (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Passenger Cards */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Quick Add from Master Directory (1-Tap) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Tap Add from Saved Master List
              </span>
              <span className="text-[11px] text-slate-400">Zero retyping</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MASTER_PASSENGER_DIRECTORY.map((master) => {
                const isAlreadyAdded = passengers.some((p) => p.name.toLowerCase() === master.name.toLowerCase());
                return (
                  <button
                    key={master.id}
                    type="button"
                    disabled={isAlreadyAdded || isTatkalLimitReached}
                    onClick={() => handleQuickAddMaster(master)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isAlreadyAdded
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : isTatkalLimitReached
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                        : "bg-blue-50 hover:bg-blue-100 text-[#2563EB] border-blue-200 hover:border-blue-300 shadow-2xs"
                    }`}
                  >
                    <span>{master.name} ({master.age}, {master.gender})</span>
                    {isAlreadyAdded ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> : <Plus className="w-3.5 h-3.5 text-[#2563EB]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passenger Cards matching Figma Specimen */}
          <div className="flex flex-col gap-3">
            {passengers.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800">No Passengers Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Tap any passenger from your master list above, or enter details below.
                </p>
              </div>
            ) : (
              passengers.map((p, idx) => {
                const isEditing = editingPassengerId === p.id;
                const isSeniorCitizen = (p.gender === "M" && p.age >= 60) || (p.gender === "F" && p.age >= 45);

                if (isEditing) {
                  // Figma Specimen: Passenger Card - Edit State
                  return (
                    <div
                      key={p.id}
                      className="bg-white border-2 border-[#2563EB] rounded-2xl p-5 shadow-md flex flex-col gap-4 animate-in fade-in-50 duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                            {getInitials(name || p.name)}
                          </div>
                          <span className="text-sm font-bold text-slate-900">Editing Passenger #{idx + 1}</span>
                        </div>
                        <span className="text-xs text-slate-400">Photo ID Verification</span>
                      </div>

                      {/* Full Name */}
                      <TextInput
                        label="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        helperText="Enter the name on your photo ID."
                        error={errors.name}
                      />

                      {/* Age & Gender Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <TextInput
                          label="Age"
                          type="number"
                          value={age}
                          onChange={(e) => setAge(Number(e.target.value))}
                          placeholder="28"
                        />
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700">Gender</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                            className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="T">Transgender</option>
                          </select>
                        </div>
                      </div>

                      {/* Berth Preference Dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700">Berth preference</label>
                        <select
                          value={berthPreference}
                          onChange={(e) => setBerthPreference(e.target.value as any)}
                          className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                          <option value="LOWER">Lower berth</option>
                          <option value="MIDDLE">Middle berth</option>
                          <option value="UPPER">Upper berth</option>
                          <option value="SIDE_LOWER">Side Lower</option>
                          <option value="SIDE_UPPER">Side Upper</option>
                          <option value="NO_PREFERENCE">No preference</option>
                        </select>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Preferences are subject to availability.
                        </p>
                      </div>

                      {/* Govt ID Verification Field */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-4 flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700">Govt ID type</label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value as any)}
                            className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                          >
                            <option value="AADHAAR">Aadhaar card</option>
                            <option value="PAN">PAN card</option>
                            <option value="PASSPORT">Passport</option>
                            <option value="VOTER_ID">Voter ID</option>
                          </select>
                        </div>
                        <div className="sm:col-span-8">
                          <TextInput
                            label="Govt ID number"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            placeholder={idType === "AADHAAR" ? "12-digit Aadhaar number" : idType === "PAN" ? "10-digit PAN" : "ID Number"}
                            helperText="Demo only. Please don't enter real ID numbers."
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button variant="ghost" size="sm" onClick={() => setEditingPassengerId(null)}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleSaveEdit(p.id)} leftIcon={<Check className="w-3.5 h-3.5" />}>
                          Save details
                        </Button>
                      </div>
                    </div>
                  );
                }

                // Figma Specimen: Passenger Card - View State
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2563EB] font-bold text-sm flex items-center justify-center shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-extrabold text-slate-900">{p.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {p.age} years · {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}
                          </p>
                        </div>
                      </div>

                      {/* Edit & Reorder buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Passenger"
                        >
                          <Edit2 className="w-4 h-4 text-[#2563EB]" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === passengers.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePassenger(idx)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove Passenger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Specimen Tags: Berth & Meal */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                        {p.berthPreference === "LOWER" ? "Lower berth preferred" : `${p.berthPreference} berth`}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                        {p.foodPreference === "VEG" ? "Veg meal" : "Non-Veg meal"}
                      </span>
                      {p.idNumber && (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                          {p.idType || "Aadhaar"}: {p.idNumber}
                        </span>
                      )}
                      {isSeniorCitizen && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px]">
                          <HeartHandshake className="w-3 h-3 text-amber-600" /> Senior Citizen
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Passenger CTA */}
          {!showAddForm && !isTatkalLimitReached && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowAddForm(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Passenger ({passengers.length}/{maxAllowed})
            </Button>
          )}

          {/* Inline Add Passenger Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="bg-white border-2 border-[#2563EB] rounded-2xl p-5 shadow-md flex flex-col gap-4 animate-in fade-in-50"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Add Passenger Details</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <TextInput
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                helperText="Enter the name on your photo ID."
                error={errors.name}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  placeholder="28"
                  error={errors.age}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="T">Transgender</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Berth preference</label>
                <select
                  value={berthPreference}
                  onChange={(e) => setBerthPreference(e.target.value as any)}
                  className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="LOWER">Lower berth</option>
                  <option value="MIDDLE">Middle berth</option>
                  <option value="UPPER">Upper berth</option>
                  <option value="SIDE_LOWER">Side Lower</option>
                  <option value="SIDE_UPPER">Side Upper</option>
                  <option value="NO_PREFERENCE">No preference</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium">Preferences are subject to availability.</p>
              </div>

              {/* Govt ID Verification Field */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Govt ID type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                    className="h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-900 font-medium focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="AADHAAR">Aadhaar card</option>
                    <option value="PAN">PAN card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                </div>
                <div className="sm:col-span-8">
                  <TextInput
                    label="Govt ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={idType === "AADHAAR" ? "12-digit Aadhaar number" : idType === "PAN" ? "10-digit PAN" : "ID Number"}
                    helperText="Demo only. Please don't enter real ID numbers."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Passenger
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Right Column: Live Fare Card & Sticky Bar */}
        <div className="lg:col-span-5 sticky top-24 flex flex-col gap-4">
          
          {/* Live Fare Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Fare Summary
              </span>
              <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {passengers.length} {passengers.length === 1 ? "Adult" : "Adults"}
              </span>
            </div>

            {/* Line items */}
            <div className="flex flex-col gap-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Base Fare ({passengers.length} × ₹{baseUnit})</span>
                <span className="font-mono font-semibold text-slate-800">₹{totalBase.toLocaleString("en-IN")}</span>
              </div>
              {tatkalUnit > 0 && (
                <div className="flex justify-between">
                  <span>Tatkal Charges ({passengers.length} × ₹{tatkalUnit})</span>
                  <span className="font-mono font-semibold text-slate-800">₹{totalTatkal.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Superfast Surcharge</span>
                <span className="font-mono font-semibold text-slate-800">₹{totalSuperfast.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-mono font-semibold text-slate-800">₹{totalGst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Gateway Convenience Fee</span>
                <span className="font-mono font-semibold text-slate-800">₹{passengers.length > 0 ? pgFee : 0}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Total · {passengers.length} adult</span>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">All-Inclusive</span>
            </div>

            {/* Actions matching Figma Fare summary bar specimen */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                disabled={passengers.length === 0}
                onClick={onProceedToReview}
              >
                Review journey
              </Button>
              <Button variant="ghost" fullWidth onClick={onBackToTrains}>
                ← Back to Train List
              </Button>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Tatkal guidelines: Maximum 4 passengers allowed per PNR. Demo only. Please don&apos;t enter real ID numbers.</span>
          </div>

        </div>

      </div>

      {/* 5-Second Undo Toast */}
      {recentlyRemoved && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <Toast
            type="undo"
            message={`Passenger removed: ${recentlyRemoved.passenger.name}`}
            onUndo={handleUndoRemove}
          />
        </div>
      )}

    </div>
  );
};

export default LivePassengerManager;
