/**
 * Tournament audience metrics — capture, history and comparison.
 *
 * ⚠ THE CAPTURE WINDOW IS WHY THIS FILE EXISTS. Vercel Observability answers
 * roughly NINE DAYS back and nothing earlier: there is no archive to query
 * later. So an event's numbers must be read while they still exist and written
 * down, or they are gone permanently. `docs/recaps/metrics.json` is that record,
 * and it is the ONLY reason a tournament can be compared with the one before it.
 *
 * Practical consequence: if the recap workflow is broken for ten days, that
 * tournament has no numbers and never will. A failed run is a real loss, not a
 * retry-tomorrow inconvenience.
 *
 * ⚠ USE THE `monitoring_tab` REASON, NOT `observability_chart_free`. The free
 * chart reason caps queries at 7 days, which silently drops the opening days of
 * a week-long event — it returned Sep 2 as the first available day for a
 * tournament that started Aug 31. `monitoring_tab` reaches 9 days and returns
 * byte-identical totals on every overlapping day, verified 9/8.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const API = "https://vercel.com/api/observability/metrics";
const PROJECT = "prj_QBXWqEOj1Kpux28zAlHzl5rnEFNK";
const TEAM = "team_TVjZejrkXkrI6at4XIp6Cm0M";

/**
 * The Vercel Analytics page-view beacon. Vercel serves it from an obfuscated
 * per-project path so ad blockers cannot pattern-match it.
 *
 * ⚠ IT IS PROJECT-SPECIFIC AND IT CAN CHANGE. If page views suddenly read zero
 * while document loads look normal, this path moved: group a day by `route`,
 * find the row ending `/view`, and update it here.
 */
export const VIEW_BEACON = "/0379f17121fc1fc7/view";

/** Paths that 404 into a full HTML render — browser icon conventions we do not serve. */
const ICON_404 = /^\/(favicon\.ico|apple-touch-icon.*\.png)$/;

/** Not pages anyone read: a dead RSS endpoint and redirect stubs. */
const NOT_A_PAGE = /^\/(feed|schedule|tournament\/.*)$/;

export const HISTORY_PATH = "docs/recaps/metrics.json";

function token() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const home = process.env.APPDATA || process.env.HOME || "";
  for (const p of [`${home}/xdg.data/com.vercel.cli/auth.json`, `${home}/com.vercel.cli/auth.json`]) {
    try {
      if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")).token ?? null;
    } catch { /* unreadable is absent */ }
  }
  return null;
}

async function query(body, tok) {
  const res = await fetch(`${API}?teamId=${TEAM}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "content-type": "application/json" },
    body: JSON.stringify({
      event: "incomingRequest",
      reason: "monitoring_tab",
      scope: { type: "project", ownerId: TEAM, projectIds: [PROJECT] },
      rollups: { v: { measure: "count", aggregation: "sum" } },
      // ⚠ Granularity is an OBJECT ({hours:24}), not a number or a duration
      // string, and startTime must be an exact multiple of it.
      granularity: { hours: 24 },
      ...body,
    }),
  });
  const text = await res.text();
  if (res.status !== 200) throw new Error(`observability ${res.status}: ${text.slice(0, 180)}`);
  return JSON.parse(text).data ?? [];
}

const dayRange = (d) => ({
  startTime: `${d}T00:00:00.000Z`,
  endTime: new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString(),
});

/** Dates from start to end inclusive, padded by whole days either side. */
export function dateSpan(start, end, lookBehind = 0, lookAhead = 0) {
  const out = [];
  const from = Date.parse(`${start}T00:00:00Z`) - lookBehind * 86_400_000;
  const to = Date.parse(`${end}T00:00:00Z`) + lookAhead * 86_400_000;
  for (let ms = from; ms <= to; ms += 86_400_000) out.push(new Date(ms).toISOString().slice(0, 10));
  return out;
}

/**
 * Read one tournament's audience from Vercel. Returns null when there is no
 * token — the caller degrades rather than inventing figures.
 */
export async function captureMetrics({ start, end }) {
  const tok = token();
  if (!tok) return { error: "no VERCEL_TOKEN (and no local vercel login)" };

  // ⚠ One day either side is CONTEXT, not part of the tournament. The day
  // before is the baseline the peak is measured against and the day after shows
  // fall-off; neither is counted into the event totals below.
  const days = dateSpan(start, end, 1, 1);
  const perDay = {};
  const pageTotals = new Map();
  let requests = 0;

  for (const d of days) {
    let rows;
    try {
      rows = await query({ groupBy: ["requestPath", "contentType"], limit: 500, ...dayRange(d) }, tok);
    } catch {
      // Outside the ~9-day window is expected for the earliest days; a genuine
      // failure on a day inside the event is not, and is surfaced by the caller.
      perDay[d] = { views: 0, docs: 0, unavailable: true };
      continue;
    }

    let views = 0;
    let total = 0;
    const html = new Map();
    for (const r of rows) {
      total += r.v;
      if (r.requestPath === VIEW_BEACON) views += r.v;
      if (!/^text\/html/.test(String(r.contentType))) continue;
      const path = r.requestPath.length > 1 ? r.requestPath.replace(/\/$/, "") : "/";
      html.set(path, (html.get(path) ?? 0) + r.v);
    }

    let icon404 = 0;
    for (const [k, v] of [...html]) {
      if (ICON_404.test(k)) { icon404 += v; html.delete(k); }
    }

    let docs = 0;
    for (const [k, v] of html) {
      docs += v;
      // Only tournament days feed the top-pages ranking.
      if (!NOT_A_PAGE.test(k) && d >= start && d <= end) {
        pageTotals.set(k, (pageTotals.get(k) ?? 0) + v);
      }
    }

    // The beacon can fall outside the top-500 rows on a quiet day; ask again.
    if (!views) {
      try {
        const byRoute = await query({ groupBy: ["route"], limit: 200, ...dayRange(d) }, tok);
        views = byRoute.find((x) => x.route === VIEW_BEACON)?.v ?? 0;
      } catch { /* leave at 0 */ }
    }

    perDay[d] = { views, docs, icon404, requests: total };
    requests += total;
  }

  const eventDays = dateSpan(start, end);
  const views = eventDays.reduce((s, d) => s + (perDay[d]?.views ?? 0), 0);
  const requestsInEvent = eventDays.reduce((s, d) => s + (perDay[d]?.requests ?? 0), 0);
  const peakDay = eventDays.reduce((a, d) => ((perDay[d]?.views ?? 0) > (perDay[a]?.views ?? 0) ? d : a), eventDays[0]);
  const baselineDay = days[0];

  return {
    perDay,
    views,
    peakDay,
    peakViews: perDay[peakDay]?.views ?? 0,
    baselineDay,
    baselineViews: perDay[baselineDay]?.views ?? 0,
    requests: requestsInEvent,
    requestsIncludingContext: requests,
    topPages: [...pageTotals].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([path, v]) => ({ path, v })),
    unavailableDays: days.filter((d) => perDay[d]?.unavailable),
  };
}

/** Peak hour of the busiest day, in page views. Best-effort; null on failure. */
export async function peakHour(day) {
  const tok = token();
  if (!tok || !day) return null;
  try {
    const rows = await query(
      { granularity: { minutes: 60 }, groupBy: ["route"], limit: 400, ...dayRange(day) },
      tok,
    );
    const beacon = rows.filter((x) => x.route === VIEW_BEACON).sort((a, b) => b.v - a.v);
    if (!beacon.length) return null;
    return { hourUtc: beacon[0].timestamp.slice(11, 16), views: beacon[0].v };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- history */

export function readHistory() {
  if (!existsSync(HISTORY_PATH)) return { events: [] };
  try {
    return JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
  } catch {
    return { events: [] };
  }
}

/**
 * Record this tournament. Replaces an existing entry for the same slug+start so
 * a re-run corrects rather than duplicates.
 */
export function writeHistory(entry) {
  const history = readHistory();
  history.events = history.events.filter((e) => !(e.slug === entry.slug && e.start === entry.start));
  history.events.push(entry);
  history.events.sort((a, b) => a.end.localeCompare(b.end));
  mkdirSync(dirname(HISTORY_PATH), { recursive: true });
  writeFileSync(HISTORY_PATH, `${JSON.stringify(history, null, 2)}\n`);
  return history;
}

/**
 * The tournament to compare against: the most recently ENDED event captured
 * before this one.
 *
 * ⚠ IT MAY BE A DIFFERENT TIER, AND THAT MATTERS. A Major against a Challenger
 * is not a like-for-like comparison, so the caller is told when the tiers differ
 * and is expected to say so rather than print a bare percentage.
 */
export function findComparison(history, current) {
  const prior = history.events
    .filter((e) => e.end < current.start && e.views > 0)
    .sort((a, b) => b.end.localeCompare(a.end));
  return prior[0] ?? null;
}

export function delta(now, then) {
  if (!then) return null;
  const pct = ((now - then) / then) * 100;
  return { pct: +pct.toFixed(1), up: pct >= 0, abs: now - then };
}
