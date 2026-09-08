#!/usr/bin/env node
/**
 * Post-tournament website recap — assembles the measurable half of the report
 * so a human only has to write the half a dashboard cannot see.
 *
 * Bryce, 9/6, approving this: "I don't want a standing meeting on the calendar
 * for something a task can write." So this is the task. It runs after an event,
 * pulls what is genuinely knowable, and leaves prompts where judgement belongs.
 *
 *   node scripts/tournament-recap.mjs                 # most recent completed event
 *   node scripts/tournament-recap.mjs --slug veolia-pickleball-national-championships
 *   node scripts/tournament-recap.mjs --start 2026-08-31 --end 2026-09-06 --name "Cary"
 *   node scripts/tournament-recap.mjs --stdout         # print instead of writing
 *   node scripts/tournament-recap.mjs --ended-yesterday # no-op unless one ended
 *
 * ⚠ IT NEVER INVENTS A NUMBER. Every source here is optional, and a source that
 * is unreachable prints `PENDING` with the reason and where to get it by hand.
 * A recap feeds the Cary post-tournament write-up and, from there, decks — the
 * one failure mode worth engineering against is a plausible fabricated figure,
 * not a missing one. This is the same rule the rest of the repo runs on: no
 * data beats wrong data.
 *
 * SOURCES, and what each can and cannot answer:
 *   git        what shipped during the event, and when          (always available)
 *   Vercel     deploy count, failures, and per-build health      (VERCEL_TOKEN)
 *   Vercel     page views, top pages, peak hour                  (VERCEL_TOKEN)
 *   pickleball.com  the event's own dates/venue/tier             (PB_API_TOKEN)
 */
import { execFileSync } from "node:child_process";
import { captureMetrics, peakHour, readHistory, writeHistory, findComparison, HISTORY_PATH } from "./lib/tournament-metrics.mjs";
import { renderAudienceReport } from "./lib/audience-report.mjs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/* ------------------------------------------------------------------ config */

/**
 * Local convenience: read `.env.local` when the variable is not already set.
 * CI passes real secrets in the environment, which always win — this only makes
 * `npm run recap` work on a laptop without exporting anything by hand.
 */
for (const line of (() => {
  try {
    return readFileSync(".env.local", "utf8").split(/\r?\n/);
  } catch {
    return [];
  }
})()) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const PB_PATH = "/v2/data/ppa_tournaments";
/** The US main tour, as the feed spells it. */
const MAIN_TOUR_ORG = "Pro Pickleball Association";
const PB_BASE = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");

const VERCEL_PROJECT = "prj_QBXWqEOj1Kpux28zAlHzl5rnEFNK";
const VERCEL_TEAM = "team_TVjZejrkXkrI6at4XIp6Cm0M";

/* ------------------------------------------------------------------- utils */

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);
const iso = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * The Vercel token. Prefers the env var (which is what a scheduled run has);
 * falls back to the local CLI login so a human can run this without setup.
 */
function vercelToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const home = process.env.APPDATA || process.env.HOME || "";
  for (const p of [
    `${home}/xdg.data/com.vercel.cli/auth.json`,
    `${home}/com.vercel.cli/auth.json`,
    `${process.env.HOME}/.local/share/com.vercel.cli/auth.json`,
  ]) {
    try {
      if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")).token ?? null;
    } catch {
      /* unreadable is the same as absent */
    }
  }
  return null;
}

async function getJson(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, redirect: "manual" });
    // A 3xx here is the login wall, not data. Treat it as absent, loudly.
    if (res.status >= 300 && res.status < 400) return { error: `redirected to ${res.headers.get("location")}` };
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { data: await res.json() };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * The tour vocabulary for an event, from its title. Used only to warn when a
 * comparison is not like-for-like — never rendered as fact on its own.
 */
function inferTier(name) {
  if (/challenger/i.test(name)) return "Challenger";
  if (/national championships|world championships|masters/i.test(name)) return "Major";
  if (/cup/i.test(name)) return "Cup";
  if (/open/i.test(name)) return "Open";
  return null;
}

/* ------------------------------------------------------------------ event */

/**
 * The event to write up: an explicit `--slug`, else the most recently completed
 * PPA event in the feed. Falls back to `--start/--end/--name` so this still
 * works with no PB token at all.
 */
async function resolveEvent() {
  const manualStart = arg("start");
  const manualEnd = arg("end");
  if (manualStart && manualEnd) {
    return {
      name: arg("name", "Untitled event"),
      slug: arg("slug", "event"),
      start: manualStart,
      end: manualEnd,
      venue: arg("venue", ""),
      tier: inferTier(arg("name", "")),
      source: "flags",
    };
  }

  const token = process.env.PB_API_TOKEN;
  if (!token) return null;
  const { data, error } = await getJson(`${PB_BASE}${PB_PATH}?current_page=1&page_size=300`, {
    "PB-API-TOKEN": token,
  });
  if (error) return null;

  const rows = data?.results?.tournaments ?? [];
  const wantSlug = arg("slug");
  const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const done = rows
    .filter((r) => !r.is_canceled && !r.is_stub)
    // ⚠ AUTO-DETECT COVERS THE US MAIN TOUR ONLY, and the reason is the
    // comparison. The history is a series each event is measured against, so
    // mixing a Challenger or an Australian MLP qualifier into it makes every
    // percentage meaningless. `--slug` overrides this for a one-off.
    // ⚠ The org string is "Pro Pickleball Association", NOT "PPA Tour" — the
    // latter matches nothing and silently yields no events.
    .filter((r) => (wantSlug ? true : r.organization_name === MAIN_TOUR_ORG && !/challenger/i.test(r.title)))
    .filter((r) => (wantSlug ? kebab(r.title).includes(wantSlug) || wantSlug.includes(kebab(r.title)) : true))
    .filter((r) => (wantSlug ? true : Date.parse(r.end_date) < Date.now()))
    .sort((a, b) => Date.parse(b.end_date) - Date.parse(a.end_date));

  const t = done[0];
  if (!t) return null;
  // The feed prefixes its own titles ("PPA Tour: Veolia …"); the site strips it
  // everywhere else, so the recap should read the way the site does.
  const title = t.title.replace(/^PPA Tour:\s*/i, "").trim();
  return {
    name: title,
    slug: kebab(title),
    start: iso(t.start_date),
    end: iso(t.end_date),
    venue: [t.venue_name, t.venue_city, t.venue_state].filter(Boolean).join(", "),
    tier: inferTier(title),
    source: "feed",
  };
}

/* --------------------------------------------------------------- shipped */

/** Commits landed during the event, grouped by conventional-commit type. */
function shippedDuring(start, end) {
  let raw = "";
  try {
    raw = execFileSync(
      "git",
      ["log", `--since=${start}`, `--until=${end} 23:59:59`, "--date=format:%m-%d %H:%M", "--pretty=%ad\t%s"],
      { encoding: "utf8" },
    );
  } catch {
    return null;
  }
  const groups = new Map();
  let total = 0;
  for (const line of raw.split("\n").filter(Boolean)) {
    const [when, ...rest] = line.split("\t");
    const subject = rest.join("\t");
    // `chore(data)` is the Tixr price sync — machine noise, not delivery.
    const type = /^(\w+)/.exec(subject)?.[1] ?? "other";
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push({ when, subject });
    total += 1;
  }
  return { total, groups };
}

/* ---------------------------------------------------------------- Vercel */

/**
 * Delivery health during the event, plus the one build-time signal that has
 * actually bitten us: whether `prebuild` managed to refresh the WPR snapshot,
 * or gave up on a 429 and shipped the previous one.
 */
async function vercelHealth(start, end) {
  const token = vercelToken();
  if (!token) return { error: "no VERCEL_TOKEN (and no local vercel login)" };
  const auth = { Authorization: `Bearer ${token}` };
  const since = Date.parse(`${start}T00:00:00Z`);
  const until = Date.parse(`${end}T23:59:59Z`);

  const { data, error } = await getJson(
    `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT}&teamId=${VERCEL_TEAM}&limit=100&since=${since}&until=${until}`,
    auth,
  );
  if (error) return { error };

  const prod = (data.deployments ?? []).filter((d) => d.target === "production");
  const failed = prod.filter((d) => d.state !== "READY");
  const perDay = {};
  for (const d of prod) {
    const k = new Date(d.created).toISOString().slice(0, 10);
    perDay[k] = (perDay[k] ?? 0) + 1;
  }

  // The snapshot line, sampled on the most recent builds in the window. Reading
  // every build's log is a request each, so this is capped — it is a health
  // indicator, not an audit.
  const snapshots = [];
  for (const d of prod.slice(0, 8)) {
    const ev = await getJson(
      `https://api.vercel.com/v3/deployments/${d.uid}/events?teamId=${VERCEL_TEAM}&builds=1&limit=3000`,
      auth,
    );
    if (ev.error) continue;
    const lines = (Array.isArray(ev.data) ? ev.data : (ev.data.events ?? []))
      .map((e) => e?.payload?.text ?? e?.text ?? "")
      .filter((l) => typeof l === "string" && l.includes("wpr-snapshot"));
    if (lines.length) {
      snapshots.push({
        at: new Date(d.created).toISOString(),
        ok: /wrote/.test(lines[0]),
        line: lines[0].trim(),
      });
    }
  }

  return { total: prod.length, failed, perDay, snapshots };
}

/* ---------------------------------------------------------------- render */

function render({ event, shipped, vercel, metrics, peak, comparison }) {
  const L = [];
  const push = (...s) => L.push(...s);

  push(`# Website recap — ${event.name}`, "");
  push(`**Event window:** ${event.start} → ${event.end}${event.venue ? ` · ${event.venue}` : ""}`);
  push(`**Recap generated:** ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`);
  push(`**Event source:** ${event.source}`, "");

  /* --- 1. traffic ---------------------------------------------------- */
  push("## 1. Audience", "");
  if (metrics.error) {
    push(`**PENDING** — ${metrics.error}.`, "");
  } else {
    push(`- **${metrics.views.toLocaleString("en-US")} page views** across the tournament`);
    push(`- Peak day **${metrics.peakDay}** at **${metrics.peakViews.toLocaleString("en-US")}**` +
      (metrics.baselineViews ? ` — ${(metrics.peakViews / metrics.baselineViews).toFixed(1)}x the day before it opened` : ""));
    if (peak) push(`- Peak hour **${peak.hourUtc} UTC**, ${peak.views.toLocaleString("en-US")} page views`);
    push(`- **${metrics.requests.toLocaleString("en-US")} edge requests** total`, "");
    if (metrics.unavailableDays.length) {
      push(`> ⚠ No data for ${metrics.unavailableDays.join(", ")} — outside the ~9-day`,
           "> retention window at source. Run the recap sooner after the event.", "");
    }
    push("| Day | Page views | Document loads | Icon 404s |", "| --- | --- | --- | --- |");
    for (const day of Object.keys(metrics.perDay).sort()) {
      const m = metrics.perDay[day];
      push(`| ${day} | ${(m.views ?? 0).toLocaleString("en-US")} | ${(m.docs ?? 0).toLocaleString("en-US")} | ${(m.icon404 ?? 0).toLocaleString("en-US")} |`);
    }
    push("");
    push("**Top pages**", "");
    push("| Page | Views |", "| --- | --- |");
    for (const p of metrics.topPages.slice(0, 10)) {
      push(`| \`${p.path}\` | ${p.v.toLocaleString("en-US")} |`);
    }
    push("");
  }

  /* --- 1b. comparison ------------------------------------------------ */
  push("## 1b. Against the last tournament", "");
  if (metrics.error) {
    push("**PENDING** — no metrics this run.", "");
  } else if (!comparison) {
    push(
      "No prior tournament is on record yet. Audience data is only retained for about",
      "nine days at source, so earlier events cannot be measured retroactively — the",
      `comparison starts from the next event. History lives in \`${HISTORY_PATH}\`.`,
      "",
    );
  } else {
    const pct = ((metrics.views - comparison.views) / comparison.views) * 100;
    push(`| | ${comparison.name} | ${event.name} | Change |`, "| --- | --- | --- | --- |");
    push(`| Dates | ${comparison.start} – ${comparison.end} | ${event.start} – ${event.end} | |`);
    push(`| Page views | ${comparison.views.toLocaleString("en-US")} | ${metrics.views.toLocaleString("en-US")} | ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% |`);
    push(`| Peak day | ${comparison.peakViews.toLocaleString("en-US")} | ${metrics.peakViews.toLocaleString("en-US")} | |`, "");
    if (comparison.tier && event.tier && comparison.tier !== event.tier) {
      const art = (w) => (/^[AEIOU]/i.test(w) ? "an" : "a");
      push(`> ⚠ Not like-for-like: ${comparison.name} is ${art(comparison.tier)} ${comparison.tier} and this is ${art(event.tier)} ${event.tier}.`,
           "> Read the direction, not the percentage.", "");
    }
  }

  /* --- 2. delivery ---------------------------------------------------- */
  push("## 2. Delivery during the event", "");
  if (vercel.error) {
    push(`**PENDING** — ${vercel.error}.`, "");
  } else {
    push(`- **${vercel.total} production deploys**, **${vercel.failed.length} failed**`);
    const days = Object.entries(vercel.perDay).sort(([a], [b]) => a.localeCompare(b));
    push(`- Per day: ${days.map(([d, n]) => `${d.slice(5)} ${n}`).join(" · ")}`);
    for (const f of vercel.failed) {
      push(`  - ⚠ ${f.state} — ${new Date(f.created).toISOString()}`);
    }
    if (vercel.snapshots.length) {
      const bad = vercel.snapshots.filter((s) => !s.ok);
      push(
        `- **WPR snapshot refresh:** ${vercel.snapshots.length - bad.length} of ` +
          `${vercel.snapshots.length} sampled builds wrote a fresh snapshot`,
      );
      for (const s of bad) push(`  - ⚠ ${s.at} — ${s.line}`);
      if (bad.length) {
        push(
          "",
          "  > A build that keeps the previous snapshot ships the boards committed to",
          "  > git. That copy has a 7-day expiry (`SNAPSHOT_MAX_AGE_MS`), and past it",
          "  > every athlete page reverts to live board paging — the thing the snapshot",
          "  > exists to prevent.",
        );
      }
    }
    push("");
  }

  /* --- 3. what shipped ------------------------------------------------ */
  push("## 3. What shipped during the event", "");
  if (!shipped) {
    push("**PENDING** — git log unavailable.", "");
  } else {
    push(`${shipped.total} commits landed while the event was live.`, "");
    const order = ["fix", "feat", "perf", "content", "docs", "chore"];
    const keys = [...shipped.groups.keys()].sort(
      (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
    );
    for (const type of keys) {
      const items = shipped.groups.get(type);
      push(`<details><summary><strong>${type}</strong> — ${items.length}</summary>`, "");
      for (const i of items) push(`- \`${i.when}\` ${i.subject}`);
      push("", "</details>", "");
    }
  }

  /* --- 4. the half a dashboard cannot see ------------------------------ */
  push("## 4. What broke", "");
  push(
    "> Bryce's direction on this report: *\"Spend the effort on the half the",
    "> analytics CAN'T see: what broke, and what we'd change on the page next",
    "> time.\"* Everything above is generated. Everything below is written.",
    "",
  );
  push("_One entry per incident: what a visitor saw, the cause, the fix, and whether it is still open._", "");
  push("| # | What a visitor saw | Cause | Fix | Status |", "| --- | --- | --- | --- | --- |");
  push("| 1 | _…_ | _…_ | _…_ | _open / closed_ |", "");

  push("## 5. Still open going into the next event", "");
  push("_Anything from section 4 that did not close, plus risks the event exposed._", "");
  push("- _…_", "");

  push("## 6. What we would change on the page next time", "");
  push("_Content and layout, not infrastructure — what the event taught us about the pages themselves._", "");
  push("- _…_", "");

  return L.join("\n") + "\n";
}

/* ------------------------------------------------------------------ main */

async function main() {
  const event = await resolveEvent();
  if (!event) {
    console.error(
      "[recap] Could not resolve an event. " +
        "Set PB_API_TOKEN, or pass --start / --end / --name explicitly.",
    );
    process.exitCode = 1;
    return;
  }

  // The scheduled run fires daily and most days there is nothing to write up.
  // Exiting 0 keeps a quiet day green rather than alerting on normal.
  if (flag("ended-yesterday")) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (event.end !== yesterday) {
      console.log(`[recap] nothing to do — most recent main-tour event ended ${event.end}, not ${yesterday}.`);
      return;
    }
    console.log(`[recap] ${event.name} ended yesterday — generating.`);
  }

  const shipped = shippedDuring(event.start, event.end);
  const vercel = await vercelHealth(event.start, event.end);
  const metrics = await captureMetrics({ start: event.start, end: event.end });
  const peak = metrics.error ? null : await peakHour(metrics.peakDay);

  // Delivery figures belong on the audience page too, so fold them in.
  if (!metrics.error && !vercel.error) {
    metrics.deploys = vercel.total;
    metrics.failedDeploys = vercel.failed.length;
  }

  // ⚠ Compare BEFORE writing, or this event becomes its own comparison.
  const comparison = metrics.error ? null : findComparison(readHistory(), event);

  if (!metrics.error) {
    writeHistory({
      slug: event.slug,
      name: event.name,
      tier: event.tier,
      start: event.start,
      end: event.end,
      venue: event.venue,
      capturedAt: new Date().toISOString(),
      views: metrics.views,
      peakDay: metrics.peakDay,
      peakViews: metrics.peakViews,
      requests: metrics.requests,
      topPages: metrics.topPages.slice(0, 10),
    });
  }

  const markdown = render({ event, shipped, vercel, metrics, peak, comparison });

  if (flag("stdout")) {
    process.stdout.write(markdown);
    return;
  }

  const dir = resolve(arg("out", `docs/recaps/${event.start.slice(0, 7)}-${event.slug}`));
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/internal.md`, markdown);
  console.log(`[recap] wrote ${dir}/internal.md`);

  if (!metrics.error) {
    writeFileSync(`${dir}/audience.html`, renderAudienceReport({ event, metrics, peak, comparison }));
    console.log(`[recap] wrote ${dir}/audience.html`);
    console.log(`[recap] recorded ${event.slug} in ${HISTORY_PATH}`);
  } else {
    console.log("[recap] audience report SKIPPED — no metrics; it would have no numbers on it.");
  }

  console.log(
    `[recap] audience ${metrics.error ? "PENDING" : "ok"} · delivery ${vercel.error ? "PENDING" : "ok"} · ` +
      `shipped ${shipped ? "ok" : "PENDING"} · comparison ${comparison ? comparison.name : "none yet"}`,
  );
  console.log("[recap] internal.md sections 4-6 are prompts — they are the half worth your time.");
}

main();
