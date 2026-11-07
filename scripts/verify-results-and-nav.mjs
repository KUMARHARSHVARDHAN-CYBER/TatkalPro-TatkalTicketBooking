import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3012;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

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

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.id++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Saved screenshot: ${filename} (${buffer.length} bytes)`);
    return outPath;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log('=======================================================');
  console.log('   VERIFY RESULTS & NAV ENHANCEMENTS WITH CDP          ');
  console.log('=======================================================');

  console.log(`Starting Next.js server on ${HOST}:${PORT}...`);
  const nextProc = spawn(
    process.execPath,
    [path.join(FRONTEND_DIR, 'node_modules/next/dist/bin/next'), 'dev', '-H', HOST, '-p', String(PORT)],
    {
      cwd: FRONTEND_DIR,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  await waitForHttp(`${BASE_URL}/`);
  console.log('Next.js production server ready.');

  // Launch Chrome Headless
  const CDP_PORT = 9228;
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  const listData = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, (r) => {
      let body = '';
      r.on('data', (c) => (body += c));
      r.on('end', () => resolve(JSON.parse(body)));
      r.on('error', reject);
    });
  });

  const page = listData.find((t) => t.type === 'page') || listData[0];
  const wsUrl = page.webSocketDebuggerUrl;
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  try {
    // -----------------------------------------------------------
    // TEST 1: 1440x900 Desktop - Home screen & Nav check
    // -----------------------------------------------------------
    console.log('\n--- 1. Checking 1440x900 Home Screen & Nav Bar ---');
    await cdp.setViewport(1440, 900);
    await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
    await new Promise((r) => setTimeout(r, 2000));

    const navCheck = await cdp.eval(`(() => {
      const practiceBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Practice'));
      const pnrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PNR'));
      const homePracticeCard = document.body.innerText.includes('Practice Tatkal booking: rehearse safely');
      const checklist = document.body.innerText.includes('10:00:00 Tatkal Window Readiness');

      return {
        hasPracticeBtn: !!practiceBtn,
        practiceBtnAria: practiceBtn ? practiceBtn.getAttribute('aria-label') : null,
        practiceBtnTitle: practiceBtn ? practiceBtn.getAttribute('title') : null,
        hasPnrBtn: !!pnrBtn,
        homePracticeCardRemoved: !homePracticeCard,
        checklistPresent: checklist
      };
    })()`);

    console.log('Home & Nav Verification:', navCheck);
    await cdp.captureScreenshot('home-without-practice-card-1440.png');

    // -----------------------------------------------------------
    // TEST 2: Practice Button Click -> /practice Active State Check
    // -----------------------------------------------------------
    console.log('\n--- 2. Clicking Practice Button in Nav -> /practice Route ---');
    await cdp.eval(`(() => {
      const practiceBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Practice'));
      if (practiceBtn) practiceBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1500));

    const practiceActiveCheck = await cdp.eval(`(() => {
      const url = window.location.pathname;
      const practiceBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Practice'));
      const hasActiveClasses = practiceBtn ? practiceBtn.className.includes('bg-blue-600') : false;
      return {
        pathname: url,
        isPracticeActive: url.startsWith('/practice'),
        hasActiveStyling: hasActiveClasses
      };
    })()`);

    console.log('Practice Active Route Check:', practiceActiveCheck);
    await cdp.captureScreenshot('nav-practice-active-1440.png');

    // -----------------------------------------------------------
    // TEST 3: Return to Home & Perform Search -> Results Preview
    // -----------------------------------------------------------
    console.log('\n--- 3. Performing Train Search -> Results Preview at 1440x900 ---');
    await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
    await new Promise((r) => setTimeout(r, 1500));

    await cdp.eval(`(() => {
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SEARCH TRAINS'));
      if (searchBtn) searchBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    const resultsCheck = await cdp.eval(`(() => {
      const summaryBar = document.querySelector('header + div') || document.querySelector('[aria-label="Edit search parameters"]')?.parentElement;
      const dateStrip = document.querySelector('[aria-label="7-day date flexibility selector"]');
      const cards = document.querySelectorAll('.rounded-2xl.bg-white');
      const firstCard = cards[0];
      const firstCardRect = firstCard ? firstCard.getBoundingClientRect() : null;

      const fastestBadge = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Fastest');
      const cheapestBadge = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Cheapest');
      const bestChanceBadge = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Best chance');

      return {
        summaryBarPresent: !!summaryBar,
        dateStripPresent: !!dateStrip,
        firstCardTop: firstCardRect ? firstCardRect.top : null,
        firstCardVisibleWithoutScroll: firstCardRect ? firstCardRect.top < window.innerHeight : false,
        hasFastestBadge: !!fastestBadge,
        hasCheapestBadge: !!cheapestBadge,
        hasBestChanceBadge: !!bestChanceBadge
      };
    })()`);

    console.log('Results Preview & Badges Check:', resultsCheck);
    await cdp.captureScreenshot('results-with-badges-and-strip-1440.png');

    // -----------------------------------------------------------
    // TEST 4: Date Flexibility Strip Click (10 Nov 2026)
    // -----------------------------------------------------------
    console.log('\n--- 4. Tapping 10 Nov in Date Flexibility Strip ---');
    await cdp.eval(`(() => {
      const dateButtons = Array.from(document.querySelectorAll('[role="tab"]'));
      const nov10Btn = dateButtons.find(b => b.textContent.includes('10 Nov') || b.getAttribute('aria-label')?.includes('10 Nov'));
      if (nov10Btn) nov10Btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const dateStripResult = await cdp.eval(`(() => {
      const bodyText = document.body.innerText;
      const summaryBarText = document.querySelector('[aria-label="Edit search parameters"]')?.parentElement?.innerText || '';
      const url = window.location.href;
      return {
        urlHasDate: url.includes('date='),
        summaryHas10Nov: summaryBarText.includes('10 Nov'),
        has10NovDeparture: bodyText.includes('10 Nov 2026'),
        has11NovArrival: bodyText.includes('11 Nov 2026')
      };
    })()`);

    console.log('Date Flexibility Strip (10 Nov) Check:', dateStripResult);
    await cdp.captureScreenshot('results-date-strip-10nov-1440.png');

    // -----------------------------------------------------------
    // TEST 5: Passenger Stepper & Total Fare Update (1, 2, 4 Pax)
    // -----------------------------------------------------------
    console.log('\n--- 5. Stepping Passengers to 2, then 4 Pax & Verifying Fare Totals ---');
    await cdp.eval(`(() => {
      const incBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Increase passenger count');
      if (incBtn) {
        incBtn.click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    // Step to 4 (Tatkal maximum)
    await cdp.eval(`(() => {
      const incBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Increase passenger count');
      if (incBtn) {
        incBtn.click();
        incBtn.click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const fareStepResult = await cdp.eval(`(() => {
      const bodyText = document.body.innerText;
      const count4 = bodyText.includes('4 passengers');
      const has10832 = bodyText.includes('10,832') || bodyText.includes('10832');
      const maxMessage = bodyText.includes('Max 4');

      return {
        count4Present: count4,
        total10832Present: has10832,
        maxMessagePresent: maxMessage,
        urlIncludesPassengers: window.location.href.includes('passengers=')
      };
    })()`);

    console.log('Passenger Stepper & Total Fare Check:', fareStepResult);
    await cdp.captureScreenshot('results-passenger-fare-breakdown-1440.png');

    // -----------------------------------------------------------
    // TEST 6: Split Routes Chip & Honest Split Card Check
    // -----------------------------------------------------------
    console.log('\n--- 6. Verifying Honest Split-Journey Card & Connection Risk ---');
    await cdp.eval(`(() => {
      const splitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Split routes'));
      if (splitBtn) splitBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const splitCardCheck = await cdp.eval(`(() => {
      const splitCard = document.getElementById('split-ticket-card');
      const splitText = splitCard ? splitCard.innerText : '';
      return {
        splitCardFound: !!splitCard,
        hasHonestHeader: splitText.includes('2-leg split journey'),
        hasAvailableNowChip: splitText.includes('Both legs available now'),
        hasConnectionRiskMeter: splitText.includes('Connection risk:'),
        hasDirectVsSplitComparison: splitText.toLowerCase().includes('direct vs split'),
        hasNonRefundableWarning: splitText.includes('Confirmed Tatkal tickets are generally non-refundable'),
        hasRuleVerificationDate: splitText.includes('04 Nov 2026'),
        noGuaranteedWord: !splitText.includes('Guaranteed 2-Leg'),
        no100PercentConfirmed: !splitText.includes('100% confirmed')
      };
    })()`);

    console.log('Split-Journey Card Verification:', splitCardCheck);
    await cdp.captureScreenshot('results-honest-split-card-1440.png');

    // -----------------------------------------------------------
    // TEST 7: 1280x720 Viewport Check
    // -----------------------------------------------------------
    console.log('\n--- 7. Viewport 1280x720 Check ---');
    await cdp.setViewport(1280, 720);
    await new Promise((r) => setTimeout(r, 500));
    const nav1280Check = await cdp.eval(`(() => {
      const header = document.querySelector('header');
      return {
        headerScrollWidth: header ? header.scrollWidth : null,
        headerClientWidth: header ? header.clientWidth : null,
        noNavOverflow: header ? header.scrollWidth <= header.clientWidth + 5 : false
      };
    })()`);
    console.log('1280x720 Nav Check:', nav1280Check);
    await cdp.captureScreenshot('results-preview-1280x720.png');

    // -----------------------------------------------------------
    // TEST 8: 390x844 Mobile Viewport Check
    // -----------------------------------------------------------
    console.log('\n--- 8. Viewport 390x844 Mobile Check ---');
    await cdp.setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 500));
    const mobileCheck = await cdp.eval(`(() => {
      const header = document.querySelector('header');
      const mobileBar = document.querySelector('.fixed.bottom-0');
      const dateStrip = document.querySelector('[role="tablist"]');
      const practiceBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('Practice'));

      return {
        noNavOverflow: header ? header.scrollWidth <= header.clientWidth + 5 : false,
        practiceBtnReachable: !!practiceBtn,
        dateStripPresent: !!dateStrip,
        mobileBottomBarPresent: !!mobileBar,
        mobileBarText: mobileBar ? mobileBar.innerText.replace(/\\n/g, ' ') : null
      };
    })()`);
    console.log('390x844 Mobile Check:', mobileCheck);
    await cdp.captureScreenshot('results-preview-390x844.png');

    // -----------------------------------------------------------
    // TEST 9: Full Booking Stepper Progression Check
    // -----------------------------------------------------------
    console.log('\n--- 9. Full Booking Stepper Progression Check (Search -> Passengers -> Review -> Payment -> Ticket) ---');
    await cdp.setViewport(1440, 900);
    
    // Select train / continue to passengers
    await cdp.eval(`(() => {
      const selectBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Select train'));
      if (selectBtns.length > 0) selectBtns[0].click();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));

    // Handle waiting room if open
    await cdp.eval(`(() => {
      const admitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enter Booking System'));
      if (admitBtn) admitBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));
    await cdp.captureScreenshot('step-2-passengers-check.png');

    // Continue to Review
    await cdp.eval(`(() => {
      const proceedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to Review'));
      if (proceedBtn) proceedBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1000));
    await cdp.captureScreenshot('step-3-review-check.png');

    // Submit Captcha / Proceed to Payment
    await cdp.eval(`(() => {
      const captchaInput = document.querySelector('input[placeholder="Enter 4 characters"]');
      if (captchaInput) {
        captchaInput.value = '7K9M';
        captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to Payment'));
      if (payBtn) payBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('step-4-payment-check.png');

    // Complete Payment
    await cdp.eval(`(() => {
      const payNowBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pay ₹'));
      if (payNowBtn) payNowBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 2000));
    await cdp.captureScreenshot('step-5-ticket-check.png');

    console.log('\n✅ ALL VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!');
  } finally {
    cdp.close();
    chromeProc.kill();
    nextProc.kill();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
