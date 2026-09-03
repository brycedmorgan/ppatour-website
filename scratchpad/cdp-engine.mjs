/**
 * Measures the Engine placement on a rendered event page: is the card visible,
 * where does it sit, and does the page overflow sideways.
 *
 * CDP Emulation.setDeviceMetricsOverride, never --window-size (7/31 pt. 5).
 * Fresh profile + SW unregister: this site's service worker serves stale JS.
 *
 * Usage: node cdp-engine.mjs <url> <width> <height> [out.png]
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const URL_UNDER_TEST = process.argv[2];
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const OUT = process.argv[5] ?? null;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9391;
const PROFILE = `C:/Users/WESLEY~1/AppData/Local/Temp/cdp-ppa-engine-${process.pid}`;

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
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) console.error("EVAL THREW:", JSON.stringify(r.result.exceptionDetails).slice(0, 600));
  return r.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: W < 500 ? 3 : 1, mobile: W < 500 });
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(2000);
await evaluate(`(async () => {
  localStorage.setItem('ppa-cookie-consent','granted');
  localStorage.setItem('ppa-promo-canes-and-the-cup-pro-am','1');
  const rs = await navigator.serviceWorker?.getRegistrations?.() ?? [];
  for (const r of rs) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  return rs.length;
})()`);
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(7000);

const probe = `(() => {
  const links = [...document.querySelectorAll('a[href*="engine.com"]')];
  const card = links.length ? links[0].closest('div') : null;
  if (card) card.scrollIntoView({ block: 'center' });
  const rect = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;
  const sectionOf = (el) => el?.closest('section')?.id || null;
  return JSON.stringify({
    viewport: innerWidth + 'x' + innerHeight,
    engineLinks: links.map(a => ({
      text: a.textContent.trim().replace(/\s+/g,' ').slice(0,44),
      section: sectionOf(a),
      box: rect(a),
      visible: !!(a.offsetWidth && a.offsetHeight) && getComputedStyle(a).opacity !== '0',
    })),
    cardBox: card ? rect(card) : null,
    cardSection: sectionOf(card),
    logoLoaded: (() => { const i = card?.querySelector('img'); return i ? { complete: i.complete, nw: i.naturalWidth } : null; })(),
    officialTravelPartner: /Official Travel Partner/i.test(document.body.innerText),
    onsiteCopy: /Still need a room/i.test(document.body.innerText),
    planCopy: /More rooms near/i.test(document.body.innerText),
    groupLine: /Request rates for these dates/i.test(document.body.innerText),
    horizontalOverflowPx: overflow,
  }, null, 2);
})()`;
console.log(await evaluate(probe));

if (OUT) {
  await wait(600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(OUT, Buffer.from(shot.result.data, "base64"));
  console.log("screenshot:", OUT);
}
chrome.kill();
process.exit(0);
