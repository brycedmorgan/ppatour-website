import { spawn } from "node:child_process";
const U = process.argv[2]; const PORT = 9377;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, "--headless=new", "--no-first-run",
  "--user-data-dir=/tmp/cdp-lcp-el", "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok)break}catch{}await wait(250)}
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find(t=>t.type==="page").webSocketDebuggerUrl);
await new Promise(r=>(ws.onopen=r));
let id=0; const pending=new Map(), reqs=[];
ws.onmessage=(e)=>{const m=JSON.parse(e.data);
  if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}
  if(m.method==="Network.responseReceived")reqs.push({reqId:m.params.requestId,url:m.params.response.url,bytes:0});
  if(m.method==="Network.loadingFinished"){const r=reqs.find(x=>x.reqId===m.params.requestId);if(r)r.bytes=m.params.encodedDataLength}};
const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method,params}))});
await send("Network.enable");await send("Network.setCacheDisabled",{cacheDisabled:true});
await send("Page.enable");await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:3,mobile:true});
await send("Emulation.setUserAgentOverride",{userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"});
await send("Emulation.setCPUThrottlingRate",{rate:4});
await send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:1638*1024/8,uploadThroughput:750*1024/8});
await send("Page.navigate",{url:U});
await wait(14000);
const r=await send("Runtime.evaluate",{expression:`new Promise(res=>{let v=null;new PerformanceObserver(l=>{for(const e of l.getEntries())v=e}).observe({type:'largest-contentful-paint',buffered:true});setTimeout(()=>res(v?{ms:Math.round(v.startTime),tag:v.element?.tagName,cls:(v.element?.className||'').slice(0,70),url:v.url||''}:null),300)})`,awaitPromise:true,returnByValue:true});
const lcp=r.result.result.value;
console.log("\nLCP element:",JSON.stringify(lcp,null,2));
const imgs=reqs.filter(x=>/_next\/image/.test(x.url)).sort((a,b)=>b.bytes-a.bytes);
console.log("\nheaviest image requests on mobile:");
for(const i of imgs.slice(0,6)) console.log(`  ${(i.bytes/1024).toFixed(1).padStart(8)} KB  ${decodeURIComponent(i.url).replace(/^.*url=/,'').slice(0,80)}`);
const lcpReq=reqs.find(x=>lcp&&lcp.url&&x.url===lcp.url);
if(lcpReq)console.log(`\nLCP IMAGE BYTES: ${(lcpReq.bytes/1024).toFixed(1)} KB`);
ws.close();chrome.kill();process.exit(0);
