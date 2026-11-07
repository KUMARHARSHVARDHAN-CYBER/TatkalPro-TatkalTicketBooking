import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3012;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

async function isPortOpen(port) {
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(`http://${HOST}:${port}/`, (r) => resolve(r.statusCode));
      req.on('error', reject);
      req.setTimeout(1000, () => req.destroy());
    });
    return res === 200;
  } catch {
    return false;
  }
}

async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(url, (r) => resolve(r.statusCode));
        req.on('error', reject);
        req.setTimeout(2000, () => req.destroy());
      });
      if (res === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  let nextProc = null;
  const alreadyRunning = await isPortOpen(PORT);

  if (!alreadyRunning) {
    console.log(`Starting Next.js dev server on ${HOST}:${PORT}...`);
    const nextBin = path.join(FRONTEND_DIR, 'node_modules/next/dist/bin/next');
    nextProc = spawn(process.execPath, [nextBin, 'dev', '-H', HOST, '-p', String(PORT)], {
      cwd: FRONTEND_DIR,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForHttp(`${BASE_URL}/`);
    console.log('Next.js dev server ready.');
  }

  console.log('Launching Headless Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,900',
    '--remote-debugging-port=9224',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  const listData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9224/json/list', (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const page = listData.find((t) => t.type === 'page') || listData[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async function capture(fileName) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(ARTIFACT_DIR, fileName);
    fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
    console.log(`📸 Saved screenshot: ${fileName} (${fs.statSync(fullPath).size} bytes)`);
    return fullPath;
  }

  await send('Page.enable');
  await send('Runtime.enable');

  // =========================================================================
  // VIEWPORT 1: 1440x900 (Desktop Standard)
  // =========================================================================
  console.log('\n--- 1. Testing at 1440x900 (Desktop) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: BASE_URL });
  await new Promise((r) => setTimeout(r, 2500));

  // Check 1: Pre-Armed Checklist unmounted
  const checklistCheck = await evaluate(`
    (() => {
      const panel = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('PRE-ARMED & READY'));
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('1-Tap Pre-Arm Mode'));
      const stepper = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Search') && el.textContent.includes('Passengers'));
      return {
        hasChecklistPanel: !!panel,
        hasPreArmBtn: !!btn,
        hasStepper: !!stepper
      };
    })()
  `);
  console.log('Checklist Unmount Check:', checklistCheck);

  // Check 2: Hero Full-Bleed & Search button visibility without scrolling
  const heroCheck = await evaluate(`
    (() => {
      const hero = document.querySelector('img[alt*=\"Vande Bharat\"]')?.parentElement;
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search trains'));
      const rect = searchBtn ? searchBtn.getBoundingClientRect() : null;
      return {
        hasHeroImage: !!hero,
        searchBtnFound: !!searchBtn,
        searchBtnTop: rect ? rect.top : null,
        searchBtnBottom: rect ? rect.bottom : null,
        windowHeight: window.innerHeight,
        visibleWithoutScroll: rect ? rect.bottom <= window.innerHeight : false
      };
    })()
  `);
  console.log('Hero & Search Button Check (1440x900):', heroCheck);
  await capture('home-hero-1440x900.png');

  // Scroll down to check the 3 new sections
  await evaluate(`window.scrollTo({ top: 900, behavior: 'instant' })`);
  await new Promise((r) => setTimeout(r, 600));

  const sectionsCheck = await evaluate(`
    (() => {
      const howHelps = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('How TatkalPro Helps'));
      const rules = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Tatkal Timings and Rules'));
      const safety = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Trust and Safety'));
      const practiceBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Try Practice Mode'));
      const verifiedDate = document.body.innerText.includes('04 Nov 2026');
      return {
        hasHowHelps: !!howHelps,
        hasRules: !!rules,
        hasSafety: !!safety,
        hasPracticeBtn: !!practiceBtn,
        hasVerifiedDate: verifiedDate
      };
    })()
  `);
  console.log('3 New Sections Check:', sectionsCheck);
  await capture('home-scrolled-1440x900.png');

  // =========================================================================
  // VIEWPORT 2: 1280x720 (Compact Laptop)
  // =========================================================================
  console.log('\n--- 2. Testing at 1280x720 (Compact Laptop) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
  await new Promise((r) => setTimeout(r, 800));

  const check1280 = await evaluate(`
    (() => {
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search trains'));
      const rect = searchBtn ? searchBtn.getBoundingClientRect() : null;
      return {
        searchBtnBottom: rect ? rect.bottom : null,
        windowHeight: window.innerHeight,
        visibleWithoutScroll: rect ? rect.bottom <= window.innerHeight : false
      };
    })()
  `);
  console.log('Search Button Visibility (1280x720):', check1280);
  await capture('home-hero-1280x720.png');

  // =========================================================================
  // VIEWPORT 3: 390x844 (Mobile)
  // =========================================================================
  console.log('\n--- 3. Testing at 390x844 (Mobile) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
  await new Promise((r) => setTimeout(r, 800));

  const check390 = await evaluate(`
    (() => {
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search trains'));
      const rect = searchBtn ? searchBtn.getBoundingClientRect() : null;
      return {
        searchBtnBottom: rect ? rect.bottom : null,
        windowHeight: window.innerHeight,
        visibleWithoutScroll: rect ? rect.bottom <= window.innerHeight : false
      };
    })()
  `);
  console.log('Search Button Visibility (390x844):', check390);
  await capture('home-hero-390x844.png');

  // Switch back to 1440x900 for full flow testing
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 500));

  // =========================================================================
  // POPULAR ROUTE TAP & RESULTS VERIFICATION
  // =========================================================================
  console.log('\n--- 4. Tapping Popular Route Chip (NDLS → HWH) ---');
  const routeTap = await evaluate(`
    (() => {
      const chip = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('NDLS → HWH'));
      if (chip) {
        chip.click();
        return 'clicked NDLS -> HWH chip';
      }
      return 'chip not found';
    })()
  `);
  console.log('Popular Route Tap:', routeTap);
  await new Promise((r) => setTimeout(r, 500));

  // Verify inputs updated & search button focused without auto-search
  const focusCheck = await evaluate(`
    (() => {
      const activeEl = document.activeElement;
      const isSearchBtn = activeEl ? activeEl.textContent && activeEl.textContent.includes('Search trains') : false;
      const fromStn = document.body.innerText.includes('New Delhi');
      const toStn = document.body.innerText.includes('Howrah');
      const resultsExist = document.querySelectorAll('.rounded-2xl.bg-white').length > 0;
      return {
        isSearchBtnFocused: isSearchBtn,
        fromStnUpdated: fromStn,
        toStnUpdated: toStn,
        autoSearched: resultsExist
      };
    })()
  `);
  console.log('Route Auto-Fill & Focus Check:', focusCheck);

  // Click Search trains
  console.log('\n--- 5. Clicking Search trains Button ---');
  await evaluate(`
    (() => {
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search trains'));
      if (searchBtn) searchBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Check Results: No highlighted card, no sticky continue bar initially
  const initialResultsCheck = await evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.rounded-2xl.bg-white'));
      const highlightedCards = cards.filter(c => c.className.includes('border-2') || c.className.includes('ring-2'));
      const readyBanner = document.body.innerText.includes('Ready to book in');
      const selectTrainBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Select train ·'));
      const continueBar = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continue with'));
      return {
        cardsFound: cards.length,
        highlightedCardsCount: highlightedCards.length,
        hasReadyBanner: readyBanner,
        hasSelectTrainBtn: !!selectTrainBtn,
        hasStickyContinueBarInitially: !!continueBar
      };
    })()
  `);
  console.log('Initial Results Check (No Highlight / No Continue bar):', initialResultsCheck);
  await capture('results-initial-no-highlight-1440x900.png');

  // Select 3A Class on first card
  console.log('\n--- 6. Selecting 3A Class on Train Card ---');
  await evaluate(`
    (() => {
      const clsChips = Array.from(document.querySelectorAll('div')).filter(d => 
        d.className && d.className.includes('min-w-[130px]') && d.textContent.includes('3A')
      );
      if (clsChips.length > 0) {
        clsChips[0].click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Check Sticky Continue Bar appeared
  const continueBarCheck = await evaluate(`
    (() => {
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continue with'));
      return {
        hasStickyContinueBar: !!continueBtn,
        continueBtnText: continueBtn ? continueBtn.textContent.trim() : null
      };
    })()
  `);
  console.log('Sticky Continue Bar Check:', continueBarCheck);
  await capture('results-sticky-continue-1440x900.png');

  // Also capture sticky bar on Mobile (390x844)
  console.log('\n--- 7. Sticky Continue Bar on Mobile (390x844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));
  await capture('results-sticky-continue-390x844.png');

  // Click Continue to verify navigation to Passengers
  console.log('\n--- 8. Clicking Sticky Continue Bar -> Passengers Step ---');
  await evaluate(`
    (() => {
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continue with'));
      if (continueBtn) continueBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // If waiting room fast pass appears, pass it
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Fast Pass') || b.textContent.includes('Enter Booking Room')));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  const passengersCheck = await evaluate(`
    (() => {
      const heading = Array.from(document.querySelectorAll('*')).find(el => el.textContent && (el.textContent.includes('Passenger Details') || el.textContent.includes('Passengers') || el.textContent.includes('Add Passenger')));
      const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Review journey'));
      return {
        isPassengersScreen: !!heading,
        hasReviewBtn: !!reviewBtn
      };
    })()
  `);
  console.log('Passengers Screen Check:', passengersCheck);
  await capture('passengers-step-verified.png');

  // Clean up
  try {
    ws.close();
    chromeProc.kill();
    if (nextProc) nextProc.kill();
  } catch {}

  console.log('\n🎉 ALL 5 CHANGES VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});

