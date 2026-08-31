/**
 * The consent gate is gone, so the promo now opens OVER an unanswered cookie
 * banner. This proves the banner is still usable underneath it: not merely
 * visible, but the top element at its own coordinates, and still able to take
 * a real click while the modal is up.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const URL_UNDER_TEST = process.argv[2] ?? "http://localhost:3000/";
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9379;
const PROFILE = `C:/Users/WESLEY~1/AppData/Local/Temp/cdp-ppa-banner-${process.pid}`;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  `--user-data-dir=${PROFILE}`, "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await wait(250);
}
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: W < 500 ? 3 : 1, mobile: W < 500 });
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(2500);
await ev("(()=>{localStorage.clear();return 1})()");   // never answered the banner
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(5000);

const probe = `(async () => {
  const modal  = () => document.querySelector('[role="dialog"][aria-labelledby^="promo-"]');
  const accept = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Accept');
  const out = {};
  out.modalOpenOverUnansweredBanner = !!modal();
  const btn = accept();
  out.bannerPresent = !!btn;
  if (btn) {
    const r = btn.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    const top = document.elementFromPoint(cx, cy);
    out.topElementAtAcceptButton = top ? (top.tagName + (top.textContent||'').trim().slice(0,12)) : null;
    out.acceptIsHitTestable = !!top && (top === btn || btn.contains(top) || top.contains(btn));
    // the backdrop must stop above the banner
    const back = modal();
    out.backdropBottom = back ? Math.round(back.getBoundingClientRect().bottom) : null;
    out.bannerTop = Math.round(r.top);
    out.backdropClearsBanner = back ? back.getBoundingClientRect().bottom <= r.top + 1 : null;
    btn.click();                       // a REAL click, not a synthetic event
    await new Promise(r => setTimeout(r, 900));
    out.bannerGoneAfterClick = !accept();
    out.modalStillOpenAfterClick = !!modal();
    out.consentStored = localStorage.getItem('ppa-cookie-consent');
  }
  return JSON.stringify(out);
})()`;
console.log(JSON.stringify(JSON.parse(await ev(probe)), null, 2));

ws.close(); chrome.kill();
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(0);
