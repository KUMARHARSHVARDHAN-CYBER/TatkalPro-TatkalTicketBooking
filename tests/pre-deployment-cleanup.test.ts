import assert from "assert";
import fs from "fs";
import path from "path";

console.log("=======================================================");
console.log("   🧹 PRE-DEPLOYMENT CLEANUP VERIFICATION SUITE       ");
console.log("=======================================================\n");

const headerNavCode = fs.readFileSync(path.resolve("frontend/components/HeaderNav.tsx"), "utf-8");
const heroCode = fs.readFileSync(path.resolve("frontend/components/HeroSearchWidget.tsx"), "utf-8");
const layoutCode = fs.readFileSync(path.resolve("frontend/app/layout.tsx"), "utf-8");
const manifestCode = fs.readFileSync(path.resolve("frontend/public/manifest.json"), "utf-8");
const passengerCode = fs.readFileSync(path.resolve("frontend/components/LivePassengerManager.tsx"), "utf-8");
const adapterCode = fs.readFileSync(path.resolve("frontend/lib/railway/adapter.ts"), "utf-8");
const bookingModalCode = fs.readFileSync(path.resolve("frontend/components/BookingModal.tsx"), "utf-8");
const groupSplitCode = fs.readFileSync(path.resolve("frontend/components/safetyNet/GroupSplitModal.tsx"), "utf-8");
const scoringCode = fs.readFileSync(path.resolve("frontend/lib/practice/scoringConfig.ts"), "utf-8");
const autopsyCode = fs.readFileSync(path.resolve("frontend/lib/safetyNet/failureAutopsy.ts"), "utf-8");
const robotsTxtPath = path.resolve("frontend/public/robots.txt");
const robotsTxtContent = fs.existsSync(robotsTxtPath) ? fs.readFileSync(robotsTxtPath, "utf-8") : "";

// 1. Affiliation labels
console.log("▶ [1/5] Affiliation Labels & Specimen Wording");
assert(headerNavCode.includes("Tatkal toolkit"), "HeaderNav contains 'Tatkal toolkit'");
assert(!headerNavCode.includes("IRCTC Toolkit"), "HeaderNav does NOT contain 'IRCTC Toolkit'");
assert(headerNavCode.includes("Demo build"), "HeaderNav contains 'Demo build'");
assert(!headerNavCode.includes("Official Specimen · 44px Controls"), "HeaderNav does NOT contain 'Official Specimen · 44px Controls'");
assert(!headerNavCode.includes("Official IRCTC Scam & Fraud Advisory"), "HeaderNav does NOT claim 'Official IRCTC Scam & Fraud Advisory'");
assert(!layoutCode.includes("IRCTC Tatkal Railway Booking"), "Layout meta title does NOT claim official 'IRCTC Tatkal Railway Booking'");
assert(!manifestCode.includes("IRCTC Next-Gen Railway Booking"), "Manifest does NOT claim official 'IRCTC Next-Gen Railway Booking'");
console.log("  ✅ PASS: Affiliation labels replaced with neutral demo wording");

// 2. Visible Design-Spec Text
console.log("\n▶ [2/5] Removal of Visible Design-Spec Text");
assert(!heroCode.includes("The booking toolkit • Native editable specimens"), "Hero removed 'The booking toolkit • Native editable specimens'");
assert(!heroCode.includes("Inter · 8px spacing · 44px minimum controls · Zero lag booking flow"), "Hero removed 'Inter · 8px spacing · 44px minimum controls'");
assert(heroCode.includes("Tatkal Train Ticket Booking"), "Hero main h1 remains cleanly intact");
console.log("  ✅ PASS: Visible design-spec and specimen notes removed from UI");

// 3. Overpromising wording ("Guaranteed", "100% confirmed")
console.log("\n▶ [3/5] Removal of Overpromising Claims ('Guaranteed', '100% confirmed')");
assert(!adapterCode.includes("Both legs are 100% confirmed!"), "Adapter does NOT promise 'Both legs are 100% confirmed!'");
assert(!adapterCode.includes("Guaranteed confirmed seats!"), "Adapter does NOT promise 'Guaranteed confirmed seats!'");
assert(!bookingModalCode.includes("Zero Overselling Guarantee"), "BookingModal does NOT claim 'Zero Overselling Guarantee'");
assert(!groupSplitCode.includes("To guarantee zero booking rejections"), "GroupSplitModal does NOT claim 'To guarantee zero booking rejections'");
assert(!scoringCode.includes("guarantees entry"), "Practice scoring does NOT claim 'guarantees entry'");
assert(!autopsyCode.includes("Guaranteed 2-Leg Split Journey"), "Failure autopsy does NOT say 'Guaranteed 2-Leg Split Journey'");
console.log("  ✅ PASS: Overpromising claims replaced with neutral availability wording");

// 4. ID entry warning
console.log("\n▶ [4/5] ID Entry Warning Helper Text");
const warningText = "Demo only. Please don't enter real ID numbers.";
assert(passengerCode.includes(warningText), "LivePassengerManager includes ID warning helper text");
assert(passengerCode.includes("Govt ID number"), "LivePassengerManager renders ID number field label");
console.log("  ✅ PASS: Mandatory ID warning helper text present on ID inputs");

// 5. No Search Indexing (robots.txt & meta tag)
console.log("\n▶ [5/5] No Search Indexing Configuration");
assert(robotsTxtContent.includes("Disallow: /"), "robots.txt includes 'Disallow: /'");
assert(layoutCode.includes("robots: {"), "layout.tsx specifies robots metadata");
assert(layoutCode.includes("index: false"), "layout.tsx specifies index: false");
assert(layoutCode.includes("follow: false"), "layout.tsx specifies follow: false");
console.log("  ✅ PASS: robots.txt and noindex, nofollow metadata verified");

console.log("\n=======================================================");
console.log("   ALL PRE-DEPLOYMENT CLEANUP CHECKS PASSED! (5/5)     ");
console.log("=======================================================\n");

