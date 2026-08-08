// Generates /pbtv/shows/<slug>/index.html — one page per PBTV original.
// The airing list is read from the EPG embedded in public/pbtv/index.html
// (single source; refresh that, re-run this). Art files are PBTV's own 16:9
// show badges in public/pbtv/shows/art/. The 9:16 poster slot is a labelled
// PLACEHOLDER until PBTV sends real vertical key art — don't fake it.
//
// Run: node scripts/build-pbtv-shows.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PBTV = join(ROOT, "public", "pbtv");

const SHOWS = [
  {
    slug: "partners", title: "Partners", chip: "docuseries",
    match: "Partners: Pickleball's First Reality Docuseries",
    desc: "Pickleball's first reality docuseries — the partnerships behind the game's biggest doubles teams, on the court and off it.",
  },
  {
    slug: "beyond-the-courts", title: "Beyond The Courts: LA Xtreme", chip: "docuseries",
    match: "Beyond The Courts: LA Xtreme - Powered by Organics Ocean",
    desc: "Inside the LA Xtreme — an MLP season from the team huddle, the bench and the bus. Powered by Organics Ocean.",
  },
  {
    slug: "brighter-pickleball", title: "Brighter Pickleball: On Tour", chip: "weekly",
    match: "Brighter Pickleball: On Tour",
    desc: "The season, week by week — every stop, storyline and champion, recapped from inside the tour.",
  },
  {
    slug: "shock-and-awe", title: "Shock and Awe", chip: "season 2",
    match: "Shock and Awe Season 2 presented by Heat Controller",
    desc: "The wildest rallies, trick shots and jaw-droppers on tour. Season 2, presented by Heat Controller.",
  },
  {
    slug: "pickleballers-podcast", title: "Pickleballers Podcast", chip: "podcast",
    match: "Pickleballers Podcast",
    desc: "Long-form conversations with the tour's biggest voices — players, broadcasters and the people who run the sport.",
  },
  {
    slug: "mlp-championship-series", title: "MLP Championship Series", chip: "series",
    match: "MLP Championship Series",
    desc: "The champions-level bracket, taped courtside — team battles from Chicago and beyond.",
  },
  {
    slug: "my-pickleball-life", title: "My Pickleball Life", chip: "series",
    match: "My Pickleball Life",
    desc: "One player, one story — how the game's pros live the sport away from the scoreboard.",
  },
  {
    slug: "pbtv-hot-shots", title: "PBTV Hot Shots", chip: "highlights",
    match: "PBTV Hot Shots",
    desc: "Every top shot from PPA Tour and MLP play, cut into rapid-fire episodes.",
  },
];

// ── read the EPG out of the concept page (one source of truth) ─────────────
const index = readFileSync(join(PBTV, "index.html"), "utf8");
const m = index.match(/const EPG=\[\n([\s\S]*?)\n\s*\];/);
if (!m) throw new Error("EPG block not found in public/pbtv/index.html");
const EPG = JSON.parse("[" + m[1] + "]");

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTH_NUM = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function airingsFor(show) {
  const out = [];
  for (const d of EPG) {
    const dt = new Date(2026, MONTH_NUM[d.month], +d.day);
    for (const r of d.rows) {
      if (r.title === show.match) {
        out.push({ day: `${DOW[dt.getDay()]} · ${d.month.toLowerCase()} ${+d.day}`, time: r.time, sub: r.sub, live: r.live });
      }
    }
  }
  return out;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function page(show) {
  const airings = airingsFor(show);
  const rows = airings.slice(0, 8).map((a) =>
    `<tr><td class="day">${a.day}</td><td class="time">${a.time}</td><td class="prog">${esc(a.sub)}</td></tr>`).join("\n      ");
  const moreNote = airings.length > 8 ? `<p class="more">+ ${airings.length - 8} more airings this week — see the <a href="/pbtv/#schedule">full guide</a>.</p>` : "";
  const noneNote = airings.length === 0 ? `<p class="more">no airings in this week's guide — see the <a href="/pbtv/#schedule">full schedule</a>.</p>` : "";
  return `<meta charset="utf-8">
<title>${show.title} — PickleballTV</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${show.desc.replace(/"/g, "&quot;")}">
<meta name="robots" content="noindex">
<meta property="og:title" content="${show.title} — only on PickleballTV">
<meta property="og:description" content="${show.desc.replace(/"/g, "&quot;")}">
<meta property="og:image" content="https://ppatour-website.vercel.app/pbtv/shows/art/${show.slug}.jpg">
<meta property="og:type" content="video.tv_show">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/pbtv/brand/pbtv-mark-black.svg" media="(prefers-color-scheme:light)">
<link rel="icon" href="/pbtv/brand/pbtv-mark-white.svg" media="(prefers-color-scheme:dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Nunito+Sans:wght@400;600;700;900&display=swap">
<style>
  /* PBTV brand tokens — same system as /pbtv/index.html (Bob Whyley kit, 8/5) */
  :root{--bg:#000;--panel:#0E0E0E;--line:rgba(255,255,255,.14);--line2:rgba(255,255,255,.08);
    --ink:#FFF;--muted:#828C96;--faint:#626262;--green:#508250;--live:#FF5B4C;
    --display:"Prohibition","Oswald","Avenir Next Condensed","Haettenschweiler",Impact,sans-serif;
    --sans:"Avenir Next","Avenir","Nunito Sans",ui-sans-serif,system-ui,sans-serif;
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased;overflow-x:hidden;letter-spacing:-.01em}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  header{position:sticky;top:0;z-index:20;background:rgba(0,0,0,.72);backdrop-filter:blur(16px);border-bottom:1px solid var(--line2)}
  .nav{display:flex;align-items:center;justify-content:space-between;height:72px}
  .logo-lock{height:24px;width:auto;display:block}
  .nlinks{display:flex;gap:24px;align-items:center}
  .nlinks a{font-size:14px;color:var(--muted);transition:color .2s}
  .nlinks a:hover{color:var(--ink)}
  .pill{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:13.5px;padding:9px 16px;border-radius:100px;background:var(--green)}
  .nlinks a.pill,.nlinks a.pill:hover{color:#FFF}
  .dot{width:7px;height:7px;border-radius:50%;background:#FFF}
  @media(max-width:720px){.nav{height:60px}.nlinks a:not(.pill){display:none}.logo-lock{height:20px}}
  .hero{display:grid;grid-template-columns:1fr;gap:40px;padding-block:56px 30px}
  @media(min-width:820px){.hero{grid-template-columns:.62fr 1fr;gap:56px;align-items:start}}
  /* 9:16 poster slot — a labelled placeholder frame. The 16:9 badge inside is
     PBTV's real art cropped to fill; swap the <img> when vertical art lands. */
  /* ⚠ width must be EXPLICIT: as a grid item, margin:0 auto defeats the default
     stretch, and with only absolute children the box collapses to 2px. */
  .poster{position:relative;aspect-ratio:9/16;border-radius:18px;overflow:hidden;border:1px dashed var(--line);background:var(--panel);width:min(100%,340px);margin:0 auto}
  .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85}
  .poster .scr{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.72) 78%)}
  .poster .tag{position:absolute;left:14px;right:14px;bottom:14px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);
    border:1px dashed var(--line);border-radius:10px;padding:8px 10px;text-align:center;background:rgba(0,0,0,.55)}
  .chip{display:inline-block;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);padding:6px 12px;border-radius:100px;margin:0 0 18px;white-space:nowrap}
  h1{font-family:var(--display);font-size:clamp(2.2rem,5.5vw,3.8rem);line-height:.95;letter-spacing:.005em;margin:0 0 18px;font-weight:600;text-transform:uppercase}
  .desc{color:var(--muted);font-size:clamp(1rem,1.5vw,1.15rem);line-height:1.6;max-width:52ch;margin:0 0 26px}
  .acts{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 8px}
  .btn{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:14.5px;padding:12px 20px;border-radius:100px;transition:transform .15s,box-shadow .2s,border-color .2s}
  .btn-l{background:var(--green);color:#FFF}
  .btn-l:hover{box-shadow:0 10px 30px -8px rgba(80,130,80,.55)}
  .btn-g{border:1px solid var(--line);color:var(--ink)}
  .btn-g:hover{border-color:rgba(255,255,255,.28)}
  .btn .dot{background:#FFF;animation:pulse 1.8s infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.4)}70%{box-shadow:0 0 0 7px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
  section{padding:44px 0 80px}
  .lab{font-size:15px;color:var(--muted);text-transform:lowercase;margin:0 0 20px;font-weight:500}
  .lab b{color:var(--ink);font-weight:600}
  .scroll{overflow-x:auto}
  table{width:100%;border-collapse:collapse;min-width:460px}
  td{padding:14px;border-top:1px solid var(--line2);vertical-align:middle}
  tr:hover td{background:rgba(255,255,255,.02)}
  .day{font-family:var(--mono);font-size:12px;color:var(--muted);white-space:nowrap}
  .time{font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
  .prog{font-size:14.5px;font-weight:600}
  .more{color:var(--muted);font-size:13px;margin:16px 0 0}
  .more a{color:var(--ink);border-bottom:1px solid var(--line)}
  footer{border-top:1px solid var(--line2);padding:36px 0 52px}
  .foot{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;color:var(--faint);font-size:13px}
  .logo-mark{height:38px;width:auto;display:block}
  .concept{font-family:var(--mono);font-size:11px;letter-spacing:.08em;border:1px dashed var(--line);padding:5px 11px;border-radius:100px;color:var(--muted)}
</style>

<header><div class="wrap nav">
  <a href="/pbtv/" aria-label="PickleballTV — home"><img class="logo-lock" src="/pbtv/brand/pbtv-wordmark-white.svg" alt="PickleballTV" width="127" height="22"></a>
  <nav class="nlinks">
    <a href="/pbtv/#shows">all shows</a>
    <a href="/pbtv/#schedule">schedule</a>
    <a class="pill" href="/pbtv/#live"><span class="dot"></span>watch live</a>
  </nav>
</div></header>

<main>
  <div class="wrap hero">
    <div class="poster">
      <img src="/pbtv/shows/art/${show.slug}.jpg" alt="${show.title} key art">
      <div class="scr"></div>
      <div class="tag">9:16 key art — placeholder<br>final poster from pbtv</div>
    </div>
    <div>
      <span class="chip">${show.chip} · only on pbtv</span>
      <h1>${esc(show.title)}</h1>
      <p class="desc">${esc(show.desc)}</p>
      <div class="acts">
        <a class="btn btn-l" href="/pbtv/#live"><span class="dot"></span>watch live now</a>
        <a class="btn btn-g" href="/pbtv/#shows">all shows</a>
      </div>
    </div>
  </div>

  <section><div class="wrap">
    <p class="lab"><b>this week on pbtv.</b> all times eastern.</p>
    <div class="scroll"><table><tbody>
      ${rows || ""}
    </tbody></table></div>
    ${moreNote}${noneNote}
  </div></section>
</main>

<footer><div class="wrap foot">
  <a href="/pbtv/"><img class="logo-mark" src="/pbtv/brand/pbtv-mark-white.svg" alt="PickleballTV" width="23" height="30"></a>
  <span class="concept">design concept · not the live site</span>
  <span>© 2026 PickleballTV</span>
</div></footer>
`;
}

for (const show of SHOWS) {
  const dir = join(PBTV, "shows", show.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(show));
  const n = airingsFor(show).length;
  console.log(`${show.slug}: ${n} airings`);
}
console.log("done");
