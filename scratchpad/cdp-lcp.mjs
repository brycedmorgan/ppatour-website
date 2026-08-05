// Mobile LCP, median of N runs, against a LOCAL build (8/5 pt.11: production
// LCP spread 3.03-5.85s is wider than any fix, so prod is not a usable control).
import { spawn } from "node:child_process";
const URL_UNDER_TEST = process.argv[2], LABEL = process.argv[3], RUNS = Number(process.argv[4] ?? 5);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lcps = [];
for (let run = 0; run < RUNS; run++) {
  const PORT = 9400 + run;
  const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
    `--user-data-dir=/tmp/cdp-lcp-${run}`, "about:blank"], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await wait(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  // Fixed throttle so runs are comparable: 4x CPU, ~10Mbps/40ms - a mid phone.
  await send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await send("Network.emulateNetworkConditions", { offline: false, latency: Number(process.env.RTT ?? 40),
    downloadThroughput: Number(process.env.KBPS ?? 10240) * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8 });
  await send("Page.navigate", { url: URL_UNDER_TEST });
  await wait(11000);
  const r = await send("Runtime.evaluate", { expression:
    `new Promise(res=>{let v=0;new PerformanceObserver(l=>{for(const e of l.getEntries())v=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});setTimeout(()=>res(Math.round(v)),300)})`,
    awaitPromise: true, returnByValue: true });
  lcps.push(r.result.result.value);
  ws.close(); chrome.kill(); await wait(400);
}
lcps.sort((a, b) => a - b);
console.log(`\n${LABEL}\n  runs (ms): ${lcps.join(", ")}\n  MEDIAN LCP: ${lcps[Math.floor(lcps.length/2)]} ms`);
process.exit(0);
