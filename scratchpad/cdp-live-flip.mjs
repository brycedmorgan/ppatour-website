/**
 * Watches the homepage cross a live boundary in a real browser.
 *
 * It drives /live, which renders the REAL homepage under a shifted clock — so
 * what you see here is the production code deciding, not a forced live flag.
 *
 *   node scratchpad/cdp-live-flip.mjs                    # 8s before first serve
 *   MODE=ends node scratchpad/cdp-live-flip.mjs          # 8s before the last point
 *   EVENT=veolia-arizona-open node scratchpad/cdp-live-flip.mjs
 *   BASE=https://www.ppatour.com SECS=20 W=390 node scratchpad/cdp-live-flip.mjs
 *
 * ⚠ CDP device metrics, never --window-size — on Windows the flag floors the
 * LAYOUT viewport near 500px, so a "390px" run silently measures ~500 (7/31
 * pt.5). And escape `\d` as `\d` inside the evaluated expressions: a template
 * literal eats the single backslash and the regex quietly stops matching.
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE ?? "http://localhost:3000";
const MODE = process.env.MODE === "ends" ? "ends" : "in";
const SECS = Number(process.env.SECS ?? 8);
const EVENT = process.env.EVENT ?? "";
const WIDTH = Number(process.env.W ?? 1440);
const HEIGHT = Number(process.env.H ?? 900);
const PORT = Number(process.env.PORT ?? 9222);

const url = `${BASE}/live/?${MODE}=${SECS}${EVENT ? `&event=${EVENT}` : ""}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-live-flip-"))}`,
    "--no-first-run",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: "ignore" },
);
await sleep(2500);

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: WIDTH <= 430 ? 3 : 1,
  mobile: WIDTH <= 430,
});

const evaluate = async (expression) => {
  const m = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (m.result?.exceptionDetails) {
    return { ERR: String(m.result.exceptionDetails.exception?.description ?? "") };
  }
  return m.result?.result?.value;
};

// The hero countdown is a .tabular-nums span inside the hero; the preview badge
// has one too, so scope to the hero or the two get confused.
const PROBE = `(function () {
  var t = document.body.innerText;
  var h1 = document.querySelector("h1");
  var hero = h1 ? h1.closest("section") : null;
  var cd = hero ? hero.querySelector(".tabular-nums") : null;
  return {
    event: h1 ? h1.innerText.replace(/\s+/g, " ").trim().slice(0, 34) : null,
    live: /Matches in progress/i.test(t),
    countdown: cd ? cd.textContent.trim() : null,
    bracket: /View Full Bracket/i.test(t),
    overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
  };
})()`;

console.log(`→ ${url}   (${WIDTH}x${HEIGHT})`);
await send("Page.navigate", { url });
await sleep(3500);

const started = Date.now();
let last = "";
while (Date.now() - started < (SECS + 16) * 1000) {
  const line = JSON.stringify(await evaluate(PROBE));
  if (line !== last) {
    console.log(`+${String(Date.now() - started).padStart(6)}ms`, line);
    last = line;
  }
  await sleep(900);
}

ws.close();
chrome.kill();
