/**
 * Upstream-API watchdog — reads how many calls this site made to
 * api.pickleball.com in the last few hours and decides whether anything is
 * worth a Slack message.
 *
 * ── WHY A CRON AND NOT AN INLINE CHECK ───────────────────────────────────────
 * The obvious design is to alert from `pbGetJson` the moment a 429 comes back.
 * That is wrong here for two reasons. A rate-limit event is not rare — it
 * arrives in storms of hundreds — so inline alerting would have posted
 * thousands of Slack messages during the 9/17 incident. And module scope on a
 * serverless deploy is one counter per warm instance per region, so no inline
 * counter can answer "how many calls did the SITE make", which is the actual
 * question. Reading the aggregate after the fact costs nothing on the hot path
 * and is the only place the true number exists.
 *
 * ── THE DATA SOURCE, AND ITS ONE REAL RISK ───────────────────────────────────
 * ⚠ `vercel.com/api/observability/metrics` IS UNDOCUMENTED AND INTERNAL. It is
 * what the dashboard's Observability → External APIs view calls, discovered by
 * reading that page's own requests. Vercel do not publish it and may change or
 * withdraw it without notice, and the Vercel plan here is Pro, where the native
 * Monitoring alerts are Enterprise-only — so this is the available route, not
 * the preferred one.
 *
 * ⚠ THEREFORE A FAILED QUERY IS ITSELF AN ALERT. A watchdog that quietly stops
 * working is worse than no watchdog: you believe you are covered and you are
 * not. {@link checkApiHealth} returns a `broken` verdict on any query failure
 * and the cron route pages on it, so the day this endpoint changes shape we find
 * out from Slack rather than from the next incident.
 *
 * Server-only. Never throws.
 */
import { postAlert } from "@/lib/slack-alert";

/** The upstream we care about. Other hosts are ignored entirely. */
const HOST = "api.pickleball.com";

/**
 * Has anybody actually set this up?
 *
 * ⚠ "NEVER CONFIGURED" AND "CONFIGURED BUT BROKEN" MUST NOT BE THE SAME ANSWER,
 * and conflating them is how a dormant feature becomes hourly log noise that
 * buries a real failure. The watchdog ships switched off: the cron is in
 * vercel.json from the day the code lands, but until the three Vercel env vars
 * exist there is nothing to read, so the run is a no-op and says so quietly.
 *
 * The moment they are set, every failure after that point is a genuine fault
 * and pages loudly — see the header note on why a silent watchdog is worse than
 * none. Setup is therefore adding env vars and nothing else; there is no line
 * to uncomment and no deploy to remember.
 */
export function isWatchdogConfigured(): boolean {
  return Boolean(
    process.env.VERCEL_API_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID,
  );
}

/**
 * How many hours to pull. We evaluate the most recently COMPLETED hour against
 * the one before it (for edge-triggering) and use the rest as the 404 baseline.
 */
const WINDOW_HOURS = 8;

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * ⚠ EVERY DEFAULT BELOW IS SET ABOVE THE 9/17 MEASUREMENT ON PURPOSE, AND THEY
 * ARE ALL TOO HIGH ONCE THE CACHING FIX HAS BEEN LIVE FOR A WEEK.
 *
 * A threshold that fires on day one teaches everybody to ignore it, so these
 * are calibrated to catch "worse than the incident we just fixed", not "the
 * incident we just fixed". Measured that day: peak 10,862 calls/hour, ~150
 * 429s/hour, ~300 404s/hour.
 *
 * **RE-BASELINE THESE ONCE THE POST-FIX STEADY STATE IS KNOWN** — roughly 2x
 * whatever a normal hour turns out to be. Each is env-overridable so that is a
 * Vercel setting change, not a deploy.
 */
const THRESHOLDS = {
  /** Calls/hour to HOST. Pre-fix peak was 10,862. */
  calls: () => envInt("API_ALERT_CALLS_PER_HOUR", 12_000),
  /** 429s/hour. Pre-fix was ~150/hour and actively degrading the site. */
  rateLimited: () => envInt("API_ALERT_429_PER_HOUR", 250),
  /** 5xx/hour. There were none on 9/17, so any sustained handful is new. */
  serverErrors: () => envInt("API_ALERT_5XX_PER_HOUR", 25),
  /**
   * How far the 404 count may drift from its own trailing baseline, as a
   * percentage. The ~300/hour is a standing unexplained anomaly (see the probe
   * note in lib/ticker-api.ts) — alerting on its mere existence would be pure
   * noise, so this fires only when it MOVES, in either direction. A sharp drop
   * matters too: it would mean somebody fixed it, or that the calls stopped.
   */
  notFoundDriftPct: () => envInt("API_ALERT_404_DRIFT_PCT", 50),
} as const;

/** One hour's worth of counts for HOST. */
type Hour = { at: string; total: number; c429: number; c404: number; c5xx: number };

export type Breach = {
  key: "volume" | "rate-limit" | "server-errors" | "not-found-drift";
  /** True on the leading edge (just started), false on recovery. */
  firing: boolean;
  headline: string;
  detail: string;
};

export type HealthVerdict =
  | { ok: true; broken: false; hours: Hour[]; breaches: Breach[] }
  | { ok: false; broken: true; reason: string };

function bucketsFrom(rows: { timestamp: string; httpStatus?: string; requestHostname?: string; v: number }[]): Hour[] {
  const by = new Map<string, Hour>();
  for (const r of rows) {
    if (r.requestHostname !== HOST) continue;
    const h = by.get(r.timestamp) ?? { at: r.timestamp, total: 0, c429: 0, c404: 0, c5xx: 0 };
    h.total += r.v;
    const s = Number(r.httpStatus);
    if (s === 429) h.c429 += r.v;
    else if (s === 404) h.c404 += r.v;
    else if (s >= 500 && s < 600) h.c5xx += r.v;
    by.set(r.timestamp, h);
  }
  return [...by.values()].sort((a, b) => a.at.localeCompare(b.at));
}

function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Evaluate one rule across the current and previous hour.
 *
 * ⚠ EDGE-TRIGGERED, AND THAT IS WHAT MAKES THIS LIVEABLE. A level-triggered
 * check would re-post the same alert every hour for as long as the condition
 * lasted — which, for the 9/17 incident, would have been days. Comparing the
 * two most recent hours gives one message when a condition starts and one when
 * it clears, with no stored state to keep in sync, no database, and nothing to
 * go stale across a deploy.
 */
function edge(
  key: Breach["key"],
  curBad: boolean,
  prevBad: boolean,
  headline: string,
  detail: string,
): Breach | null {
  if (curBad && !prevBad) return { key, firing: true, headline, detail };
  if (!curBad && prevBad) return { key, firing: false, headline, detail };
  return null;
}

async function queryHourly(): Promise<Hour[] | { error: string }> {
  const token = process.env.VERCEL_API_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !team || !project) {
    return { error: "VERCEL_API_TOKEN / VERCEL_TEAM_ID / VERCEL_PROJECT_ID not all set" };
  }
  // Align to the hour so the last bucket is a COMPLETE hour, never the partial
  // one we are standing in — a half-finished hour always reads as a drop.
  const endMs = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  try {
    const res = await fetch(`https://vercel.com/api/observability/metrics?teamId=${team}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        event: "outgoingRequest",
        reason: "observability_chart_free",
        scope: { type: "project", ownerId: team, projectIds: [project] },
        rollups: { v: { measure: "count", aggregation: "sum" } },
        startTime: new Date(endMs - WINDOW_HOURS * 3_600_000).toISOString(),
        endTime: new Date(endMs).toISOString(),
        granularity: { hours: 1 },
        groupBy: ["requestHostname", "httpStatus"],
        limit: 100,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { error: `observability ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const json = (await res.json()) as { data?: { timestamp: string; v: number }[] };
    const hours = bucketsFrom((json.data ?? []) as Parameters<typeof bucketsFrom>[0]);
    if (hours.length < 2) return { error: `only ${hours.length} hourly buckets returned for ${HOST}` };
    return hours;
  } catch (err) {
    return { error: `observability query threw: ${String(err)}` };
  }
}

/** Pull the window and decide what, if anything, changed for the worse. */
export async function checkApiHealth(): Promise<HealthVerdict> {
  const hours = await queryHourly();
  if (!Array.isArray(hours)) return { ok: false, broken: true, reason: hours.error };

  const cur = hours[hours.length - 1];
  const prev = hours[hours.length - 2];
  const n = (x: number) => x.toLocaleString("en-US");
  // Typed nullable because `edge` returns null for "no change" — the common
  // case by far. Compacted at the end.
  const breaches: (Breach | null)[] = [];

  const callCeiling = THRESHOLDS.calls();
  breaches.push(
    edge(
      "volume",
      cur.total > callCeiling,
      prev.total > callCeiling,
      `Upstream call volume ${cur.total > callCeiling ? "above" : "back below"} ceiling`,
      `${n(cur.total)} calls to ${HOST} in the hour to ${cur.at.slice(11, 16)}Z (ceiling ${n(callCeiling)}, previous hour ${n(prev.total)}).`,
    ),
  );

  const rlCeiling = THRESHOLDS.rateLimited();
  breaches.push(
    edge(
      "rate-limit",
      cur.c429 > rlCeiling,
      prev.c429 > rlCeiling,
      `Upstream is rate-limiting us`,
      `${n(cur.c429)} × HTTP 429 in the hour to ${cur.at.slice(11, 16)}Z (threshold ${n(rlCeiling)}, previous hour ${n(prev.c429)}). Scores, brackets and the calendar all degrade while this lasts.`,
    ),
  );

  const seCeiling = THRESHOLDS.serverErrors();
  breaches.push(
    edge(
      "server-errors",
      cur.c5xx > seCeiling,
      prev.c5xx > seCeiling,
      `Upstream is returning server errors`,
      `${n(cur.c5xx)} × HTTP 5xx in the hour to ${cur.at.slice(11, 16)}Z (threshold ${n(seCeiling)}, previous hour ${n(prev.c5xx)}).`,
    ),
  );

  /**
   * ⚠ THE 404 BASELINE EXCLUDES THE TWO HOURS BEING COMPARED, or the thing we
   * are testing for would drag its own reference along with it and a slow drift
   * would never register.
   */
  const base = median(hours.slice(0, -2).map((h) => h.c404));
  const driftPct = THRESHOLDS.notFoundDriftPct();
  const drifted = (h: Hour) =>
    base >= 50 && Math.abs(h.c404 - base) / base > driftPct / 100;
  breaches.push(
    edge(
      "not-found-drift",
      drifted(cur),
      drifted(prev),
      `Ticker 404 rate has moved`,
      `${n(cur.c404)} × HTTP 404 in the hour to ${cur.at.slice(11, 16)}Z against a ${n(base)}/hr baseline (±${driftPct}%). This is the standing unexplained anomaly — a move in either direction is a clue, not necessarily a problem.`,
    ),
  );

  return { ok: true, broken: false, hours, breaches: breaches.filter((b): b is Breach => b !== null) };
}

/** Run the check and post anything worth saying. Returns what it did. */
export async function runApiHealthCheck(): Promise<{
  posted: boolean;
  skipped?: "not-configured";
  verdict: HealthVerdict;
}> {
  // Dormant until somebody sets the env vars — see isWatchdogConfigured. No
  // Slack, no error, no log line: this is the expected state before setup, not
  // a fault, and an hourly "could not run" in the runtime logs would be exactly
  // the noise that hides the first real one.
  if (!isWatchdogConfigured()) {
    return {
      posted: false,
      skipped: "not-configured",
      verdict: { ok: false, broken: true, reason: "watchdog not configured" },
    };
  }

  const verdict = await checkApiHealth();

  if (verdict.broken) {
    // See the header note: the watchdog failing is itself the alert.
    const posted = await postAlert(
      `⚠️ PPA Tour site: the upstream-API watchdog could not run — ${verdict.reason}`,
      undefined,
    );
    return { posted, verdict };
  }

  if (!verdict.breaches.length) return { posted: false, verdict };

  const firing = verdict.breaches.filter((b) => b.firing);
  const cleared = verdict.breaches.filter((b) => !b.firing);
  const lines: string[] = [];
  for (const b of firing) lines.push(`🔴 *${b.headline}*\n${b.detail}`);
  for (const b of cleared) lines.push(`🟢 *Recovered — ${b.headline.toLowerCase()}*\n${b.detail}`);

  const summary = firing.length
    ? `🔴 PPA Tour site — ${firing.map((b) => b.headline).join("; ")}`
    : `🟢 PPA Tour site — upstream API back to normal`;

  const posted = await postAlert(summary, [
    { type: "section", text: { type: "mrkdwn", text: lines.join("\n\n") } },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `api.pickleball.com · <https://vercel.com/pickleball-hq/ppatour-website/observability/external-apis|Observability → External APIs>`,
        },
      ],
    },
  ]);
  return { posted, verdict };
}
