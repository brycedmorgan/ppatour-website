// Full-page JPEG captures of the live site for a browser-window scroll reel.
// JPEG @1x keeps the CDP screenshot payload small (big PNGs over the WS frame
// limit was what hung the earlier runs).
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/private/tmp/claude-501/-Users-bryce/28996f53-0160-43f2-beb1-4c56cb1bc5d3/scratchpad/promo";
mkdirSync(OUT, { recursive: true });
const log = (...a) => process.stderr.write(a.join(" ") + "\n");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { log("SELF-KILL timeout"); process.exit(3); }, 105000);

const PAGES = [
  ["home", "https://www.ppatour.com/"],
  ["event", "https://www.ppatour.com/events/2026/veolia-pickleball-national-championships/"],
  ["rankings", "https://www.ppatour.com/rankings/"],
];
const W = 1400, MAXH = 3400, PORT = 9466;

const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--hide-scrollbars", `--user-data-dir=/tmp/cdp-promo3`, "about:blank"], { stdio: "ignore" });
for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await wait(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: 900, deviceScaleFactor: 1, mobile: false });

const HIDE = `(function(){
  [...document.querySelectorAll('div,section,aside,footer')].forEach(e=>{
    const s=getComputedStyle(e);
    if((s.position==='fixed'||s.position==='sticky') && /cookie|analytics|we use cookies/i.test(e.textContent||'') && e.offsetHeight<180) e.remove();
  });
  document.querySelectorAll('[id*="userway" i],[class*="userway" i],[class*="uai" i]').forEach(e=>e.remove());
})();true;`;

for (const [name, url] of PAGES) {
  log("navigate", name);
  await send("Page.navigate", { url });
  await wait(4200);
  await send("Runtime.evaluate", { expression: HIDE, returnByValue: true });
  await send("Runtime.evaluate", { expression: "window.scrollTo(0,0)", returnByValue: true });
  await wait(600);
  const lm = await send("Page.getLayoutMetrics");
  const full = Math.min(Math.ceil(lm.result.cssContentSize?.height || 2000), MAXH);
  log(name, "height", full);
  const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 72,
    captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: full, scale: 1 } });
  if (!r.result?.data) { log("NO DATA for", name); continue; }
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(r.result.data, "base64"));
  log("saved", name);
}
ws.close(); chrome.kill();
log("DONE");
process.exit(0);
