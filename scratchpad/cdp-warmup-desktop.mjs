import { spawn } from "node:child_process";
const URL_UNDER_TEST = process.argv[2], LABEL = process.argv[3] ?? URL_UNDER_TEST;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9351;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--user-data-dir=/tmp/cdp-ppa-warmup-d", "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await wait(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(), requests = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Network.responseReceived") requests.push({ reqId: m.params.requestId, url: m.params.response.url, bytes: 0 });
  if (m.method === "Network.loadingFinished") { const r = requests.find((x) => x.reqId === m.params.requestId); if (r) r.bytes = m.params.encodedDataLength; } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true }); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(12000);
const WARM = ["action-singles", "action-mxd", "nationals-championship-court"];
const warm = requests.filter((r) => /\/_next\/image/.test(r.url) && WARM.some((w) => r.url.includes(w)) && /q=75/.test(r.url) && /w=(384|640)/.test(r.url));
console.log(`\n=== ${LABEL} (1440x900 DESKTOP) ===`);
console.log(`MEGA-PANEL WARMUP : ${warm.length} request(s)  <-- must stay >0, this is the feature`);
for (const w of warm) console.log(`   ${(w.bytes/1024).toFixed(1).padStart(7)} KB  ${w.url.replace(/^.*_next/, "_next").slice(0,92)}`);
ws.close(); chrome.kill(); process.exit(0);
