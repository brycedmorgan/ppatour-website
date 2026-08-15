/**
 * Measures the athlete-profile hero at a TRUE mobile viewport and screenshots it.
 *
 * ⚠ CDP Emulation.setDeviceMetricsOverride, never --window-size / resize_window.
 * The extension's resize_window reported success on this page and left the layout
 * viewport at 1512 (same trap as 7/31 pt. 5, 8/3 pt. 3).
 *
 * Usage: node scratchpad/cdp-hero.mjs <url> <width> <height> [outfile.png]
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const URL_UNDER_TEST = process.argv[2];
const W = Number(process.argv[3] ?? 390);
const H = Number(process.argv[4] ?? 844);
const OUT = process.argv[5] ?? null;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9351;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--user-data-dir=/tmp/cdp-ppa-hero", "about:blank",
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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: W, height: H, deviceScaleFactor: W < 500 ? 3 : 1, mobile: W < 500,
});
await send("Page.navigate", { url: URL_UNDER_TEST });
await wait(4500);

const probe = `(() => {
  const h1 = document.querySelector('h1');
  const sec = h1.closest('section');
  const heroImg = [...sec.querySelectorAll('img')].find(i => i.alt === '' && i.getBoundingClientRect().width > sec.getBoundingClientRect().width * 0.9);
  const r = (el) => { const b = el.getBoundingClientRect(); return [b.x|0, b.y|0, b.width|0, b.height|0]; };
  const stuck = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).opacity === '0').length;
  return JSON.stringify({
    viewport: [innerWidth, innerHeight],
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    section: r(sec),
    heroImage: heroImg ? { rect: r(heroImg), loaded: heroImg.complete && heroImg.naturalWidth > 0 } : null,
    h1: r(h1),
    stuckAtOpacityZero: stuck,
  });
})()`;
const res = await send("Runtime.evaluate", { expression: probe, returnByValue: true });
console.log(res.result.result.value);

if (OUT) {
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(OUT, Buffer.from(shot.result.data, "base64"));
  console.log("wrote", OUT);
}

ws.close();
chrome.kill();
process.exit(0);
