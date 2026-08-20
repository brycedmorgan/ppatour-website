/**
 * PPA Tour Asia — event links to the Asia tour's own site.
 *
 * Wade (PPA Tour Asia), forwarded by Wesley 8/6: the Asia stops on our calendar
 * were linking out to a pickleballtournaments.com PPA Tour holding page. They
 * run a real page per tournament at ppatour-asia.com and want the upcoming AND
 * completed events pointed there instead.
 *
 * ⚠ THIS CHANGES THE LINK, NOT THE PAGE. Asia stops still have no internal
 * /events/{year}/{slug} page (`hasInternalPage` stays false) — the card, the
 * Next Six band and site search all link OUT, and this is where they now go.
 *
 * ⚠ IT FAILS SAFE, AND THAT IS DELIBERATE. Both lookups return undefined for
 * anything not listed, and every caller keeps its old pickleballtournaments URL
 * in that case. A feed rename therefore degrades to today's behaviour rather
 * than to a dead link — but it degrades SILENTLY, so `npm run asia:audit`
 * prints both sides of the drift: rows here that match no feed event, and PPA
 * Tour Asia feed events with no row here.
 *
 * ⚠ TWO KEYS PER EVENT, BECAUSE THERE ARE TWO CODE PATHS.
 *   - `ptSlug` — the feed's own `details_url` permalink, and the primary key.
 *     It is what the API sends and exactly what we replace, and it survives a
 *     title edit upstream, which our derived slug would not.
 *   - `curatedSlug` — the slug the stop carries in `lib/placeholder-data.ts`,
 *     used only when the events API is unreachable and we serve the curated
 *     calendar. Only the five Asia stops we carry there have one.
 *
 * All 17 destinations were requested 200 with a browser UA (8/6, Hong Kong Slam
 * re-checked 8/20) and their page titles matched Wade's event names. The apex 301s to `www.`, so the URLs
 * are written with it — a card click shouldn't spend a redirect.
 */

/** Host the Asia tour serves from (apex redirects here). */
export const ASIA_TOUR_HOST = "ppatour-asia.com";

type AsiaEvent = {
  /** Wade's name for the stop — this table is maintained by hand, by a human. */
  name: string;
  /** Path under ppatour-asia.com/tournament/ — `{year}/{event}`. */
  path: string;
  /** Last segment of the feed's `details_url` (pickleballtournaments.com). */
  ptSlug?: string;
  /** Slug in the curated calendar, for the API-unreachable fallback. */
  curatedSlug?: string;
};

/**
 * Wade's list, joined to the live `ppa_tournaments` feed (re-verified 8/20 —
 * all 17 are now in it, all under the "PPA Tour Asia" org).
 *
 * ⚠ THE FEED CARRIES ASIA STOPS WADE'S LIST DOES NOT. "PPA Asia 125 Malaysia
 * Tomaz Cup" (Subang Jaya, Aug 2026) renders on /events and still links to the
 * pickleballtournaments.com holding page, because nobody has given us its
 * ppatour-asia.com URL. Ask Wade before adding a row — a guessed path is worse
 * than the holding page. `npm run asia:audit` lists this drift.
 */
export const ASIA_TOUR_EVENTS: readonly AsiaEvent[] = [
  /* ---- 2025 (completed) ---- */
  {
    name: "Panas Malaysia Open",
    path: "2025/panas-malaysia-open",
    ptSlug: "ppa-tour-asia-panas-malaysia-open-2025",
  },
  {
    name: "Hong Kong Open",
    path: "2025/hong-kong-open",
    ptSlug: "ppa-tour-asia-hong-kong-open-2025",
  },
  {
    name: "Sansan Fukuoka Open",
    path: "2025/fukuoka-open",
    ptSlug: "ppa-tour-asia-sansan-fukuoka-open",
  },
  {
    name: "MB Vietnam Open (Ho Chi Minh City)",
    path: "2025/mb-vietnam-open",
    ptSlug: "ppa-tour-asia-mb-vietnam-open-2025",
  },
  {
    name: "Panas Malaysia Cup",
    path: "2025/malaysia-cup",
    ptSlug: "ppa-tour-asia-panas-malaysia-cup-2025",
  },
  {
    name: "MB Vietnam Cup (Da Nang)",
    path: "2025/vietnam-cup",
    ptSlug: "ppa-tour-asia-mb-vietnam-cup-2025",
  },
  {
    // Wade's list says Oct/Nov; the feed has it Dec 3–6. Their page is the one
    // that has to be right about its own dates — we only link to it.
    name: "Hangzhou Open",
    path: "2025/hangzhou-open",
    ptSlug: "ppa-tour-asia-hangzhou-open-2025",
  },

  /* ---- 2026 ---- */
  {
    name: "MB Hanoi Cup",
    path: "2026/hanoi-cup",
    ptSlug: "ppa-asia-1000-mb-hanoi-cup-2026",
  },
  {
    name: "Panas Kuala Lumpur Open",
    path: "2026/kuala-lumpur-open",
    ptSlug: "ppa-asia-500-panas-kuala-lumpur-open-2026",
  },
  {
    name: "Macao Open",
    path: "2026/macao-open",
    ptSlug: "ppa-asia-500-macao-open-2026",
  },
  {
    name: "Capital Securities Beijing Open",
    path: "2026/beijing-open",
    ptSlug: "ppa-asia-500-capital-securities-beijing-open-2026",
  },
  {
    name: "Sansan Tokyo Open",
    path: "2026/tokyo-open",
    ptSlug: "ppa-asia-500-sansan-tokyo-open-2026",
  },
  {
    name: "Leapmotor Singapore Open",
    path: "2026/singapore-open",
    ptSlug: "ppa-asia-500-leapmotor-singapore-open-2026",
    curatedSlug: "ppa-asia-500-singapore-open",
  },
  {
    name: "MB Ho Chi Minh City Open",
    path: "2026/ho-chi-minh-city-open",
    ptSlug: "ppa-asia-500-mb-ho-chi-minh-city-open-2026",
    curatedSlug: "ppa-asia-500-ho-chi-minh-city-open",
  },
  {
    // The curated calendar files this one as "PPA Asia 500 China Open 2" —
    // same stop, Shenzhen, Aug 20–23.
    name: "Skechers Shenzhen Open",
    path: "2026/shenzhen-open",
    ptSlug: "ppa-asia-500-skechers-shenzhen-open-2026",
    curatedSlug: "ppa-asia-500-china-open-2",
  },
  {
    name: "Leapmotor Kuala Lumpur Cup",
    path: "2026/kuala-lumpur-cup",
    ptSlug: "ppa-asia-1000-leapmotor-kuala-lumpur-cup-2026",
    curatedSlug: "ppa-asia-1000-kuala-lumpur-cup",
  },
  {
    // Registered in the feed on 8/20 — it was curated-only when this table was
    // written. Its Asia page is live (Kai Tak, October 19–25).
    name: "Hang Seng Bank Hong Kong Slam",
    path: "2026/hong-kong-slam",
    ptSlug: "ppa-asia-1500-hang-seng-bank-hong-kong-slam-2026",
    curatedSlug: "ppa-asia-1500-hong-kong-slam",
  },
];

function asiaUrl(path: string): string {
  return `https://www.${ASIA_TOUR_HOST}/tournament/${path}/`;
}

const BY_PT_SLUG = new Map<string, string>();
const BY_CURATED_SLUG = new Map<string, string>();
for (const e of ASIA_TOUR_EVENTS) {
  if (e.ptSlug) BY_PT_SLUG.set(e.ptSlug, asiaUrl(e.path));
  if (e.curatedSlug) BY_CURATED_SLUG.set(e.curatedSlug, asiaUrl(e.path));
}

/** The `pickleballtournaments.com/tournaments/{slug}` slug in a details URL. */
export function pickleballTournamentsSlug(detailsUrl: string | undefined): string | null {
  if (!detailsUrl) return null;
  const m = /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(detailsUrl);
  return m ? m[1].toLowerCase() : null;
}

/**
 * The Asia tour's own page for a feed event, from its `details_url`. Undefined
 * for anything not in the table — the caller keeps the feed's URL.
 */
export function asiaTourUrlForDetailsUrl(detailsUrl: string | undefined): string | undefined {
  const slug = pickleballTournamentsSlug(detailsUrl);
  return slug ? BY_PT_SLUG.get(slug) : undefined;
}

/**
 * The Asia tour's own page for a CURATED calendar slug — the fallback path,
 * used when the events API is unreachable. Undefined for every other event.
 */
export function asiaTourUrlForCuratedSlug(slug: string): string | undefined {
  return BY_CURATED_SLUG.get(slug);
}
