/**
 * The shareholder-facing audience report — one self-contained HTML page.
 *
 * ⚠ THIS IS THE VERSION THAT LEAVES THE BUILDING. It carries no incidents, no
 * open engineering items and no infrastructure vocabulary; the internal recap
 * holds all of that. Two rules keep it honest:
 *   - Non-pages are excluded from "top pages". A dead RSS endpoint and redirect
 *     stubs rank in the raw data and are not somebody reading something.
 *   - Page views are stated as a floor. Ad-blocker users are not counted, and
 *     request volume (which includes bots, ~26x larger) is never mixed in.
 */

const n = (x) => Number(x).toLocaleString("en-US");
const article = (w) => (/^[AEIOU]/i.test(String(w)) ? "an" : "a");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const d = (iso) => new Date(`${iso}T12:00:00Z`);
const dayLabel = (iso) => `${DOW[d(iso).getUTCDay()]} ${d(iso).getUTCDate()}`;
const longDate = (iso) => `${MON[d(iso).getUTCMonth()]} ${d(iso).getUTCDate()}`;

/** Human page names for the routes that recur across every event. */
const PAGE_NAMES = [
  [/^\/$/, "Homepage", "ppatour.com"],
  [/^\/events\/\d{4}\//, "Tournament event page", "Schedule, tickets, order of play, how to watch"],
  [/^\/events$/, "Tour schedule", "The full season calendar"],
  [/^\/rankings$/, "World Pickleball Rankings", null],
  [/^\/leaderboards$/, "Full leaderboards", null],
  [/^\/vacations/, "Pickleball Vacations", null],
  [/^\/news/, "Newsroom", "Tour coverage and recaps"],
  [/^\/watch/, "Where to Watch", "Broadcast windows and TV schedule"],
  [/^\/athletes$/, "Athlete directory", null],
  [/^\/athletes\//, "Athlete profile", null],
  [/^\/brackets/, "Live brackets", null],
  [/^\/paddle-lab/, "Paddle Lab", null],
];

function pageName(path) {
  for (const [re, name, sub] of PAGE_NAMES) if (re.test(path)) return { name, sub: sub ?? path };
  return { name: path, sub: null };
}

function comparisonBlock(cmp, metrics) {
  if (!cmp) {
    return `
    <section>
      <h2>Comparison begins with the next event</h2>
      <p>
        This is the first tournament captured under the new reporting. Audience data is
        only retained for a short window at source, so earlier events cannot be measured
        retroactively — every tournament from here forward is recorded on the day it ends
        and compared with the one before it.
      </p>
    </section>`;
  }
  const pct = ((metrics.views - cmp.views) / cmp.views) * 100;
  const up = pct >= 0;
  const tierNote =
    cmp.tier && cmp.tier !== metrics.tier
      ? `<p class="caveat">⚠ Not like-for-like: ${esc(cmp.name)} is ${article(cmp.tier)} ${esc(cmp.tier)} event and this one is ${article(metrics.tier)} ${esc(metrics.tier ?? "different tier")}. Read the direction, not the percentage.</p>`
      : "";
  return `
    <section>
      <h2>Against the last tournament</h2>
      <p class="lede">
        Measured the same way, over each event's own days of play.
      </p>
      <div class="cmp">
        <div class="cmp-side">
          <span class="cmp-l">${esc(cmp.name)}</span>
          <span class="cmp-d">${esc(longDate(cmp.start))} – ${esc(longDate(cmp.end))}</span>
          <span class="cmp-n">${n(cmp.views)}</span>
        </div>
        <div class="cmp-arrow ${up ? "up" : "down"}">
          <span class="cmp-pct">${up ? "+" : ""}${pct.toFixed(1)}%</span>
          <span class="cmp-cap">page views</span>
        </div>
        <div class="cmp-side now">
          <span class="cmp-l">This tournament</span>
          <span class="cmp-d">${esc(longDate(metrics.start))} – ${esc(longDate(metrics.end))}</span>
          <span class="cmp-n">${n(metrics.views)}</span>
        </div>
      </div>
      ${tierNote}
    </section>`;
}

export function renderAudienceReport({ event, metrics, peak, comparison }) {
  const days = Object.keys(metrics.perDay).sort();
  const max = Math.max(...days.map((k) => metrics.perDay[k].views || 0), 1);
  const eventDays = new Set(days.filter((k) => k >= event.start && k <= event.end));

  const bars = days
    .map((k) => {
      const v = metrics.perDay[k].views || 0;
      const cls = k === metrics.peakDay ? "peak" : !eventDays.has(k) ? (k < event.start ? "base" : "after") : "";
      return `<div class="bcol ${cls}"><span class="bval">${n(v)}</span><div class="bar-fill" style="height:${Math.max((v / max) * 100, 2).toFixed(0)}%"></div></div>`;
    })
    .join("\n        ");

  const labels = days
    .map((k) => {
      const extra = k < event.start ? "<br>before" : k > event.end ? "<br>after" : "";
      return `<span class="blab ${eventDays.has(k) ? "on" : ""}">${dayLabel(k)}${extra}</span>`;
    })
    .join("\n        ");

  const rows = metrics.topPages
    .slice(0, 8)
    .map(({ path, v }) => {
      const { name, sub } = pageName(path);
      return `<tr><td class="pg">${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ""}</td><td class="n">${n(v)}</td><td class="share">${((v / metrics.views) * 100).toFixed(1)}%</td></tr>`;
    })
    .join("\n          ");

  const liftVsBaseline = metrics.baselineViews
    ? (metrics.peakViews / metrics.baselineViews).toFixed(1)
    : null;

  return `<title>${esc(event.shortName ?? event.name)} Audience Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">

<style>
  :root {
    --ground: #f3f5f7; --surface: #fff; --navy: #0c2b44; --ink: #0c2b44;
    --ink-soft: #46617a; --ink-faint: #7d93a6; --rule: #d7dee4; --rule-soft: #e6ebef;
    --blue: #1b6fbd; --blue-soft: #dfebf7; --yellow: #e7e700;
    --good: #126b4a; --bad: #c1272d;
    --on-navy: #eaf1f7; --on-navy-soft: #9db4c7;
    --display: "Archivo", "Helvetica Neue", Arial, sans-serif;
    --body: "Source Serif 4", Georgia, "Times New Roman", serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #061a2b; --surface: #0c2b44; --navy: #041521; --ink: #e8eff5;
      --ink-soft: #a6bacb; --ink-faint: #71889a; --rule: #1d4361; --rule-soft: #143349;
      --blue: #63b3f5; --blue-soft: #0f3350; --good: #6cc4a0; --bad: #f08c8c;
      --on-navy: #e8eff5; --on-navy-soft: #91a9bc;
    }
  }
  :root[data-theme="dark"] {
    --ground: #061a2b; --surface: #0c2b44; --navy: #041521; --ink: #e8eff5;
    --ink-soft: #a6bacb; --ink-faint: #71889a; --rule: #1d4361; --rule-soft: #143349;
    --blue: #63b3f5; --blue-soft: #0f3350; --good: #6cc4a0; --bad: #f08c8c;
    --on-navy: #e8eff5; --on-navy-soft: #91a9bc;
  }
  * { box-sizing: border-box; }
  body { background: var(--ground); color: var(--ink); font-family: var(--body); font-size: 17px; line-height: 1.65; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 58rem; margin: 0 auto; padding: 0 1.5rem; }

  .hero { background: var(--navy); color: var(--on-navy); padding: 3.25rem 0 3rem; margin-bottom: 3rem; }
  .kicker { font-family: var(--display); font-size: .72rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--on-navy-soft); margin-bottom: 1.5rem; }
  .hero h1 { font-family: var(--display); font-weight: 800; font-size: clamp(2.1rem, 5.5vw, 3.1rem); line-height: 1.05; letter-spacing: -.025em; margin: 0 0 .5rem; text-wrap: balance; }
  .hero .sub { font-size: 1.05rem; color: var(--on-navy-soft); margin: 0 0 2.25rem; max-width: 46ch; }
  .headline-figure { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
  .headline-figure .big { font-family: var(--display); font-weight: 800; font-size: clamp(3.2rem, 11vw, 5.5rem); line-height: .9; letter-spacing: -.035em; font-variant-numeric: tabular-nums; }
  .headline-figure .unit { font-family: var(--display); font-size: 1rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--on-navy-soft); }
  .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; margin-top: 2.25rem; padding-top: 1.75rem; border-top: 1px solid rgba(255,255,255,.16); }
  @media (max-width: 38rem) { .hero-stats { grid-template-columns: 1fr; gap: 1.25rem; } }
  .hs-n { font-family: var(--display); font-weight: 700; font-size: 1.75rem; line-height: 1.1; font-variant-numeric: tabular-nums; display: block; }
  .hs-l { font-size: .92rem; color: var(--on-navy-soft); display: block; margin-top: .2rem; }

  section { margin-bottom: 3.25rem; }
  h2 { font-family: var(--display); font-weight: 700; font-size: 1.5rem; letter-spacing: -.015em; margin: 0 0 .55rem; text-wrap: balance; }
  .lede { color: var(--ink-soft); margin: 0 0 1.6rem; max-width: 60ch; }
  p { margin: 0 0 1rem; max-width: 62ch; }
  p:last-child { margin-bottom: 0; }
  .caveat { font-size: .9rem; color: var(--ink-soft); margin-top: 1rem; }

  .chart { background: var(--surface); border: 1px solid var(--rule); border-radius: 4px; padding: 1.6rem 1.4rem 1.2rem; }
  .bars { display: flex; align-items: flex-end; gap: .55rem; height: 232px; }
  .bcol { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: .5rem; height: 100%; }
  .bval { font-family: var(--display); font-size: .72rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink-soft); }
  .bar-fill { width: 100%; background: var(--blue); border-radius: 2px 2px 0 0; }
  .bcol.base .bar-fill { background: var(--rule); }
  .bcol.base .bval, .bcol.after .bval { color: var(--ink-faint); }
  .bcol.after .bar-fill { background: var(--blue-soft); border: 1px solid var(--blue); border-bottom: 0; }
  .bcol.peak .bar-fill { background: var(--navy); border-top: 5px solid var(--yellow); }
  .bcol.peak .bval { color: var(--ink); }
  .blabels { display: flex; gap: .55rem; margin-top: .7rem; padding-top: .7rem; border-top: 1px solid var(--rule); }
  .blab { flex: 1; text-align: center; font-family: var(--display); font-size: .66rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-faint); }
  .blab.on { color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1rem; font-family: var(--display); font-size: .74rem; color: var(--ink-faint); }
  .legend span { display: inline-flex; align-items: center; gap: .4rem; }
  .sw { width: 11px; height: 11px; border-radius: 2px; display: inline-block; }

  .tw { overflow-x: auto; border: 1px solid var(--rule); border-radius: 4px; background: var(--surface); }
  table { width: 100%; border-collapse: collapse; min-width: 30rem; }
  th, td { text-align: left; padding: .8rem 1rem; border-bottom: 1px solid var(--rule-soft); }
  thead th { font-family: var(--display); font-size: .68rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--rule); }
  tbody tr:last-child td { border-bottom: 0; }
  td.n { font-family: var(--display); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.share { font-family: var(--display); font-size: .85rem; color: var(--ink-faint); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .pg { font-family: var(--display); font-weight: 600; font-size: .95rem; }
  .pg small { display: block; font-family: var(--body); font-weight: 400; font-size: .84rem; color: var(--ink-faint); }

  .cmp { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1.25rem; background: var(--surface); border: 1px solid var(--rule); border-radius: 4px; padding: 1.6rem 1.5rem; }
  @media (max-width: 40rem) { .cmp { grid-template-columns: 1fr; text-align: left; } }
  .cmp-side { display: flex; flex-direction: column; gap: .15rem; }
  .cmp-l { font-family: var(--display); font-size: .7rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); }
  .cmp-d { font-size: .86rem; color: var(--ink-faint); }
  .cmp-n { font-family: var(--display); font-weight: 800; font-size: 2rem; line-height: 1.1; font-variant-numeric: tabular-nums; margin-top: .2rem; }
  .cmp-side.now .cmp-n { color: var(--blue); }
  .cmp-arrow { text-align: center; padding: 0 .5rem; }
  .cmp-pct { font-family: var(--display); font-weight: 800; font-size: 1.5rem; display: block; font-variant-numeric: tabular-nums; }
  .cmp-arrow.up .cmp-pct { color: var(--good); }
  .cmp-arrow.down .cmp-pct { color: var(--bad); }
  .cmp-cap { font-family: var(--display); font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); }

  footer { border-top: 1px solid var(--rule); padding: 1.5rem 0 4rem; color: var(--ink-faint); font-size: .88rem; }
  footer p { max-width: 68ch; margin-bottom: .6rem; }
  footer b { color: var(--ink-soft); }
</style>

<div class="hero">
  <div class="wrap">
    <div class="kicker">Carvana PPA Tour · Website audience report</div>
    <h1>${esc(event.name)}</h1>
    <p class="sub">${esc(event.venue || "")}${event.venue ? " · " : ""}${esc(longDate(event.start))} – ${esc(longDate(event.end))}, ${d(event.end).getUTCFullYear()}</p>

    <div class="headline-figure">
      <span class="big">${n(metrics.views)}</span>
      <span class="unit">page views across the tournament</span>
    </div>

    <div class="hero-stats">
      <div><span class="hs-n">${n(metrics.peakViews)}</span><span class="hs-l">Page views on ${esc(longDate(metrics.peakDay))}, the single biggest day</span></div>
      ${liftVsBaseline ? `<div><span class="hs-n">${liftVsBaseline}&times;</span><span class="hs-l">The peak day against the day before the tournament opened</span></div>` : ""}
      ${peak ? `<div><span class="hs-n">${n(peak.views)}</span><span class="hs-l">Page views in the peak hour — ${esc(peak.hourUtc)} UTC on the biggest day</span></div>` : ""}
    </div>
  </div>
</div>

<div class="wrap">

  <section>
    <h2>The week, day over day</h2>
    <p class="lede">
      Audience through the tournament, with the day before it opened shown as a baseline
      and the day after it closed shown for fall-off.
    </p>
    <div class="chart">
      <div class="bars">
        ${bars}
      </div>
      <div class="blabels">
        ${labels}
      </div>
      <div class="legend">
        <span><i class="sw" style="background:var(--rule)"></i> Before the tournament</span>
        <span><i class="sw" style="background:var(--blue)"></i> Tournament days</span>
        <span><i class="sw" style="background:var(--navy)"></i> Biggest day</span>
      </div>
    </div>
  </section>
${comparisonBlock(comparison, { ...metrics, start: event.start, end: event.end, tier: event.tier })}
  <section>
    <h2>Where the audience went</h2>
    <p class="lede">
      The pages fans actually opened during the tournament, ranked by views.
    </p>
    <div class="tw">
      <table>
        <thead><tr><th>Page</th><th>Views</th><th>Share</th></tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>The site held up</h2>
    <p>
      The tournament put <b>${n(metrics.requests)} requests</b> through ppatour.com across
      the week, and the site served them.${metrics.deploys ? ` The team shipped <b>${n(metrics.deploys)} production releases</b> during the event with <b>${metrics.failedDeploys ? `${n(metrics.failedDeploys)} failures` : "no failed builds and no downtime"}</b>.` : ""}
    </p>
  </section>

  <footer>
    <p>
      <b>Method.</b> Page views are measured by the tour's own analytics on ppatour.com,
      counted the same way the live dashboard counts them. Figures cover
      ${esc(longDate(Object.keys(metrics.perDay).sort()[0]))} – ${esc(longDate(Object.keys(metrics.perDay).sort().slice(-1)[0]))},
      with the first day shown as a pre-tournament baseline.
    </p>
    <p>
      Page views are a conservative floor: visitors using ad or tracking blockers are not
      counted. Request volume is measured separately at the network edge and includes
      automated traffic, so it is reported only where labelled as requests.
    </p>
    <p>Generated ${new Date().toISOString().slice(0, 10)} from the tour's analytics.</p>
  </footer>

</div>
`;
}
