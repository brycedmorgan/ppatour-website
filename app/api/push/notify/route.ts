import { NextResponse } from "next/server";
import { getEvents } from "@/lib/events-api";
import { getEventField } from "@/lib/event-field";
import { slugsForNames } from "@/lib/player-match";
import { pushSendConfigured, sendToAll } from "@/lib/push-send";
import {
  allSubscribers,
  claimOnce,
  pushStoreConfigured,
  subscribersFollowing,
} from "@/lib/push-store";
import { fetchLiveTicker, type TickerMatch } from "@/lib/ticker-api";
import { eventHref } from "@/lib/placeholder-data";
import { getPublishedAthlete } from "@/lib/published-athletes";

/**
 * The alert sender. One cron, four alerts (Bryce picked all four on 8/18):
 *
 *   1. A followed pro's DRAW IS PUBLISHED.
 *   2. A followed pro is ON COURT NOW.
 *   3. A followed pro's MATCH IS FINAL.
 *   4. A TOUR STOP STARTS THIS WEEK (everyone, not per-player).
 *
 * ⚠ WHY #1 IS BUILDABLE AND "WHERE DOES MY PRO PLAY NEXT" IS NOT. We have no
 * player→events endpoint, so before a draw drops nobody can honestly say who is
 * playing where. But the draw publishing IS the data arriving: `getEventField`
 * goes from `published: false` with zero names to a full field the moment it
 * lands. This alert fires on exactly that transition, which means it says
 * something true at the first instant it can be said.
 *
 * ⚠ EVERY SEND IS CLAIMED FIRST. `claimOnce` is an insert that either lands or
 * conflicts, so a cron overlapping itself, or two regions running together,
 * cannot double-send. A fan gets "Ben Johns is on court" once per match, not
 * once per cron tick.
 *
 * ⚠ NAMES ARE MATCHED CONSERVATIVELY. The feeds carry names, not ids, and there
 * are two Ben Johnses on tour. `slugsForNames` drops anything ambiguous rather
 * than guessing — a mismatch here is a notification about the wrong person on
 * somebody's lock screen.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** How far ahead we look for a draw that might have dropped. */
const DRAW_WINDOW_DAYS = 12;
const WEEK_AHEAD_DAYS = 7;

function daysUntil(iso: string): number {
  const then = new Date(`${iso}T12:00:00Z`).getTime();
  return Math.round((then - Date.now()) / 86_400_000);
}

/** Names on both sides of the net. */
function matchNames(m: TickerMatch): string[] {
  return m.teams.flatMap((t) => t.players.map((p) => p.name)).filter(Boolean);
}

/** "A. Waters / B. Johns" */
function sideLabel(m: TickerMatch, i: 0 | 1): string {
  return m.teams[i].players.map((p) => p.name).join(" / ");
}

type Sent = { alert: string; key: string; devices: number };

/**
 * Send one alert to the devices following any of `slugs`, personalised per
 * device: the copy names the pro THAT fan follows, not the first name in the
 * feed.
 */
async function notifyFollowers(
  slugs: string[],
  key: string,
  build: (theirFollows: string[]) => { title: string; body: string; url: string; tag?: string },
): Promise<number> {
  if (slugs.length === 0) return 0;
  const subs = await subscribersFollowing(slugs);
  if (subs.length === 0) return 0;
  if (!(await claimOnce(key))) return 0;

  let sent = 0;
  for (const sub of subs) {
    const theirs = sub.follows.filter((f) => slugs.includes(f));
    if (theirs.length === 0) continue;
    sent += await sendToAll([sub], build(theirs));
  }
  return sent;
}

/** Slug → the name the fan sees on the profile they followed. */
function nameFor(slug: string): string {
  return (
    getPublishedAthlete(slug)?.name ??
    slug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
  );
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!pushStoreConfigured() || !pushSendConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: "push not configured",
      store: pushStoreConfigured(),
      sender: pushSendConfigured(),
    });
  }

  const sent: Sent[] = [];
  const { events } = await getEvents();
  /** Fetched at most once — the week-ahead alert is the only tour-wide one. */
  let everyone: Awaited<ReturnType<typeof allSubscribers>> | null = null;

  // 1 + 4 — draws and week-ahead, per event.
  for (const t of events) {
    if (t.status === "completed") continue;
    const days = daysUntil(t.startDate);

    if (days >= 0 && days <= WEEK_AHEAD_DAYS) {
      const key = `week:${t.slug}`;
      everyone = everyone ?? (await allSubscribers());
      const subs = everyone;
      if (subs.length > 0 && (await claimOnce(key))) {
        const devices = await sendToAll(subs, {
          title: t.name,
          body: `Starts ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`} in ${t.city}, ${t.state}.`,
          url: eventHref(t),
          tag: key,
        });
        sent.push({ alert: "week", key, devices });
      }
    }

    if (days >= -3 && days <= DRAW_WINDOW_DAYS && t.tournamentUuid) {
      const field = await getEventField(t.tournamentUuid);
      if (field.published && field.players.length > 0) {
        const slugs = slugsForNames(field.players.map((p) => p.name));
        const devices = await notifyFollowers(slugs, `draw:${t.slug}`, (theirs) => ({
          title: "The draw is out",
          body:
            theirs.length === 1
              ? `${nameFor(theirs[0])} is in the draw at ${t.name}.`
              : `${theirs.length} pros you follow are in the draw at ${t.name}.`,
          url: eventHref(t),
          tag: `draw:${t.slug}`,
        }));
        if (devices > 0) sent.push({ alert: "draw", key: `draw:${t.slug}`, devices });
      }
    }
  }

  // 2 + 3 — live and final, from the score ticker.
  const ticker = await fetchLiveTicker();
  for (const m of ticker.matches) {
    if (m.status !== "live" && m.status !== "final") continue;
    const slugs = slugsForNames(matchNames(m));
    if (slugs.length === 0) continue;

    const key = `${m.status}:${m.id}`;
    const label = `${sideLabel(m, 0)} vs ${sideLabel(m, 1)}`;
    const devices = await notifyFollowers(slugs, key, (theirs) => ({
      title:
        m.status === "live"
          ? `${nameFor(theirs[0])} is on court`
          : `${nameFor(theirs[0])} — match final`,
      body: m.division ? `${m.division} · ${label}` : label,
      url: "/live/",
      // Live then final for the same match replaces rather than stacks.
      tag: `match:${m.id}`,
    }));
    if (devices > 0) sent.push({ alert: m.status, key, devices });
  }

  return NextResponse.json({ ok: true, sent, at: new Date().toISOString() });
}
