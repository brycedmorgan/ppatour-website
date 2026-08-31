/**
 * Verifies the Canes & the Cup promo modal on the surfaces that mount it.
 *
 * ⚠ CDP Emulation.setDeviceMetricsOverride, never --window-size (7/31 pt. 5).
 * ⚠ Fresh --user-data-dir every run: this site registers a service worker on
 *   localhost that serves stale JS (8/31 pt. 1), which is exactly how you
 *   "prove" a component doesn't render when it does.
 *
 * Usage: node scratchpad/cdp-promo.mjs <url> <width> <height> [out.png] [--dismiss-first]
 */
import { spawn } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";

const URL_UNDER_TEST = process.argv[2];
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const OUT = process.argv[5] && !process.argv[5].startsWith("--") ? process.argv[5] : null;
const DISMISS_FIRST = process.argv.includes("--dismiss-first");
const NO_CONSENT = process.argv.includes("--no-consent");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9377;
const PROFILE = `C:/Users/WESLEY~1/AppData/Local/Temp/cdp-ppa-promo-${process.pid}`;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--disable-features=Translate", `--user-data-dir=${PROFILE}`, "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await wait(250);
}

const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: W, height: H, deviceScaleFactor: W < 500 ? 3 : 1, mobile: W < 500,
});

// Seed storage on the right origin, then load the page for real.
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(2500);
await evaluate(`(() => {
  ${NO_CONSENT ? "localStorage.removeItem('ppa-cookie-consent');" : "localStorage.setItem('ppa-cookie-consent','granted');"}
  ${DISMISS_FIRST ? "localStorage.setItem('ppa-promo-canes-and-the-cup-pro-am','1');"
                  : "localStorage.removeItem('ppa-promo-canes-and-the-cup-pro-am');"}
  return 1;
})()`);
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(5000); // page + the modal's 1200ms delay

const probe = `(() => {
  const d = document.querySelector('[role="dialog"][aria-labelledby^="promo-"]');
  const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;
  if (!d) return JSON.stringify({ open: false, overflow, bodyOverflow: getComputedStyle(document.body).overflow });
  const panel = d.firstElementChild;
  const img = d.querySelector('img');
  const b = panel.getBoundingClientRect();
  return JSON.stringify({
    open: true,
    overflow,
    bodyOverflow: getComputedStyle(document.body).overflow,
    panel: [b.x|0, b.y|0, b.width|0, b.height|0],
    fitsViewport: b.top >= -1 && b.bottom <= innerHeight + 1,
    panelScrollsInternally: panel.scrollHeight > panel.clientHeight + 1,
    ctaBottomOnScreen: (()=>{const l=d.querySelector("a"); return l ? l.getBoundingClientRect().bottom <= innerHeight+1 : null;})(),
    srHeading: d.querySelector('h2')?.textContent,
    eyebrow: d.querySelectorAll('p')[0]?.textContent,
    headline: d.querySelectorAll('p')[1]?.textContent,
    img: img && { src: img.currentSrc.replace(location.origin,''), w: img.naturalWidth, h: img.naturalHeight,
                  complete: img.complete, rendered: [img.getBoundingClientRect().width|0, img.getBoundingClientRect().height|0] },
    links: [...d.querySelectorAll('a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href'), target: a.target })),
    closeFocused: document.activeElement === d.querySelector('button[aria-label="Close"]'),
    zIndex: getComputedStyle(d).zIndex,
  });
})()`;
console.log(JSON.stringify(JSON.parse(await evaluate(probe)), null, 2));

if (OUT) {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(OUT, Buffer.from(shot.result.data, "base64"));
  console.log("screenshot ->", OUT);
}

// Esc must close it AND persist the dismissal.
const escResult = await evaluate(`(async () => {
  const has = () => !!document.querySelector('[role="dialog"][aria-labelledby^="promo-"]');
  if (!has()) return 'no-modal';
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await new Promise(r=>setTimeout(r,400));
  return JSON.stringify({ closed: !has(),
    stored: localStorage.getItem('ppa-promo-canes-and-the-cup-pro-am'),
    bodyOverflow: getComputedStyle(document.body).overflow });
})()`);
console.log("esc:", escResult);

ws.close(); chrome.kill();
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(0);
