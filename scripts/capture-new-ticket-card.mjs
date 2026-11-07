import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3011;
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
    '--window-size=1280,800',
    '--remote-debugging-port=9223',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  const listData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json/list', (r) => {
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

  await send('Page.navigate', { url: BASE_URL });
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Navigating to Step 5 (Ticket Modal)...');

  // Step 1: Click class chip
  await evaluate(`
    (() => {
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.trim().startsWith('3A') && d.textContent.includes('₹'));
      if (chips.length > 0) chips[0].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Step 2: Click Select train
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Select train'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // Step 3: Fast pass / Enter booking room
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fast Pass') || b.textContent.includes('Enter Booking Room'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // Step 4: Click Review journey
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review journey'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // Step 5: Captcha input & proceed to payment
  await evaluate(`
    (() => {
      const svgText = document.querySelector('svg text')?.textContent || 'K9X4M';
      const input = document.querySelector('input[placeholder="Type here..."]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, svgText);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PROCEED TO PAYMENT'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Regret shield bypass if present
  await evaluate(`
    (() => {
      const proceedAnyway = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed Anyway') || b.textContent.includes('Ignore and continue'));
      if (proceedAnyway) proceedAnyway.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Step 6: PaymentModal -> Pay
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PAY ₹') || b.textContent.includes('Simulate Payment'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 3000));

  // Capture Desktop screenshot
  console.log('Capturing Desktop Ticket Card (1280x800)...');
  await capture('ticket-layout-desktop.png');

  // Change viewport to mobile 390x844
  console.log('Changing viewport to Mobile (390x844)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 800));
  await capture('ticket-layout-mobile.png');

  // Clean up
  try {
    ws.close();
    chromeProc.kill();
    if (nextProc) nextProc.kill();
  } catch {}

  console.log('✅ Finished capture successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

