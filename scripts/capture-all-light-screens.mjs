import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3010;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

console.log('=======================================================');
console.log('   TATKALPRO LIGHT-THEME SCREENSHOT GENERATOR         ');
console.log('=======================================================');
console.log('Artifacts Directory:', ARTIFACT_DIR);
console.log('Target Server URL:', BASE_URL);

// 1. Helper to check or wait for HTTP 200
async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(url, (r) => {
          let data = '';
          r.on('data', (c) => (data += c));
          r.on('end', () => resolve(r.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => req.destroy(new Error('timeout')));
      });
      if (res === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

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

    nextProc.stdout.on('data', (d) => console.log('[NEXT]', d.toString().trim()));
    nextProc.stderr.on('data', (d) => console.error('[NEXT ERR]', d.toString().trim()));

    await waitForHttp(`${BASE_URL}/`);
    console.log('Next.js dev server is ready!');
  } else {
    console.log(`Next.js dev server already running on ${HOST}:${PORT}.`);
  }

  // 2. Launch Chrome Headless
  console.log('Launching Headless Chrome on port 9222...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,920',
    '--remote-debugging-port=9222',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  // Connect to Chrome DevTools Protocol via WebSocket
  const listData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', (r) => {
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
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 920,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Navigate to application
  console.log(`\nNavigating to ${BASE_URL}...`);
  await send('Page.navigate', { url: BASE_URL });
  await new Promise((r) => setTimeout(r, 4500));

  // -----------------------------------------------------------------
  // SCREEN 1: Home (Design System + Stepper + Hero + Countdown + Checklist)
  // -----------------------------------------------------------------
  console.log('\n▶ Capturing Screen 1: Home (Light Design System)...');
  await evaluate('window.scrollTo(0, 0)');
  await new Promise((r) => setTimeout(r, 600));
  await capture('screen-1-home-light.png');

  // -----------------------------------------------------------------
  // SCREEN 2: Train Results + Split-Ticket + Waitlist Predictor
  // -----------------------------------------------------------------
  console.log('\n▶ Capturing Screen 2: Train Results & Split-Ticket Routing...');
  await evaluate('window.scrollTo(0, 560)');
  await new Promise((r) => setTimeout(r, 800));
  await capture('screen-2-trains-light.png');

  // -----------------------------------------------------------------
  // SCREEN 3: Real-Time Live Passenger Management
  // -----------------------------------------------------------------
  console.log('\n▶ Navigating to Screen 3: Live Passenger Manager...');
  // Click "BOOK NOW" on the first train card (Mumbai Rajdhani)
  await evaluate(`
    const bookBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BOOK NOW'));
    if (bookBtn) bookBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Fast-Pass the waiting room
  await evaluate(`
    const fastPass = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fast Pass') || b.textContent.includes('Enter Booking Room'));
    if (fastPass) fastPass.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  console.log('Capturing Screen 3: Live Passenger Manager...');
  await evaluate('window.scrollTo(0, 0)');
  await new Promise((r) => setTimeout(r, 600));
  await capture('screen-3-passengers-light.png');

  // -----------------------------------------------------------------
  // SCREEN 4: Review & Accessible Captcha Modal
  // -----------------------------------------------------------------
  console.log('\n▶ Navigating to Screen 4: Review & Captcha Modal...');
  await evaluate(`
    const proceedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PROCEED TO REVIEW & CAPTCHA'));
    if (proceedBtn) proceedBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1000));

  console.log('Capturing Screen 4: Review & Captcha Modal...');
  await capture('screen-4-review-payment-light.png');

  // -----------------------------------------------------------------
  // SCREEN 5: Confirmed E-Ticket Modal
  // -----------------------------------------------------------------
  console.log('\n▶ Navigating to Screen 5: Payment & Confirmed E-Ticket...');
  // Solve captcha & proceed to payment
  await evaluate(`
    const captchaText = document.querySelector('svg text')?.textContent || 'K9X4M';
    const input = document.querySelector('input[placeholder="Type here..."]');
    if (input) {
      input.value = captchaText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PROCEED TO PAYMENT'));
    if (payBtn) payBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Complete Payment in PaymentModal
  await evaluate(`
    const payNow = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PAY ₹') || b.textContent.includes('Simulate Payment'));
    if (payNow) payNow.click();
  `);
  await new Promise((r) => setTimeout(r, 2200));

  console.log('Capturing Screen 5: Confirmed E-Ticket...');
  await capture('screen-5-confirmed-ticket-light.png');

  // -----------------------------------------------------------------
  // SCREEN 6: Bot Shield Admin Dashboard
  // -----------------------------------------------------------------
  console.log('\n▶ Navigating to Screen 6: Bot Shield Admin Dashboard...');
  // Close ticket modal
  await evaluate(`
    const closeBtn = document.querySelector('button[title="Close E-Ticket"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Book Another') || b.title === 'Close');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Click "Bot Shield" button in HeaderNav
  await evaluate(`
    const shieldBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bot Shield') || b.title?.includes('Bot Shield'));
    if (shieldBtn) shieldBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  console.log('Capturing Screen 6: Bot Shield Admin Dashboard...');
  await capture('screen-6-admin-dashboard-light.png');

  console.log('\n=======================================================');
  console.log('   ALL 6 LIGHT-THEMED SCREENS CAPTURED SUCCESSFULLY!   ');
  console.log('=======================================================');

  ws.close();
  chromeProc.kill();
  if (nextProc) nextProc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during screen capture:', err);
  process.exit(1);
});
