import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\HARSHVARDHAN\\.gemini\\antigravity\\brain\\5456b858-59d2-471f-b2ce-3bc100e70436';
const FRONTEND_DIR = path.resolve('./frontend');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 3025;
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
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  console.log(`Starting Next.js production server on ${HOST}:${PORT}...`);
  const nextBin = path.join(FRONTEND_DIR, 'node_modules/next/dist/bin/next');
  const nextProc = spawn(process.execPath, [nextBin, 'start', '-H', HOST, '-p', String(PORT)], {
    cwd: FRONTEND_DIR,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForHttp(`${BASE_URL}/`);
    console.log('Next.js production server ready.');

    console.log('Launching Headless Chrome...');
    const chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
      '--remote-debugging-port=9226',
      'about:blank',
    ]);

    try {
      await new Promise((r) => setTimeout(r, 1500));

      const listData = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9226/json/list', (r) => {
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

      async function capture(fileName, clip = null) {
        const params = { format: 'png' };
        if (clip) params.clip = clip;
        const ss = await send('Page.captureScreenshot', params);
        const buffer = Buffer.from(ss.data, 'base64');
        const outPath = path.join(ARTIFACT_DIR, fileName);
        fs.writeFileSync(outPath, buffer);
        console.log(`📸 Saved screenshot: ${fileName} (${buffer.length} bytes)`);
      }

      await send('Page.enable');
      await send('Runtime.enable');

      console.log('\n--- 1. Testing Desktop 1440x900 ---');
      await send('Page.navigate', { url: `${BASE_URL}/` });
      await new Promise((r) => setTimeout(r, 2000));

      // Inspect logo in DOM
      const logoInfo = await evaluate(`
        (() => {
          const img = document.querySelector('header img[alt="TatkalPro logo"]');
          if (!img) return { found: false };
          const rect = img.getBoundingClientRect();
          return {
            found: true,
            src: img.src,
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            renderedWidth: rect.width,
            renderedHeight: rect.height,
            complete: img.complete
          };
        })()
      `);
      console.log('Desktop Logo DOM Info:', logoInfo);

      await capture('header-logo-desktop-1440.png');
      await capture('header-logo-close-crop.png', { x: 0, y: 0, width: 450, height: 80, scale: 2 });

      console.log('\n--- 2. Testing Mobile 390x844 ---');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await new Promise((r) => setTimeout(r, 800));

      const mobileLogoInfo = await evaluate(`
        (() => {
          const img = document.querySelector('header img[alt="TatkalPro logo"]');
          if (!img) return { found: false };
          const rect = img.getBoundingClientRect();
          return {
            found: true,
            renderedWidth: rect.width,
            renderedHeight: rect.height,
            complete: img.complete
          };
        })()
      `);
      console.log('Mobile Logo DOM Info:', mobileLogoInfo);

      await capture('header-logo-mobile-390.png');

      ws.close();
    } finally {
      chromeProc.kill();
    }
  } finally {
    nextProc.kill();
  }
  console.log('\n✅ Verification script completed successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
