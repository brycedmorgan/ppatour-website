import { readFileSync, writeFileSync } from "node:fs";
const DIR = "/private/tmp/claude-501/-Users-bryce/28996f53-0160-43f2-beb1-4c56cb1bc5d3/scratchpad/promo";
const uri = (f) => "data:image/jpeg;base64," + readFileSync(`${DIR}/${f}`).toString("base64");
const HOME = uri("home.jpg"), EVENT = uri("event.jpg"), RANK = uri("rankings.jpg");

const html = `<title>PPA Tour &mdash; New Site, In-Browser Reel</title>
<style>
  :root{--navy:#0C2B44;--navy-deep:#07203A;--yellow:#E7E700;--blue:#228BE6;--sky:#4DC1EF;
    --mute:rgba(255,255,255,.6);--disp:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;--ui:system-ui,-apple-system,Arial,sans-serif;}
  *{box-sizing:border-box}
  body{margin:0;background:#05121f;color:#fff;font-family:var(--ui);min-height:100vh;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:22px}
  .frameWrap{position:relative;width:min(96vw,1000px);aspect-ratio:16/10;border-radius:16px;overflow:hidden;
    background:radial-gradient(120% 90% at 80% 8%,#123a5d,var(--navy) 46%,var(--navy-deep));
    box-shadow:0 30px 90px -30px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.05);padding:clamp(20px,3.4vw,40px);
    display:flex;flex-direction:column;user-select:none}
  .topline{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:clamp(10px,1.6vw,16px)}
  .wm{font-family:var(--disp);font-weight:900;letter-spacing:.04em;font-size:clamp(11px,1.5vw,15px)}
  .wm b{color:var(--yellow)}
  .head{font-family:var(--disp);font-weight:900;text-transform:uppercase;letter-spacing:-.01em;line-height:1;
    font-size:clamp(13px,2vw,20px)}
  .head .y{color:var(--yellow)}

  /* browser window */
  .browser{flex:1;min-height:0;border-radius:11px;overflow:hidden;background:#0e2135;
    box-shadow:0 18px 50px -18px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);display:flex;flex-direction:column}
  .bar{display:flex;align-items:center;gap:12px;padding:0 14px;height:clamp(34px,4vw,44px);flex:none;
    background:linear-gradient(#eef2f6,#dfe6ee);border-bottom:1px solid #c7d1db}
  .lights{display:flex;gap:7px}
  .lights i{width:11px;height:11px;border-radius:50%}
  .lights .r{background:#ff5f57}.lights .y{background:#febc2e}.lights .g{background:#28c840}
  .addr{flex:1;height:clamp(20px,2.5vw,26px);background:#fff;border-radius:999px;border:1px solid #cdd7e0;
    display:flex;align-items:center;gap:8px;padding:0 12px;color:#2b3b4a;font-size:clamp(10px,1.3vw,13px);
    max-width:74%;margin:0 auto;font-weight:600}
  .addr .lock{width:9px;height:9px;border-radius:2px;border:1.6px solid #7a8a99;border-top:none;position:relative;flex:none}
  .addr .lock::before{content:"";position:absolute;left:50%;top:-6px;transform:translateX(-50%);width:7px;height:8px;
    border:1.6px solid #7a8a99;border-bottom:none;border-radius:5px 5px 0 0}
  .addr .dot{width:9px;height:9px;border-radius:50%;background:var(--yellow);flex:none;margin-left:auto}
  .addr b{color:#0b2030}
  .viewport{position:relative;flex:1;min-height:0;overflow:hidden;background:#0C2B44}
  .shot{position:absolute;top:0;left:0;width:100%;display:block;will-change:transform;opacity:0;transition:opacity .5s ease}
  .shot.show{opacity:1}
  .thumbTrack{position:absolute;top:6px;right:5px;bottom:6px;width:5px;border-radius:3px;background:rgba(255,255,255,.08);z-index:3}
  .thumb{position:absolute;right:5px;top:6px;width:5px;border-radius:3px;background:rgba(255,255,255,.45);z-index:4;height:22%}

  .foot{display:flex;align-items:center;justify-content:space-between;margin-top:clamp(10px,1.6vw,16px)}
  .caption{font-size:clamp(11px,1.6vw,16px);font-weight:600;color:#dbe8f2;letter-spacing:.01em;
    display:flex;align-items:center;gap:10px}
  .caption::before{content:"";width:22px;height:2px;background:var(--yellow);flex:none}
  .dots{display:flex;gap:7px}
  .dots i{width:24px;height:3px;border-radius:2px;background:rgba(255,255,255,.24)}
  .dots i.on{background:var(--yellow)}
  .url{font-size:clamp(10px,1.3vw,13px);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff}

  .controls{display:flex;gap:10px;align-items:center}
  .controls button{font-family:var(--ui);font-weight:700;font-size:13px;color:#cfe0ee;background:#0f2a42;
    border:1px solid rgba(255,255,255,.14);padding:9px 16px;border-radius:999px;cursor:pointer}
  .controls button:hover{background:#16405f;color:#fff}
  .controls button:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
  .cap{font-size:12px;color:#6f8aa2}
  @media (prefers-reduced-motion:reduce){.shot{transition:none}}
</style>

<div class="frameWrap" role="img" aria-label="The new ppatour.com scrolling inside a browser window">
  <div class="topline">
    <div class="wm">CARVANA <b>PPA</b> TOUR</div>
    <div class="head">The New <span class="y">PPATOUR.COM</span></div>
  </div>

  <div class="browser">
    <div class="bar">
      <div class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></div>
      <div class="addr"><span class="lock"></span><b id="addr">ppatour.com</b><span class="dot"></span></div>
    </div>
    <div class="viewport" id="vp">
      <img class="shot" id="shot" alt="ppatour.com">
      <div class="thumbTrack"></div>
      <div class="thumb" id="thumb"></div>
    </div>
  </div>

  <div class="foot">
    <div class="caption" id="caption">The home of pro pickleball</div>
    <div class="dots" id="dots"></div>
    <div class="url">Now live</div>
  </div>
</div>

<div class="controls">
  <button id="playBtn">Pause</button>
  <button id="replayBtn">Replay</button>
  <span class="cap">Real site, auto-scrolling &middot; screen-record the frame for Twitter / Facebook</span>
</div>

<script>
  var IMG={home:"${HOME}",event:"${EVENT}",rankings:"${RANK}"};
  var PAGES=[
    {src:IMG.home,url:"ppatour.com",label:"The home of pro pickleball"},
    {src:IMG.event,url:"ppatour.com/events/\\u2026/national-championships",label:"Every tournament, its own page"},
    {src:IMG.rankings,url:"ppatour.com/rankings",label:"Live World Pickleball Rankings"}
  ];
  var SCROLL_MS=5200, HOLD_TOP=750, HOLD_BOT=850, FADE=520;
  var shot=document.getElementById('shot'), vp=document.getElementById('vp'), thumb=document.getElementById('thumb'),
      addr=document.getElementById('addr'), caption=document.getElementById('caption'), dotsWrap=document.getElementById('dots'),
      playBtn=document.getElementById('playBtn'), replayBtn=document.getElementById('replayBtn');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  PAGES.forEach(function(){var i=document.createElement('i');dotsWrap.appendChild(i);});
  var dots=[].slice.call(dotsWrap.children);
  var idx=-1, timers=[], playing=true;
  function clear(){timers.forEach(clearTimeout);timers=[];}
  function at(fn,ms){timers.push(setTimeout(fn,ms));}
  function setThumb(pct,ms){ // pct 0..1 of scroll
    var track=vp.clientHeight-12, th=Math.max(0.14,vp.clientHeight/shot.offsetHeight)*track;
    thumb.style.height=th+'px';
    thumb.style.transition=ms?('transform '+ms+'ms cubic-bezier(.4,0,.2,1)'):'none';
    thumb.style.transform='translateY('+(pct*(track-th))+'px)';
  }
  function play(){
    var p=PAGES[(idx+1)%PAGES.length];
    shot.classList.remove('show');
    shot.onload=function(){
      var scrollBy=Math.max(0,shot.offsetHeight-vp.clientHeight);
      shot.style.transition='none'; shot.style.transform='translateY(0)'; setThumb(0,0);
      idx=(idx+1)%PAGES.length;
      addr.textContent=p.url; caption.textContent=p.label;
      dots.forEach(function(d,i){d.classList.toggle('on',i===idx);});
      requestAnimationFrame(function(){ shot.classList.add('show'); });
      if(reduce){ return; }
      at(function(){
        shot.style.transition='transform '+SCROLL_MS+'ms cubic-bezier(.42,0,.2,1)';
        shot.style.transform='translateY(-'+scrollBy+'px)'; setThumb(1,SCROLL_MS);
      },HOLD_TOP);
      at(function(){ shot.classList.remove('show'); }, HOLD_TOP+SCROLL_MS+HOLD_BOT);
      at(function(){ play(); }, HOLD_TOP+SCROLL_MS+HOLD_BOT+FADE);
    };
    shot.src=p.src;
  }
  function start(){clear();playing=true;playBtn.textContent='Pause';idx=-1;play();}
  playBtn.addEventListener('click',function(){
    if(playing){playing=false;playBtn.textContent='Play';clear();
      var t=getComputedStyle(shot).transform;shot.style.transition='none';shot.style.transform=t;
      var tt=getComputedStyle(thumb).transform;thumb.style.transition='none';thumb.style.transform=tt;
    } else {playing=true;playBtn.textContent='Pause';play();}
  });
  replayBtn.addEventListener('click',start);
  start();
</script>`;

writeFileSync("/private/tmp/claude-501/-Users-bryce/28996f53-0160-43f2-beb1-4c56cb1bc5d3/scratchpad/ppa-browser-reel.html", html);
writeFileSync("/Users/bryce/pickleball/ppatour-website/scratchpad/ppa-browser-reel.html", html);
console.log("built", (html.length/1024/1024).toFixed(2), "MB");
