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

  console.log('Launching Headless Chrome (viewport 390x844)...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=390,844',
    '--remote-debugging-port=9222',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // -------------------------------------------------------------
  // 1. Home Screen with Practice Entry Card
  // -------------------------------------------------------------
  console.log('\n▶ Capturing Home Screen (with new Practice Mode Entry Card)...');
  await send('Page.navigate', { url: BASE_URL });
  await new Promise((r) => setTimeout(r, 2000));
  await evaluate('window.scrollTo(0, 160)');
  await new Promise((r) => setTimeout(r, 600));
  await capture('home-screen-with-practice-entry-390.png');

  // -------------------------------------------------------------
  // 2. Practice Setup Screen (/practice)
  // -------------------------------------------------------------
  console.log('\n▶ Navigating to Practice Setup (/practice)...');
  await send('Page.navigate', { url: `${BASE_URL}/practice` });
  await new Promise((r) => setTimeout(r, 2000));
  await evaluate('window.scrollTo(0, 0)');
  await new Promise((r) => setTimeout(r, 600));
  await capture('practice-screen-1-setup-390.png');

  // -------------------------------------------------------------
  // 3. Practice Run: Countdown Phase
  // -------------------------------------------------------------
  console.log('\n▶ Navigating to Practice Run: Countdown (/practice/run)...');
  await send('Page.navigate', { url: `${BASE_URL}/practice/run` });
  await new Promise((r) => setTimeout(r, 1500));
  await capture('practice-screen-2-countdown-390.png');

  // -------------------------------------------------------------
  // 4. Practice Run: Waiting Room Phase
  // -------------------------------------------------------------
  console.log('\n▶ Fast-forwarding to Waiting Room Phase...');
  await evaluate(`
    (() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Skip countdown'));
      if (skipBtn) skipBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('practice-screen-3-waiting-room-390.png');

  // -------------------------------------------------------------
  // 5. Practice Run: Passenger Form + Station Trap
  // -------------------------------------------------------------
  console.log('\n▶ Fast-passing to Passenger Form Phase...');
  await evaluate(`
    (() => {
      const fpBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fast Pass'));
      if (fpBtn) fpBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('practice-screen-4-passenger-390.png');

  // -------------------------------------------------------------
  // 6. Practice Run: Review & Captcha Phase
  // -------------------------------------------------------------
  console.log('\n▶ Proceeding to Review & Captcha Phase...');
  await evaluate(`
    (() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('practice-screen-5-review-captcha-390.png');

  // -------------------------------------------------------------
  // 7. Practice Run: Payment & Injected Failure / Fallback
  // -------------------------------------------------------------
  console.log('\n▶ Solving Captcha and Proceeding to Payment...');
  await evaluate(`
    (() => {
      const captchaText = Array.from(document.querySelectorAll('div')).find(d => d.className.includes('tracking-widest') && d.textContent.trim().length === 5)?.textContent.trim() || 'K9X4M';
      const input = document.querySelector('input[placeholder*="captcha"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, captchaText);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));
  await capture('practice-screen-6-payment-fallback-390.png');

  // -------------------------------------------------------------
  // 8. Practice Result Screen (/practice/result)
  // -------------------------------------------------------------
  console.log('\n▶ Confirming Payment & Generating Debrief Result...');
  await evaluate(`
    (() => {
      const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CONFIRM SIMULATED PAYMENT') || b.textContent.includes('AUTHORIZE'));
      if (payBtn) payBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));
  await capture('practice-screen-7-result-390.png');

  ws.close();
  try { chromeProc.kill(); } catch {}
  if (nextProc) { try { nextProc.kill(); } catch {} }
  console.log('\n✅ All Practice Mode screens captured successfully!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

