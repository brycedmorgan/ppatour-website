/**
 * Resolving an event from its URL — shared by the event page and the on-site
 * "Today" screen.
 *
 * ⚠ MOVED HERE VERBATIM from `app/events/[year]/[slug]/page.tsx`, comments and
 * all, when the Today screen needed the same answer. Do NOT reimplement it at a
 * second call site: the gates below are the difference between an event page
 * and 36 fabricated ones (see the notes inside), and a second copy would drift
 * from this one the first time either is fixed.
 */
import { getEvents } from "@/lib/events-api";
import { eventYear, tournaments, type Tournament } from "@/lib/placeholder-data";

/**
 * Resolve an event for its detail page by year + slug: a curated record wins
 * (keeps the rich, hand-authored content), otherwise an API-sourced US event
 * that has an internal page. Matching on the year disambiguates recurring
 * events (e.g. the 2026 vs 2027 PPA Finals, which share the slug `ppa-finals`).
 * Returns null for unknown events, challengers, and international stops (which
 * all link out to their details_url instead).
 */
export type Resolved =
  | { kind: "internal"; event: Tournament }
  /** An event that lives on someone else's site — see the gate below. */
  | { kind: "link-out"; event: Tournament; href: string | null }
  | null;

export async function resolveEvent(year: string, slug: string): Promise<Resolved> {
  const match = (x: Tournament) => x.slug === slug && eventYear(x) === year;
  const curated = tournaments.find(match) ?? null;
  const live = (await getEvents()).events.find(match) ?? null;
  const t = curated ?? live;
  if (!t || t.tierKey === "challenger") return null;

  /**
   * ⚠ ANNOUNCED, BUT NO PAGE YET — 404, and deliberately NOT a redirect.
   *
   * This page is a template: give it any event record and it publishes a purse
   * from the tier table, a templated Order of Play with gate and first-serve
   * times, broadcast windows, a trip guide and a Register to Play CTA. For the
   * Texas Open — announced with the location still TBD — every one of those
   * would be invented, which is the same failure as the 36 fabricated
   * international pages (8/6) and the fabricated parking fallbacks (8/5).
   *
   * There is nowhere to send people either: no venue, no ticket listing, no
   * registration page. The card on /events says "Details Coming Soon" and the
   * URL 404s until the flag comes off, which is the honest pair.
   */
  if (t.detailsComingSoon) return null;

  // ⚠ The curated record still WINS for everything except the name — it is the
  // only source of `defendingChampions`, and it carries the hand-authored
  // content this page is built on. But Wesley, 8/3: names come from the API.
  // So overlay just the name when the feed has this event.
  //
  // This overlay is required, not belt-and-braces: `mapTournament` sets the
  // feed's name, but a curated event never reaches that record here — curated
  // is checked first — so without this the API name would silently never
  // appear on the one page that matters most.
  //
  // ⚠ THE VENUE IS THE SECOND FIELD TO NEED THIS OVERLAY (Wesley, 8/13), and it
  // is the same trap the name hit: wiring `mapTournament` alone fixes the
  // /events cards and leaves THIS page — the one that matters most — on the old
  // venue, so the two disagree about the same tournament.
  //
  // No policy lives here. `live.venue` is already the answer `resolveVenue`
  // settled (feed first, curated when the feed can't answer), so this only has
  // to prefer the live record. `|| t.venue` covers the stop the feed has never
  // heard of and the API being unreachable.
  const name = live?.name && live.name !== t.name ? live.name : t.name;
  const venue = live?.venue || t.venue;
  const event = name !== t.name || venue !== t.venue ? { ...t, name, venue } : t;

  /**
   * ⚠ THIS GATE WAS MISSING, AND THE DOC COMMENT ABOVE HAS CLAIMED IT SINCE
   * THE FILE WAS WRITTEN. Only `tierKey === "challenger"` was checked, so every
   * NON-challenger international stop — the Asia and Australia 1,000/1,500s —
   * rendered a full, hand-authored PPA event page under our name. Measured
   * 8/6 against the live feed: 36 such URLs served 200.
   *
   * They are not thin pages, they are wrong ones. `/events/2026/ppa-asia-1000-
   * leapmotor-kuala-lumpur-cup-2026` published a **$1,063,327 prize purse**
   * (our Open-tier figure, applied to someone else's tournament), a templated
   * Order of Play with invented gate and first-serve times, "Tennis Channel ·
   * PBTV" and "FOX · PBTV" broadcast windows for a Malaysian event, a Know
   * Before You Go / parking / where-to-stay block, and a Register to Play CTA.
   * Same class as the fabricated presenters (8/4) and the fabricated parking
   * fallbacks (8/5 pt. 14): plausible, specific, operational, and unsourced.
   *
   * A link-out event now goes where its card goes — the tour that runs it.
   * `redirect` is TEMPORARY (307) on purpose: real internal pages for the
   * international 1,000+ stops are a live roadmap item (Connor, 7/23), and a
   * 308 would sit in browser caches long after we build them.
   */
  if (event.hasInternalPage === false) {
    return {
      kind: "link-out",
      event,
      href: deepLink(event.externalUrl) ?? deepLink(event.registerUrl) ?? null,
    };
  }
  return { kind: "internal", event };
}

/**
 * A URL only counts as a destination if it names the event. `registerUrl` falls
 * back to the bare `pickleballtournaments.com/` homepage for stops with no
 * listing (two Australia rows today), and bouncing someone off our URL onto a
 * platform homepage is the "wrong page beats no page" trade this repo keeps
 * refusing — the Chicago hotel link was dropped for the same reason (7/29).
 * Those 404 instead.
 */
function deepLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).pathname.replace(/\/+$/, "") ? url : undefined;
  } catch {
    return undefined;
  }
}
