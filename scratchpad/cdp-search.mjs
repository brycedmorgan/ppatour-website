import { spawn } from "node:child_process";
import net from "node:net";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9331;
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--user-data-dir=/tmp/cdp-ppa-search", "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {}
    await wait(250);
  }
  throw new Error("chrome never came up");
}
await ready();
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = tabs.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result.result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: "https://www.ppatour.com/events/" });
await wait(6000);

// React controls the input, so set the value through the native setter and
// dispatch a real input event — assigning .value alone never reaches state.
const type = async (q) => {
  await evalJs(`(() => {
    const el = document.querySelector('input[type=search]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(q)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await wait(700);
  return evalJs(`(() => {
    const sec = document.querySelector('input[type=search]').closest('section') || document.body;
    const counter = [...sec.querySelectorAll('span')].find(s => /^\\d+ Events?$/.test(s.textContent.trim()));
    const cards = [...sec.querySelectorAll('article')];
    return { counter: counter ? counter.textContent.trim() : null, dom: cards.length,
             names: cards.slice(0,4).map(c => (c.querySelector('h3,h2,p.font-display')||c).textContent.trim().slice(0,52)) };
  })()`);
};

const QUERIES = ["Washington", "Raleigh", "Dallas", "las vagas", "challanger", "September"];
for (const q of QUERIES) {
  const r = await type(q);
  console.log(`"${q}"  counter=${r.counter}  domCards=${r.dom}\n     ${r.names.join(" | ")}`);
}
ws.close();
chrome.kill();
