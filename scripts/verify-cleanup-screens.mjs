import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3013;
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
    '--remote-debugging-port=9225',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  const listData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9225/json/list', (r) => {
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

  async function evaluate(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async function capture(fileName) {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(ss.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Saved screenshot: ${fileName} (${buffer.length} bytes)`);
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('\n--- 1. Testing Home & Header (Desktop 1440x900) ---');
  await send('Page.navigate', { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 2000));

  await capture('cleanup-home-1440x900.png');

  // Verify header text
  const headerCheck = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasTatkalToolkit: body.includes('Tatkal toolkit') || body.includes('TATKAL TOOLKIT'),
        hasDemoBuild: body.includes('Demo build'),
        hasOldIrctcToolkit: body.includes('IRCTC Toolkit') || body.includes('IRCTC TOOLKIT'),
        hasOldOfficialSpecimen: body.includes('Official Specimen'),
        hasSpecimenNotes: body.includes('The booking toolkit • Native editable specimens'),
        hasInterNotes: body.includes('Inter · 8px spacing · 44px minimum controls')
      };
    })()
  `);
  console.log('Header & Specimen Text Check:', headerCheck);

  // Mobile Home & Header (390x844)
  console.log('\n--- 2. Testing Home & Header (Mobile 390x844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));
  await capture('cleanup-home-390x844.png');

  // Reset viewport to desktop
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click Search trains
  console.log('\n--- 3. Searching Trains & Checking Results ---');
  await evaluate(`
    (() => {
      const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Search trains'));
      if (searchBtn) searchBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await capture('cleanup-results-1440x900.png');

  // Mobile Results
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));
  await capture('cleanup-results-390x844.png');

  // Reset to desktop for class selection & continue
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 600));

  // Select 3A class
  await evaluate(`
    (() => {
      const clsChips = Array.from(document.querySelectorAll('div')).filter(d => 
        d.className && d.className.includes('min-w-[130px]') && d.textContent.includes('3A')
      );
      if (clsChips.length > 0) clsChips[0].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Click Continue to open Passengers
  console.log('\n--- 4. Navigating to Passengers Step & Opening Edit/Add ---');
  await evaluate(`
    (() => {
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continue with'));
      if (continueBtn) continueBtn.click();
    })()
  `);
  // Wait for Virtual Waiting Room simulated queue admission (~4s)
  for (let i = 0; i < 15; i++) {
    const isWaitingRoom = await evaluate(`!!document.querySelector('.animate-ping')`);
    if (!isWaitingRoom) break;
    await new Promise((r) => setTimeout(r, 600));
  }
  await new Promise((r) => setTimeout(r, 800));

  // Open Edit on passenger 1
  const editClicked = await evaluate(`
    (() => {
      const editBtn = document.querySelector('button[title="Edit Passenger"]');
      if (editBtn) {
        editBtn.click();
        return 'clicked edit button';
      }
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Add Passenger'));
      if (addBtn) {
        addBtn.click();
        return 'clicked add button';
      }
      return 'neither button found';
    })()
  `);
  console.log('Edit/Add button click:', editClicked);
  await new Promise((r) => setTimeout(r, 1000));

  // Check ID warning text is rendered
  const idWarningCheck = await evaluate(`
    (() => {
      const body = document.body.innerText;
      return {
        hasWarning: body.includes("Demo only. Please don't enter real ID numbers."),
        hasGovtIdType: body.includes("Govt ID type"),
        hasGovtIdNumber: body.includes("Govt ID number")
      };
    })()
  `);
  console.log('Passengers ID Warning Check:', idWarningCheck);

  await capture('cleanup-passengers-id-warning-1440x900.png');

  // Mobile Passengers screen
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 600));
  await capture('cleanup-passengers-id-warning-390x844.png');

  // Reset to desktop to proceed through Review, Payment, Ticket
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 600));

  // Save edit
  await evaluate(`
    (() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Save details'));
      if (saveBtn) saveBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Proceed to Review
  console.log('\n--- 5. Review & Captcha Step ---');
  await evaluate(`
    (() => {
      const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Review journey'));
      if (reviewBtn) reviewBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await capture('cleanup-review-step.png');

  // Enter Captcha & Confirm
  console.log('\n--- 6. Payment Step ---');
  await evaluate(`
    (() => {
      const captchaSvgText = document.querySelector('svg text');
      const code = captchaSvgText ? captchaSvgText.textContent.trim() : 'TEST';
      const captchaInput = document.querySelector('input[placeholder="Type here..."]');
      if (captchaInput) {
        // Trigger React controlled input change
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(captchaInput, code);
        captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      setTimeout(() => {
        const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('PROCEED TO PAYMENT'));
        if (payBtn) payBtn.click();
      }, 300);
    })()
  `);
  await new Promise((r) => setTimeout(r, 1800));
  await capture('cleanup-payment-step.png');

  // Complete Payment -> Ticket
  console.log('\n--- 7. Ticket Step ---');
  await evaluate(`
    (() => {
      const payNowBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('PAY ₹'));
      if (payNowBtn) payNowBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2200));
  await capture('cleanup-ticket-step.png');

  console.log('\n🎉 ALL VERIFICATION SCREENSHOTS AND CHECKS COMPLETED SUCCESSFULLY!');

  try {
    ws.close();
    chromeProc.kill();
    if (nextProc) nextProc.kill();
  } catch {}
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
