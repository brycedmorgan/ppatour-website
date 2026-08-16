// Compose a static social announcement image and render it to PNG/JPG via CDP.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DIR = "/private/tmp/claude-501/-Users-bryce/28996f53-0160-43f2-beb1-4c56cb1bc5d3/scratchpad";
const HOME = "data:image/jpeg;base64," + readFileSync(`${DIR}/promo/home.jpg`).toString("base64");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => process.exit(3), 60000);

const html = `<!doctype html><meta charset="utf-8"><style>
  :root{--navy:#0C2B44;--navy-deep:#07203A;--yellow:#E7E700;--blue:#228BE6;--sky:#4DC1EF;
    --line:rgba(255,255,255,.13);--disp:"Helvetica Neue",Helvetica,Arial,sans-serif;--ui:system-ui,Arial,sans-serif}
  *{margin:0;box-sizing:border-box}
  html,body{width:1600px;height:900px}
  body{font-family:var(--ui);color:#fff;overflow:hidden;position:relative;
    background:radial-gradient(120% 100% at 82% 6%,#123a5d 0%,var(--navy) 46%,var(--navy-deep) 100%)}
  /* pickleball court motif */
  .court{position:absolute;inset:44px;pointer-events:none}
  .court span{position:absolute;background:var(--line)}
  .court .net{left:50%;top:0;bottom:0;width:2px}.court .kl{left:36%;top:0;bottom:0;width:2px}
  .court .kr{left:64%;top:0;bottom:0;width:2px}.court .cll{left:0;top:50%;width:36%;height:2px}
  .court .clr{right:0;top:50%;width:36%;height:2px}
  .court .b{inset:0;border:2px solid var(--line);border-radius:8px}
  .wrap{position:absolute;inset:0;padding:70px 76px;display:flex;flex-direction:column}
  .top{display:flex;align-items:center;justify-content:space-between}
  .wm{font-family:var(--disp);font-weight:900;letter-spacing:.05em;font-size:22px}
  .wm b{color:var(--yellow)}
  .pill{font-size:14px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--navy);
    background:var(--yellow);padding:9px 16px;border-radius:999px}
  .mid{flex:1;display:grid;grid-template-columns:47% 53%;gap:54px;align-items:center;margin-top:8px}
  .eyebrow{font-size:17px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:var(--sky);
    display:flex;align-items:center;gap:12px;margin-bottom:22px}
  .eyebrow::before{content:"";width:34px;height:2px;background:var(--yellow)}
  h1{font-family:var(--disp);font-weight:900;text-transform:uppercase;line-height:.9;letter-spacing:-.02em;font-size:82px}
  h1 .y{color:var(--yellow)}
  .sub{margin-top:26px;font-size:23px;line-height:1.45;color:rgba(255,255,255,.72);max-width:20ch}
  .tag{margin-top:34px;display:flex;align-items:center;gap:16px}
  .tag .url{font-family:var(--disp);font-weight:900;font-size:26px;letter-spacing:.02em;color:#fff}
  .tag .ih{font-size:15px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--sky)}
  /* browser window */
  .browser{border-radius:14px;overflow:hidden;background:#0e2135;
    box-shadow:0 40px 90px -30px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.09);transform:translateY(4px)}
  .bar{display:flex;align-items:center;gap:16px;padding:0 18px;height:52px;background:linear-gradient(#eef2f6,#dfe6ee);border-bottom:1px solid #c7d1db}
  .lights{display:flex;gap:9px}.lights i{width:14px;height:14px;border-radius:50%}
  .lights .r{background:#ff5f57}.lights .y{background:#febc2e}.lights .g{background:#28c840}
  .addr{flex:1;height:30px;background:#fff;border-radius:999px;border:1px solid #cdd7e0;display:flex;align-items:center;gap:10px;
    padding:0 16px;color:#0b2030;font-size:16px;font-weight:700;max-width:70%;margin:0 auto}
  .addr .lock{width:11px;height:11px;border-radius:2px;border:2px solid #7a8a99;border-top:none;position:relative}
  .addr .lock::before{content:"";position:absolute;left:50%;top:-7px;transform:translateX(-50%);width:8px;height:9px;border:2px solid #7a8a99;border-bottom:none;border-radius:5px 5px 0 0}
  .addr .dot{width:11px;height:11px;border-radius:50%;background:var(--yellow);margin-left:auto}
  .vp{height:452px;overflow:hidden;background:#0C2B44}
  .vp img{width:100%;display:block}
</style>
<div class="court"><span class="b"></span><span class="net"></span><span class="kl"></span><span class="kr"></span><span class="cll"></span><span class="clr"></span></div>
<div class="wrap">
  <div class="top"><div class="wm">CARVANA <b>PPA</b> TOUR</div><div class="pill">Now Live</div></div>
  <div class="mid">
    <div>
      <div class="eyebrow">Just Launched</div>
      <h1>The New<br><span class="y">PPATOUR<br>.COM</span></h1>
      <div class="sub">Every tournament, live world rankings, and player profiles wired to the news.</div>
      <div class="tag"><span class="url">ppatour.com</span><span class="ih">Built 100% in-house</span></div>
    </div>
    <div class="browser">
      <div class="bar"><div class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></div>
        <div class="addr"><span class="lock"></span>ppatour.com<span class="dot"></span></div></div>
      <div class="vp"><img src="${HOME}" alt=""></div>
    </div>
  </div>
</div>`;

const FILE = `${DIR}/announcement.html`;
writeFileSync(FILE, html);

const PORT = 9477;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--hide-scrollbars", `--user-data-dir=/tmp/cdp-ann`, "about:blank"], { stdio: "ignore" });
for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await wait(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 2, mobile: false });
await send("Page.navigate", { url: `file://${FILE}` });
await wait(2600);
const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 93, clip: { x: 0, y: 0, width: 1600, height: 900, scale: 2 } });
writeFileSync(`${DIR}/ppa-announcement.jpg`, Buffer.from(r.result.data, "base64"));
ws.close(); chrome.kill();
console.log("SAVED", `${DIR}/ppa-announcement.jpg`);
process.exit(0);
