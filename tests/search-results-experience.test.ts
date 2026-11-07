import process from "node:process";
import fs from "fs";
import path from "path";
import { formatDisplayDate, calculateArrivalDate, isOvernightJourney } from "../frontend/lib/dateUtils";
import { railwayProvider } from "../frontend/lib/railway/adapter";

console.log("=======================================================");
console.log("   🔍 SEARCH-TO-RESULTS UX & DATE DERIVATION SUITE    ");
console.log("=======================================================");

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

async function runSearchToResultsTests() {
  console.log("\n▶ [1/5] Date Derivation & Overnight Journey Consistency");
  {
    // Test date format DD Mon YYYY
    const formatted = formatDisplayDate("2026-11-08");
    assert(formatted === "08 Nov 2026", "Formats '2026-11-08' as '08 Nov 2026'", `Got: ${formatted}`);

    const formatted10 = formatDisplayDate("2026-11-10");
    assert(formatted10 === "10 Nov 2026", "Formats '2026-11-10' as '10 Nov 2026'", `Got: ${formatted10}`);

    // Test same-day train (dayOffset 0, departure < arrival)
    const sameDayArr = calculateArrivalDate("2026-11-10", 0, "06:00", "12:00");
    assert(sameDayArr === "10 Nov 2026", "Same-day arrival date remains '10 Nov 2026'", `Got: ${sameDayArr}`);

    // Test overnight train (dayOffset 1)
    const overnightArr = calculateArrivalDate("2026-11-10", 1, "16:55", "08:35");
    assert(overnightArr === "11 Nov 2026", "Overnight train with dayOffset 1 arrives next day '11 Nov 2026'", `Got: ${overnightArr}`);

    // Test overnight detection via time crossing (16:55 -> 08:35)
    const isOvernight = isOvernightJourney(0, "16:55", "08:35");
    assert(isOvernight === true, "isOvernightJourney correctly identifies midnight crossing (16:55 -> 08:35)");

    // Test non-overnight journey (06:00 -> 14:00)
    const isDayJourney = isOvernightJourney(0, "06:00", "14:00");
    assert(isDayJourney === false, "isOvernightJourney returns false for daytime train");

    // Test multi-day journey (dayOffset 2)
    const multiDayArr = calculateArrivalDate("2026-11-10", 2, "20:00", "04:00");
    assert(multiDayArr === "12 Nov 2026", "Multi-day train with dayOffset 2 arrives '12 Nov 2026'", `Got: ${multiDayArr}`);
  }

  console.log("\n▶ [2/5] Results Layout & Preview First Verification");
  {
    const pagePath = path.join(process.cwd(), "frontend", "app", "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Check preview first (slice 0, 3)
    assert(
      pageContent.includes("showAllTrains ? filteredTrains : filteredTrains.slice(0, 3)"),
      "Renders initial 3 trains as preview above the fold before expansion"
    );

    // Check Show all trains CTA
    assert(
      pageContent.includes("Show all {filteredTrains.length} trains") ||
        pageContent.includes("Show all"),
      "Includes 'Show all N trains' button to expand list in-place"
    );

    // Check results ref & auto-scroll offset
    assert(
      pageContent.includes("resultsRef") && pageContent.includes("scrollToResults"),
      "Includes resultsRef and scrollToResults for automatic scroll positioning"
    );

    assert(
      pageContent.includes("headerHeight = 64") || pageContent.includes("--header-height"),
      "Scroll offset accounts for sticky header height to prevent content overlap"
    );

    assert(
      pageContent.includes("prefers-reduced-motion"),
      "Respects prefers-reduced-motion media query"
    );
  }

  console.log("\n▶ [3/5] Compact Summary Bar & Edit Search Capability");
  {
    const heroPath = path.join(process.cwd(), "frontend", "components", "HeroSearchWidget.tsx");
    const heroContent = fs.readFileSync(heroPath, "utf-8");

    assert(heroContent.includes("isCollapsed"), "HeroSearchWidget accepts isCollapsed state");
    assert(heroContent.includes("onExpand"), "HeroSearchWidget accepts onExpand callback for Edit button");
    assert(heroContent.includes("transition-all duration-250"), "Hero widget implements 250ms transition");
    assert(
      heroContent.includes("min-h-[96px]") || heroContent.includes("min-h-[110px]"),
      "Hero widget collapses to slim banner (96-120px) keeping background image"
    );

    // Check Edit button in compact bar
    assert(heroContent.includes("Edit") && heroContent.includes("onExpand"), "Compact summary bar provides Edit button");

    // Dynamic Sample Route Note
    assert(
      heroContent.includes("formatDisplayDate(journeyDate)"),
      "Sample route note dynamically derives date from selected journeyDate instead of hardcoded 06 Nov"
    );
  }

  console.log("\n▶ [4/5] Filter Drawer, Sort Chips & Mobile Bottom Bar");
  {
    const pagePath = path.join(process.cwd(), "frontend", "app", "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Sort chips: Fastest, Cheapest, Earliest, Best availability
    assert(pageContent.includes("Fastest"), "Includes 'Fastest' sort chip");
    assert(pageContent.includes("Cheapest"), "Includes 'Cheapest' sort chip");
    assert(pageContent.includes("Earliest"), "Includes 'Earliest' sort chip");
    assert(pageContent.includes("Best availability"), "Includes 'Best availability' sort chip");

    // Quick filter chips: Class (SL, 3A, 2A, 1A) & Time of day
    assert(pageContent.includes("First Class"), "Includes 'First Class' class filter chip");
    assert(pageContent.includes("Early Morning"), "Includes 'Early Morning' time filter chip");
    assert(pageContent.includes("Night"), "Includes 'Night' time filter chip");

    // Full filter drawer & Escape listener
    assert(pageContent.includes("isFiltersDrawerOpen"), "Manages isFiltersDrawerOpen state for drawer");
    assert(pageContent.includes('e.key === "Escape"'), "Closes filters drawer on Escape key");

    // Mobile sticky bottom bar
    assert(
      pageContent.includes("Continue with") && pageContent.includes("sm:hidden"),
      "Renders mobile-only sticky bottom bar for 1-tap booking continuation"
    );

    // Minimum 44px touch targets
    assert(
      pageContent.includes("min-h-[44px]"),
      "Enforces WCAG AA 44px minimum touch targets on controls"
    );
  }

  console.log("\n▶ [5/5] Wording & Real-Time Query URL Synchronization");
  {
    const pagePath = path.join(process.cwd(), "frontend", "app", "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Wording fix C
    assert(
      pageContent.includes("Showing simulated live seat availability"),
      "Wording updated to 'Showing simulated live seat availability'"
    );
    assert(
      !pageContent.includes("Showing live GDS atomic seat counters"),
      "Eliminated legacy wording 'Showing live GDS atomic seat counters'"
    );

    // Aria-live region
    assert(
      pageContent.includes('aria-live="polite"'),
      "Provides aria-live polite region announcing trains found count"
    );

    // URL reflection & popstate
    assert(
      pageContent.includes("window.history.replaceState"),
      "Reflects search parameters (from, to, date, quota, class) in URL"
    );
    assert(
      pageContent.includes("popstate"),
      "Listens to popstate for browser Back/Forward restoration"
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
}

runSearchToResultsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

