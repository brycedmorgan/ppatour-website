/**
 * The consent handshake: the promo must stay down while the cookie banner is
 * unanswered (its backdrop would cover Accept/Decline), and must appear on the
 * SAME page view once the visitor answers — no reload.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const URL_UNDER_TEST = process.argv[2] ?? "http://localhost:3000/";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9378;
const PROFILE = `C:/Users/WESLEY~1/AppData/Local/Temp/cdp-ppa-consent-${process.pid}`;

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
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(2500);
await ev("(()=>{localStorage.clear();return 1})()");
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(5000);

const script = `(async () => {
  const modal = () => !!document.querySelector('[role="dialog"][aria-labelledby^="promo-"]');
  const accept = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Accept');
  const out = { bannerShown: !!accept(), modalBeforeAccept: modal() };
  accept()?.click();
  await new Promise(r => setTimeout(r, 2600));
  out.bannerGoneAfterAccept = !accept();
  out.modalAfterAccept = modal();
  out.consentStored = localStorage.getItem('ppa-cookie-consent');
  return JSON.stringify(out);
})()`;
console.log(JSON.stringify(JSON.parse(await ev(script)), null, 2));

ws.close(); chrome.kill();
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(0);
