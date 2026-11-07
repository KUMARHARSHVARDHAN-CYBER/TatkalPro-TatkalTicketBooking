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

  // Launch Chrome Headless with mobile viewport 390x844
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

  await send('Page.navigate', { url: BASE_URL });
  await new Promise((r) => setTimeout(r, 2500));

  console.log('Booking Flow: Navigating to Screen 5 (Demo Ticket)...');

  // Step 1: Click the class chip on the first train card to activate it
  const selectCardRes = await evaluate(`
    (() => {
      // Find class chip (e.g. 3A)
      const chips = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.trim().startsWith('3A') && d.textContent.includes('₹'));
      if (chips.length > 0) {
        chips[0].click();
        return 'clicked 3A class chip';
      }
      // Or click train card
      const trainTitle = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Mumbai Rajdhani'));
      if (trainTitle) {
        trainTitle.closest('div').click();
        return 'clicked Mumbai Rajdhani card';
      }
      return 'class chip / card not found';
    })()
  `);
  console.log('Step 1:', selectCardRes);
  await new Promise((r) => setTimeout(r, 800));

  // Step 2: Now click "Select train" button
  const selectTrainRes = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Select train'));
      if (btn) {
        btn.click();
        return 'clicked ' + btn.textContent.trim();
      }
      return 'Select train button not found';
    })()
  `);
  console.log('Step 2:', selectTrainRes);
  await new Promise((r) => setTimeout(r, 1200));

  // Step 3: VirtualWaitingRoom Fast Pass
  const fastPassRes = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fast Pass') || b.textContent.includes('Enter Booking Room'));
      if (btn) {
        btn.click();
        return 'clicked Fast Pass';
      }
      return 'no waiting room';
    })()
  `);
  console.log('Step 3:', fastPassRes);
  await new Promise((r) => setTimeout(r, 1200));

  // Step 4: LivePassengerManager -> Click "Review journey"
  const reviewJourneyRes = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review journey'));
      if (btn) {
        btn.click();
        return 'clicked Review journey';
      }
      return 'Review journey button not found';
    })()
  `);
  console.log('Step 4:', reviewJourneyRes);
  await new Promise((r) => setTimeout(r, 1200));

  // Step 5: ReviewAndCaptchaModal -> Fill captcha and click "PROCEED TO PAYMENT"
  const captchaRes = await evaluate(`
    (() => {
      const svgText = document.querySelector('svg text')?.textContent || 'K9X4M';
      const input = document.querySelector('input[placeholder="Type here..."]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, svgText);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PROCEED TO PAYMENT'));
      if (btn) {
        btn.click();
        return 'clicked PROCEED TO PAYMENT with captcha ' + svgText;
      }
      return 'PROCEED TO PAYMENT not found';
    })()
  `);
  console.log('Step 5:', captchaRes);
  await new Promise((r) => setTimeout(r, 1500));

  // Regret Shield check
  await evaluate(`
    (() => {
      const proceedAnyway = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed Anyway') || b.textContent.includes('Ignore and continue'));
      if (proceedAnyway) proceedAnyway.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Step 6: PaymentModal -> Click "PAY ₹"
  const payRes = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('PAY ₹') || b.textContent.includes('Simulate Payment'));
      if (btn) {
        btn.click();
        return 'clicked ' + btn.textContent.trim();
      }
      return 'Pay button not found';
    })()
  `);
  console.log('Step 6:', payRes);

  // Wait 3 seconds for payment to complete and ConfirmedETicketModal to open
  await new Promise((r) => setTimeout(r, 3200));

  // Step 7: Verify Ticket screen
  const ticketTitle = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'none';
    })()
  `);
  console.log('Step 7: Ticket screen title:', ticketTitle);

  // Capture Screen 5 at 390x844
  console.log('Capturing Screen 5 (Demo Ticket at 390x844)...');
  await capture('screen-5-demo-ticket-390.png');
  await capture('screen-5-confirmed-ticket-light.png');

  ws.close();
  try { chromeProc.kill(); } catch {}
  if (nextProc) { try { nextProc.kill(); } catch {} }
  console.log('Done!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
