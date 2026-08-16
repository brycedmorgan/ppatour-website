// Capture clean above-fold shots of the live site for the promo motion graphic.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/private/tmp/claude-501/-Users-bryce/28996f53-0160-43f2-beb1-4c56cb1bc5d3/scratchpad/promo";
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = [
  ["home", "https://www.ppatour.com/"],
  ["event", "https://www.ppatour.com/events/2026/veolia-pickleball-national-championships/"],
  ["rankings", "https://www.ppatour.com/rankings/"],
  ["athlete", "https://www.ppatour.com/athletes/ben-johns/"],
  ["watch", "https://www.ppatour.com/watch/"],
];

const PORT = 9455;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--hide-scrollbars", `--user-data-dir=/tmp/cdp-promo2`, "about:blank"], { stdio: "ignore" });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await wait(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 2, mobile: false });

// Hide the fixed chrome that clutters a promo frame.
const HIDE = `
  document.querySelectorAll('[class*="cookie" i],[class*="CookieBanner"],[id*="userway" i],[class*="uai" i]').forEach(e=>e.remove());
  const kill=(sel)=>document.querySelectorAll(sel).forEach(e=>{const s=getComputedStyle(e);if(s.position==='fixed'&&e.getBoundingClientRect().bottom>700)e.style.display='none';});
  kill('div');kill('section');kill('aside');
  true;`;

for (const [name, url] of PAGES) {
  await send("Page.navigate", { url });
  await wait(3800);
  await send("Runtime.evaluate", { expression: HIDE, returnByValue: true });
  await wait(500);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1440, height: 810, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64"));
  console.log("captured", name);
}
ws.close(); chrome.kill();
console.log("DONE ->", OUT);
process.exit(0);
