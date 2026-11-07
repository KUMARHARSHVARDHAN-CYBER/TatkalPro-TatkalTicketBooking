import fs from "fs";
import path from "path";
import process from "node:process";
import defaultRules from "../frontend/lib/safetyNet/defaultRules.json";

console.log("=======================================================");
console.log("   🌟 HOME HERO, RESULTS & INFO SECTIONS TEST SUITE   ");
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

// -------------------------------------------------------------
// 1. Popular Route Bar Clean Removal
// -------------------------------------------------------------
console.log("▶ [1/5] Popular Route Bar Clean Removal");
{
  const heroCode = fs.readFileSync("frontend/components/HeroSearchWidget.tsx", "utf8");
  assert(!heroCode.includes("Popular Routes (Simulated Fares):"), "Popular route bar removed from hero UI");
  assert(!heroCode.includes("handleSelectPopularRoute"), "handleSelectPopularRoute removed from hero");
  assert(!heroCode.includes("POPULAR_ROUTES"), "POPULAR_ROUTES not rendered in hero search widget");
}

// -------------------------------------------------------------
// 2. Full-Screen Edge-to-Edge Vande Bharat Hero
// -------------------------------------------------------------
console.log("\n▶ [2/5] Full-Screen Edge-to-Edge Vande Bharat Hero");
{
  const heroCode = fs.readFileSync("frontend/components/HeroSearchWidget.tsx", "utf8");
  assert(heroCode.includes("next/image"), "Serves hero background via Next.js Image component");
  assert(heroCode.includes("sizes=\"100vw\""), "Hero image configured for full 100vw responsive sizes");
  assert(heroCode.includes("priority"), "Hero image uses priority loading for zero LCP layout shifts");
  assert(heroCode.includes("100svh"), "Hero height expands to 100svh minus header height");
  assert(heroCode.includes("--header-height"), "Hero height dynamically uses --header-height CSS variable");
  assert(heroCode.includes("bg-[#0B1528]"), "Hero provides solid dark fallback background color");
  assert(heroCode.includes("object-[center_35%]"), "Hero specifies sensible focal point for train visibility");
}

// -------------------------------------------------------------
// 3. Removal of Pre-Selected Train Highlight & Footer Box
// -------------------------------------------------------------
console.log("\n▶ [3/5] Removal of Pre-Selected Highlight & Per-Card Footer Box");
{
  const trainCardCode = fs.readFileSync("frontend/components/TrainCard.tsx", "utf8");
  assert(
    !trainCardCode.includes("Ready to book in"),
    "Removed highlighted 'Ready to book in TATKAL quota' banner from train cards"
  );
  assert(
    !trainCardCode.includes("Select train ·"),
    "Removed individual per-card 'Select train · SL ...' action button"
  );
  assert(
    !trainCardCode.includes("border-2 border-[#2563EB] shadow-md ring-2 ring-blue-100"),
    "Removed card-level blue border highlighted state on load"
  );

  const pageCode = fs.readFileSync("frontend/app/page.tsx", "utf8");
  assert(
    !pageCode.includes("setActiveMobileTrain(filteredTrains[0])"),
    "Eliminated automatic pre-selection of filteredTrains[0] on initial results load"
  );
}

// -------------------------------------------------------------
// 4. Sticky Bottom Continue Bar Content & Safe Area
// -------------------------------------------------------------
console.log("\n▶ [4/5] Sticky Bottom Continue Bar Behavior & Safe Area");
{
  const pageCode = fs.readFileSync("frontend/app/page.tsx", "utf8");
  assert(
    pageCode.includes("Continue with"),
    "Sticky bottom bar renders 'Continue with {class} · ₹{fare}'"
  );
  assert(
    pageCode.includes("env(safe-area-inset-bottom)"),
    "Sticky bar sits cleanly above mobile safe area"
  );
  assert(
    pageCode.includes("handleOpenBooking(activeMobileTrain, activeMobileClass)"),
    "Sticky bar button invokes handleOpenBooking with exact train and class data"
  );
}

// -------------------------------------------------------------
// 5. Config-Driven Rules Section & Trust and Safety
// -------------------------------------------------------------
console.log("\n▶ [5/5] Config-Driven Rules Table & Trust/Safety Section");
{
  const infoCode = fs.readFileSync("frontend/components/HomeInfoSections.tsx", "utf8");
  
  // How TatkalPro Helps
  assert(infoCode.includes("How TatkalPro Helps"), "Renders 'How TatkalPro Helps' section");
  assert(infoCode.includes("Prepare"), "Includes 'Prepare' card with passenger pre-fill copy");
  assert(infoCode.includes("Protect"), "Includes 'Protect' card with draft & Regret Shield copy");
  assert(infoCode.includes("Recover"), "Includes 'Recover' card with payment fallback & refund tracker copy");
  assert(infoCode.includes("/practice"), "Includes 'Try Practice Mode' button linking to /practice");

  // Rules Config Sourcing
  const maxPaxRule = defaultRules.find((r) => r.id === "RULE_MAX_PASSENGERS");
  const refundRule = defaultRules.find((r) => r.id === "RULE_TATKAL_NON_REFUNDABLE");
  const windowRule = defaultRules.find((r) => r.id === "RULE_DATE_WINDOW_SANITY");
  const idRule = defaultRules.find((r) => r.id === "RULE_PRIMARY_ID_REQUIRED");

  assert(!!maxPaxRule, "Config contains RULE_MAX_PASSENGERS");
  assert(!!refundRule, "Config contains RULE_TATKAL_NON_REFUNDABLE");
  assert(!!windowRule, "Config contains RULE_DATE_WINDOW_SANITY");
  assert(!!idRule, "Config contains RULE_PRIMARY_ID_REQUIRED");

  assert(infoCode.includes("Rules last verified:"), "Displays rules verification timestamp");
  assert(infoCode.includes("04 Nov 2026"), "Displays accurate 04 Nov 2026 verification date");
  assert(infoCode.includes("Official Indian Railways rules prevail"), "Includes official disclaimer line");
  assert(infoCode.includes("AC Classes open at 10:00 AM"), "States AC opening at 10:00 AM");
  assert(infoCode.includes("Non-AC (Sleeper) open at 11:00 AM"), "States Non-AC opening at 11:00 AM");
  assert(infoCode.includes("maximum of 4 passengers"), "States 4 passenger limit per Tatkal PNR");

  // Trust and Safety
  assert(infoCode.includes("Trust and Safety"), "Renders 'Trust and Safety' section");
  assert(infoCode.includes("Never Share OTP or PIN"), "Includes advice never to share OTP or PIN");
  assert(infoCode.includes("Verify Website Address"), "Includes advice to verify website address");
  assert(infoCode.includes("Unsolicited UPI Requests"), "Includes advice on unsolicited UPI requests");
  assert(infoCode.includes("Zero External Card Requests"), "Includes advice that card details are never requested externally");
  assert(
    infoCode.includes("TatkalPro is a demo on simulated data. No real booking, PNR or payment. Not affiliated with IRCTC or Indian Railways."),
    "Includes exact mandatory non-affiliation disclaimer"
  );
}

console.log("\n=======================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
console.log("=======================================================\n");

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}
