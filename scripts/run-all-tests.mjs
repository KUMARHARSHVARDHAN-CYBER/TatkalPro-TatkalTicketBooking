import { spawnSync } from "child_process";
import path from "path";

const jitiBin = path.resolve("./frontend/node_modules/jiti/bin/jiti.js");

console.log("=======================================================");
console.log("   RUNNING ALL TATKALPRO ENTERPRISE TEST SUITES       ");
console.log("=======================================================\n");

const suites = [
  { name: "Enterprise Core Verification", file: "tests/tatkalpro-suite.ts" },
  { name: "Tatkal Safety Net Verification", file: "tests/safety-net-suite.ts" },
  { name: "Ticket Screen (Step 5) Labels & Safety", file: "tests/ticket-screen-labels.test.ts" },
  { name: "Practice Mode Unit Suite", file: "tests/practice-mode.test.ts" },
  { name: "Practice Mode End-to-End Suite", file: "tests/practice-mode-e2e.test.ts" },
  { name: "Search-to-Results UX & Date Derivation", file: "tests/search-results-experience.test.ts" },
  { name: "Train Results & Nav Enhancements", file: "tests/results-and-nav-enhancements.test.ts" },
  { name: "Home Hero, Results & Info Sections", file: "tests/home-hero-and-results-enhancements.test.ts" },
  { name: "Pre-Deployment Cleanup Verification", file: "tests/pre-deployment-cleanup.test.ts" },
];

for (const suite of suites) {
  const result = spawnSync(process.execPath, [jitiBin, suite.file], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`\n❌ Test suite failed: ${suite.name} (${suite.file})`);
    process.exit(result.status || 1);
  }
}

console.log("=======================================================");
console.log("   ✅ ALL 9 TATKALPRO TEST SUITES PASSED!             ");
console.log("=======================================================\n");
process.exit(0);
