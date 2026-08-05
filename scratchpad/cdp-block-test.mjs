// Decisive test: is mobile LCP bandwidth-bound? Block the below-fold callout
// photos and see whether the hero paints sooner. No rebuild needed.
import { spawn } from "node:child_process";
const U = process.argv[2], BLOCK = process.argv[3] === "block";
const PORT = BLOCK ? 9388 : 9389;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME,[`--remote-debugging-port=${PORT}`,"--headless=new","--no-first-run",
  `--user-data-dir=/tmp/cdp-block-${BLOCK}`,"about:blank"],{stdio:"ignore"});
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok)break}catch{}await wait(250)}
const tabs=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws=new WebSocket(tabs.find(t=>t.type==="page").webSocketDebuggerUrl);
await new Promise(r=>(ws.onopen=r));
let id=0;const pending=new Map();
ws.onmessage=(e)=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
const send=(m,p={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}))});
await send("Network.enable");await send("Network.setCacheDisabled",{cacheDisabled:true});
if(BLOCK) await send("Network.setBlockedURLs",{urls:["*tickets-worlds-crowd*","*follow-finals-crowd*","*play-amateur-court*","*watch-broadcast-desk*"]});
await send("Page.enable");await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:3,mobile:true});
await send("Emulation.setCPUThrottlingRate",{rate:4});
await send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:1638*1024/8,uploadThroughput:750*1024/8});
const runs=[];
for(let k=0;k<3;k++){
  await send("Page.navigate",{url:U+"?cb="+k});
  await wait(12000);
  const r=await send("Runtime.evaluate",{expression:`new Promise(res=>{let v=0;new PerformanceObserver(l=>{for(const e of l.getEntries())v=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});setTimeout(()=>res(Math.round(v)),300)})`,awaitPromise:true,returnByValue:true});
  runs.push(r.result.result.value);
}
runs.sort((a,b)=>a-b);
console.log(`${BLOCK?"CALLOUT PHOTOS BLOCKED":"BASELINE (all images)"}  runs: ${runs.join(", ")}  MEDIAN: ${runs[1]} ms`);
ws.close();chrome.kill();process.exit(0);
