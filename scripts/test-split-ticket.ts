/**
 * Test script for the Split-Ticket Graph Algorithm
 *
 * Demonstrates:
 * 1. Direct Train with available seats.
 * 2. Peak Tatkal Rush: Direct Train seats are 0 (Sold out/Waitlisted).
 *    Graph search finds two-leg split journeys with confirmed seats on both legs!
 * 3. Layover window validation (minimum connection buffer and maximum wait time).
 */

import {
  findSplitTicketJourney,
  TrainScheduleInfo,
} from "../src/algorithms/splitTicket";

const sampleRailwayNetwork: TrainScheduleInfo[] = [
  // Train 1: 12952 New Delhi - Mumbai Rajdhani
  {
    trainId: "train-rajdhani-12952",
    trainNumber: "12952",
    trainName: "Mumbai Rajdhani Express",
    stops: [
      { stationCode: "NDLS", stationName: "New Delhi", stopSequence: 1, arrivalTime: null, departureTime: "16:55", dayOffset: 0 },
      { stationCode: "KOTA", stationName: "Kota Junction", stopSequence: 2, arrivalTime: "21:30", departureTime: "21:40", dayOffset: 0 },
      { stationCode: "BRC", stationName: "Vadodara Junction", stopSequence: 3, arrivalTime: "03:20", departureTime: "03:30", dayOffset: 1 },
      { stationCode: "MMCT", stationName: "Mumbai Central", stopSequence: 4, arrivalTime: "08:35", departureTime: null, dayOffset: 1 },
    ],
    // Quota allocation simulation: Direct NDLS->MMCT is FULL (0 seats), but NDLS->KOTA has 10 seats!
    availableSeats: (from, to) => {
      if (from === "NDLS" && to === "MMCT") return 0; // Tatkal FULL on direct route
      if (from === "NDLS" && to === "KOTA") return 10; // Available intermediate
      if (from === "KOTA" && to === "BRC") return 4;
      return 0;
    },
  },

  // Train 2: 12954 August Kranti Tejas Rajdhani
  // Passes through Kota after Train 12952 arrives
  {
    trainId: "train-august-kranti-12954",
    trainNumber: "12954",
    trainName: "August Kranti Tejas Rajdhani",
    stops: [
      { stationCode: "NZM", stationName: "Hazrat Nizamuddin", stopSequence: 1, arrivalTime: null, departureTime: "17:15", dayOffset: 0 },
      { stationCode: "KOTA", stationName: "Kota Junction", stopSequence: 2, arrivalTime: "22:45", departureTime: "22:55", dayOffset: 0 },
      { stationCode: "ST", stationName: "Surat", stopSequence: 3, arrivalTime: "06:10", departureTime: "06:15", dayOffset: 1 },
      { stationCode: "MMCT", stationName: "Mumbai Central", stopSequence: 4, arrivalTime: "10:05", departureTime: null, dayOffset: 1 },
    ],
    // KOTA->MMCT has 15 seats available!
    availableSeats: (from, to) => {
      if (from === "KOTA" && to === "MMCT") return 15; // Leg 2 confirmed!
      return 0;
    },
  },

  // Train 3: 12904 Golden Temple Mail via Bhopal
  {
    trainId: "train-golden-temple-12904",
    trainNumber: "12904",
    trainName: "Golden Temple Mail",
    stops: [
      { stationCode: "NDLS", stationName: "New Delhi", stopSequence: 1, arrivalTime: null, departureTime: "07:20", dayOffset: 0 },
      { stationCode: "BPL", stationName: "Bhopal Junction", stopSequence: 2, arrivalTime: "17:40", departureTime: "17:50", dayOffset: 0 },
      { stationCode: "MMCT", stationName: "Mumbai Central", stopSequence: 3, arrivalTime: "05:20", departureTime: null, dayOffset: 1 },
    ],
    availableSeats: (from, to) => {
      if (from === "NDLS" && to === "MMCT") return 0;
      if (from === "NDLS" && to === "BPL") return 6;
      return 0;
    },
  },

  // Train 4: 12138 Punjab Mail departing from Bhopal
  {
    trainId: "train-punjab-mail-12138",
    trainNumber: "12138",
    trainName: "Punjab Mail",
    stops: [
      { stationCode: "BPL", stationName: "Bhopal Junction", stopSequence: 1, arrivalTime: null, departureTime: "19:15", dayOffset: 0 },
      { stationCode: "MMCT", stationName: "Mumbai Central", stopSequence: 2, arrivalTime: "07:35", departureTime: null, dayOffset: 1 },
    ],
    availableSeats: (from, to) => {
      if (from === "BPL" && to === "MMCT") return 8;
      return 0;
    },
  },
];

console.log("\n===============================================================================");
console.log("🔍 TESTING SPLIT-TICKET GRAPH ALGORITHM (NEW DELHI [NDLS] -> MUMBAI [MMCT])");
console.log("===============================================================================");

const result = findSplitTicketJourney("NDLS", "MMCT", sampleRailwayNetwork, {
  minLayoverMinutes: 30,  // minimum 30 mins to switch platforms safely
  maxLayoverMinutes: 300, // maximum 5 hours layover
  requestedSeats: 1,
});

console.log(`Direct Seats Available: ${result.hasDirectSeats ? "YES" : "NO (QUOTA EXHAUSTED)"}`);
console.log(`Status Message        : ${result.message}\n`);

if (result.splitTicketOptions.length > 0) {
  console.log(`🎯 Found ${result.splitTicketOptions.length} Two-Leg Split-Ticket Options:\n`);

  result.splitTicketOptions.forEach((opt, idx) => {
    console.log(`--- [Option ${idx + 1} via ${opt.intermediateStation}] ---`);
    console.log(`  Summary        : ${opt.summary}`);
    console.log(
      `  Leg 1 (Train ${opt.leg1.trainNumber} - ${opt.leg1.trainName}):`
    );
    console.log(
      `    ${opt.leg1.fromStation} (${opt.leg1.departureTime}) -> ${opt.leg1.toStation} (${opt.leg1.arrivalTime}) | Available Seats: ${opt.leg1.availableSeats}`
    );
    console.log(`  Layover at ${opt.intermediateStation}: ${opt.layoverMinutes} minutes`);
    console.log(
      `  Leg 2 (Train ${opt.leg2.trainNumber} - ${opt.leg2.trainName}):`
    );
    console.log(
      `    ${opt.leg2.fromStation} (${opt.leg2.departureTime}) -> ${opt.leg2.toStation} (${opt.leg2.arrivalTime}) | Available Seats: ${opt.leg2.availableSeats}`
    );
    console.log(`  Total Travel Time: ${Math.floor(opt.totalDurationMinutes / 60)}h ${opt.totalDurationMinutes % 60}m\n`);
  });
} else {
  console.log("No split routes found.");
}

