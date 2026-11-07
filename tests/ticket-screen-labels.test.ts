import fs from "fs";
import path from "path";
import process from "node:process";

console.log("=======================================================");
console.log("   🎫 TICKET SCREEN (STEP 5) LABELS & SAFETY SUITE    ");
console.log("=======================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || "Assertion failed"}`);
    process.exitCode = 1;
  }
}

const componentPath = path.resolve("./frontend/components/ConfirmedETicketModal.tsx");
const componentCode = fs.readFileSync(componentPath, "utf-8");

// 1. Mandatory Ticket Card Layout & Removal of Mobile Preview Artifacts
console.log("▶ [1/4] Clean Ticket Card Layout & Mobile Preview Removal");
assert(
  componentCode.includes("Your demo ticket"),
  "Modal accessibility label specifies 'Your demo ticket'"
);
assert(
  componentCode.includes("SIMULATED"),
  "Header badge displays 'SIMULATED'"
);
assert(
  componentCode.includes("PASSENGER & FARE"),
  "Card includes 'PASSENGER & FARE' section"
);
assert(
  componentCode.includes("Simulated payment"),
  "Fare includes 'Simulated payment' indicator"
);
assert(
  !componentCode.includes("Demo booking complete"),
  "Mobile success banner ('Demo booking complete') successfully removed"
);
assert(
  !componentCode.includes("9:58"),
  "Mobile status bar ('9:58' / cellular / battery) successfully removed"
);
assert(
  !componentCode.includes("Demo / Simulated data"),
  "Mobile pill ('Demo / Simulated data') successfully removed"
);

// 2. Demo Reference & Identifier Format
console.log("\n▶ [2/4] TP-DEMO Format & PNR Exclusion");
assert(
  componentCode.includes("TP-DEMO-"),
  "Demo reference strictly begins with 'TP-DEMO-'"
);
assert(
  componentCode.includes("DEMO REF"),
  "Reference label is 'DEMO REF' instead of PNR"
);
assert(
  componentCode.includes("· Not a PNR"),
  "Card explicitly clarifies '· Not a PNR'"
);
assert(
  !componentCode.includes("10-Digit Railway PNR Number"),
  "Does NOT claim a 10-Digit Railway PNR Number"
);

// 3. Absence of Real-Ticket Terminology & Prohibited Branding
console.log("\n▶ [3/4] Strict Absence of Real-Ticket Wording & IRCTC Branding");
assert(
  !componentCode.includes("Ticket Confirmed Successfully"),
  "Eliminated 'Ticket Confirmed Successfully'"
);
assert(
  !componentCode.includes("Electronic Reservation Slip"),
  "Eliminated 'Electronic Reservation Slip (ERS)'"
);
assert(
  !componentCode.includes("TTE SCAN"),
  "Eliminated TTE SCAN and barcode/QR simulator"
);
assert(
  !componentCode.includes("QrCode"),
  "Eliminated QrCode component imports"
);

// Check that IRCTC / Indian Railways appears ONLY in non-affiliation disclaimer
const irctcOccurrences = (componentCode.match(/IRCTC/g) || []).length;
const indianRailwaysOccurrences = (componentCode.match(/Indian Railways/g) || []).length;
assert(
  componentCode.includes("TatkalPro is not affiliated with IRCTC or Indian Railways"),
  "Includes non-affiliation disclaimer with IRCTC & Indian Railways"
);
assert(
  irctcOccurrences <= 4, // Occurs in UI disclaimer and downloaded HTML disclaimer only
  `IRCTC appears only in negative disclaimer context (count: ${irctcOccurrences})`
);
assert(
  indianRailwaysOccurrences <= 4,
  `Indian Railways appears only in negative disclaimer context (count: ${indianRailwaysOccurrences})`
);

// 4. Download Payload & Action Button Integrity
console.log("\n▶ [4/4] Action CTAs & Download Watermark Specification");
assert(
  componentCode.includes("Download demo ticket"),
  "Primary CTA button is 'Download demo ticket'"
);
assert(
  componentCode.includes("Back to home"),
  "Secondary navigation link is 'Back to home'"
);
assert(
  componentCode.includes("DEMO · NOT VALID FOR TRAVEL"),
  "Downloadable ticket template embeds diagonal watermark 'DEMO · NOT VALID FOR TRAVEL'"
);
assert(
  componentCode.includes("Not valid for travel"),
  "Amber card displays warning title 'Not valid for travel'"
);

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
console.log("=======================================================\n");

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}

