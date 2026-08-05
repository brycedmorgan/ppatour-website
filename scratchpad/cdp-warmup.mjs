/**
 * Measures the header mega-panel image warmup on a MOBILE viewport.
 *
 * Counts image requests rather than timing LCP on purpose: the 8/5 pt.11 log
 * records two mobile-LCP "fixes" that measured as no-ops against a prod spread
 * (3.03–5.85s) wider than any real effect. Request counts are deterministic.
 *
 * Usage: node scratchpad/cdp-warmup.mjs <url> [label]
 */
import { spawn } from "node:child_process";

const URL_UNDER_TEST = process.argv[2];
const LABEL = process.argv[3] ?? URL_UNDER_TEST;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9347;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--user-data-dir=/tmp/cdp-ppa-warmup", "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await wait(250);
}

const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const requests = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  // ⚠ The byte figure MUST come from loadingFinished, keyed by requestId.
  // responseReceived's encodedDataLength is headers-only at that point, which
  // reports a 1.1 MB page as ~31 KB.
  if (m.method === "Network.responseReceived") {
    requests.push({ reqId: m.params.requestId, url: m.params.response.url,
                    type: m.params.type, bytes: 0 });
  }
  if (m.method === "Network.loadingFinished") {
    const r = requests.find((x) => x.reqId === m.params.requestId);
    if (r) r.bytes = m.params.encodedDataLength;
  }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Network.enable");
// ⚠ Without this the profile dir (/tmp/cdp-ppa-warmup) persists between runs
// and every image is a cache hit, which reports encodedDataLength 0 — i.e. a
// 1.1 MB page measures as ~1 KB of images. First-visit cost is what we want.
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Page.enable");
// ⚠ CDP device metrics, never --window-size: the 7/31 pt.5 log records that
// --window-size floors the LAYOUT viewport near 500px on this setup, so a
// "390px" run silently measures a tablet.
await send("Emulation.setDeviceMetricsOverride", {
  width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
});
await send("Emulation.setUserAgentOverride", {
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
    + "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

await send("Page.navigate", { url: URL_UNDER_TEST });
// Long enough to catch a deferred warmup: requestIdleCallback timeout is 3s,
// the setTimeout fallback 2s. If the gate works, nothing new arrives anyway.
await wait(12000);

const imgs = requests.filter((r) => /\/_next\/image/.test(r.url));
// The three warmed paths. The hero photo is the interesting one: the homepage
// hero renders it at quality 65, so this q=75 copy is a SECOND full download of
// the same picture, landing in the LCP window.
const WARM = ["action-singles", "action-mxd", "nationals-championship-court"];
const warmHits = imgs.filter((r) =>
  WARM.some((w) => r.url.includes(w)) && /q=75/.test(r.url) && /w=(384|640)/.test(r.url));
const totalBytes = requests.reduce((a, r) => a + r.bytes, 0);
const imgBytes = imgs.reduce((a, r) => a + r.bytes, 0);

console.log(`\n=== ${LABEL} (390x844, DPR3, iPhone UA) ===`);
console.log(`total requests      : ${requests.length}`);
console.log(`total bytes         : ${(totalBytes / 1024).toFixed(0)} KB`);
console.log(`/_next/image count  : ${imgs.length}`);
console.log(`/_next/image bytes  : ${(imgBytes / 1024).toFixed(0)} KB`);
console.log(`MEGA-PANEL WARMUP   : ${warmHits.length} request(s)  <-- desktop-only UI`);
for (const w of warmHits) {
  console.log(`   ${(w.bytes / 1024).toFixed(1).padStart(7)} KB  ${w.url.replace(/^.*_next/, "_next").slice(0, 96)}`);
}

ws.close();
chrome.kill();
process.exit(0);
