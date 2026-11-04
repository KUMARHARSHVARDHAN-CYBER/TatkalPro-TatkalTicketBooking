"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  X,
  Check,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Passenger } from "../lib/railway/types";

interface PassengerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPassengers: Passenger[];
  onUpdateSelectedPassengers: (passengers: Passenger[]) => void;
}

const DEFAULT_MASTER_PASSENGERS: Passenger[] = [
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
  {
    id: "p_3",
    name: "Amitabh Verma",
    age: 62,
    gender: "M",
    berthPreference: "LOWER",
    foodPreference: "VEG",
    idType: "PAN",
    idNumber: "XXXXX4920K",
  },
];

export const PassengerSheet: React.FC<PassengerSheetProps> = ({
  isOpen,
  onClose,
  selectedPassengers,
  onUpdateSelectedPassengers,
}) => {
  const [masterList, setMasterList] = useState<Passenger[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tatkal_master_passengers");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_MASTER_PASSENGERS;
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState(28);
  const [newGender, setNewGender] = useState<"M" | "F" | "O">("M");
  const [newBerth, setNewBerth] = useState<Passenger["berthPreference"]>("NO_PREFERENCE");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tatkal_master_passengers", JSON.stringify(masterList));
    }
  }, [masterList]);

  if (!isOpen) return null;

  const togglePassenger = (passenger: Passenger) => {
    const isSelected = selectedPassengers.some((p) => p.id === passenger.id);
    if (isSelected) {
      onUpdateSelectedPassengers(selectedPassengers.filter((p) => p.id !== passenger.id));
    } else {
      if (selectedPassengers.length >= 4) {
        alert("IRCTC Tatkal guidelines restrict maximum 4 passengers per booking transaction.");
        return;
      }
      onUpdateSelectedPassengers([...selectedPassengers, passenger]);
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newP: Passenger = {
      id: `p_${Date.now()}`,
      name: newName.trim(),
      age: Number(newAge),
      gender: newGender,
      berthPreference: newBerth,
      idType: "AADHAAR",
    };

    setMasterList([...masterList, newP]);
    if (selectedPassengers.length < 4) {
      onUpdateSelectedPassengers([...selectedPassengers, newP]);
    }
    setIsAddingNew(false);
    setNewName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Master Passenger List</h3>
              <p className="text-[10px] text-slate-400">1-tap autofill for Tatkal rush (Max 4)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Count Indicator */}
        <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs mb-3">
          <span className="text-slate-300">
            Selected for Booking: <strong className="text-orange-400 font-mono">{selectedPassengers.length} / 4</strong>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Auto-Saved
          </span>
        </div>

        {/* Master Passenger List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 mb-3">
          {masterList.map((passenger) => {
            const isSelected = selectedPassengers.some((p) => p.id === passenger.id);
            return (
              <div
                key={passenger.id}
                onClick={() => togglePassenger(passenger)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? "bg-[#112a52] border-orange-500/80 shadow-md shadow-orange-500/10"
                    : "bg-[#091529] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      isSelected
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{passenger.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({passenger.gender === "M" ? "Male" : "Female"}, {passenger.age} yrs)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Berth: {passenger.berthPreference}</span>
                      <span>•</span>
                      <span>ID: {passenger.idType || "Aadhaar"}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-orange-400 font-mono">
                  {isSelected ? "ADDED" : "+ ADD"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Add New Passenger Trigger or Form */}
        {isAddingNew ? (
          <form onSubmit={handleAddNew} className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 flex flex-col gap-2.5 mb-2">
            <span className="text-xs font-bold text-slate-200">New Passenger Details</span>
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                required
                placeholder="Full Name as on Govt ID"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-6 bg-[#112240] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                required
                min={1}
                max={120}
                placeholder="Age"
                value={newAge}
                onChange={(e) => setNewAge(Number(e.target.value))}
                className="col-span-2 bg-[#112240] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center"
              />
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as any)}
                className="col-span-2 bg-[#112240] border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <select
                value={newBerth}
                onChange={(e) => setNewBerth(e.target.value as any)}
                className="col-span-2 bg-[#112240] border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-white"
              >
                <option value="LOWER">Lower</option>
                <option value="MIDDLE">Middle</option>
                <option value="UPPER">Upper</option>
                <option value="SIDE_LOWER">SL</option>
                <option value="NO_PREFERENCE">None</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold"
              >
                Save to Master List
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-orange-500/60 text-xs font-bold text-slate-300 hover:text-orange-400 transition flex items-center justify-center gap-1.5 mb-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Passenger to Master List</span>
          </button>
        )}

        {/* Done / Confirm selection */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition"
        >
          Confirm {selectedPassengers.length} Passenger(s) Selection
        </button>

      </div>
    </div>
  );
};

export default PassengerSheet;

