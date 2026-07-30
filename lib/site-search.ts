/**
 * Site-wide search across every piece of content the site publishes.
 *
 * ⚠ SERVER-ONLY. This replaces the old `lib/search-index.ts`, which was built
 * at module scope and imported by a "use client" component — so the entire
 * index was serialized into the browser bundle. That constraint is why the old
 * search could only ever match titles and short meta strings: shipping article
 * bodies to the client was never an option.
 *
 * Running server-side removes the ceiling. Article bodies, athlete bios and
 * program copy are all searchable now, which is the difference between finding
 * a headline and finding a subject: "kitchen" matches 39 posts by body versus 1
 * by title.
 *
 * News ranking is delegated to `searchNews()` rather than duplicated — one
 * index, one scoring model, and /news and /search agree on what "relevant"
 * means.
 */

import { searchNews, type NewsCard } from "@/lib/news";
import { athletes } from "@/lib/athletes";
import { CURATED_TO_CANONICAL, publishedAthletes } from "@/lib/published-athletes";
import { ecosystemNews } from "@/lib/home-content";
import { eventGuides } from "@/lib/event-guides";
import { getEvents } from "@/lib/events-api";
import {
  eventHref,
  formatDateRange,
  tierShort,
  tournaments,
  type Tournament,
} from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";

export type SearchGroup = "News" | "Athletes" | "Events" | "Programs" | "Pages";

export type SearchHit = {
  group: SearchGroup;
  title: string;
  meta: string;
  href: string;
  external?: boolean;
  /** Short context line, present where the source has one. */
  snippet?: string;
};

export type SearchGroupResult = {
  group: SearchGroup;
  hits: SearchHit[];
  /** Total matches before the per-group cap, so the UI can say "of N". */
  total: number;
};

export type SiteSearchResult = {
  query: string;
  groups: SearchGroupResult[];
  total: number;
};

/** Group display order — news leads because it is the deepest content. */
const GROUP_ORDER: SearchGroup[] = ["News", "Athletes", "Events", "Programs", "Pages"];

/** Per-group cap. Deep result sets belong on /news, not in a blended list. */
const PER_GROUP = 8;

const STATIC_PAGES: { title: string; meta: string; href: string; extra?: string }[] = [
  { title: "Watch", meta: "Live streams, broadcast schedule, where to watch", href: "/watch", extra: "pickleballtv pbtv tennis channel broadcast stream live tv" },
  { title: "TV Schedule", meta: "Every televised window, event by event", href: "/watch/tv", extra: "tennis channel pbtv broadcast times listings" },
  { title: "Play", meta: "Register to play at a PPA Tour stop", href: "/play", extra: "amateur registration sign up divisions skill level" },
  { title: "Athletes", meta: "The full pro roster", href: "/athletes", extra: "players pros roster" },
  { title: "Rankings", meta: "World Pickleball Rankings — the top men's and women's standings", href: "/rankings", extra: "wpr world pickleball ranking points standings" },
  { title: "Leaderboards", meta: "The full World Pickleball Rankings, 50 players per page", href: "/leaderboards", extra: "wpr standings full board" },
  { title: "Schedule", meta: "Every tour event", href: "/events", extra: "calendar tournaments stops dates tickets" },
  { title: "News", meta: "Storylines and recaps from the tour", href: "/news", extra: "newsroom articles coverage archive" },
  { title: "About the PPA Tour", meta: "Story, mission, and structure", href: "/about" },
  { title: "The Pro Tour", meta: "How the professional tour works", href: "/about/pro-tour" },
  { title: "Tournament History", meta: "National champions year by year", href: "/about/history", extra: "past champions winners records" },
  { title: "How It Works", meta: "Season format, points, and divisions", href: "/about/how-it-works", extra: "ranking points tiers majors cups opens divisions" },
  { title: "Sponsors", meta: "Title and official partners", href: "/about/sponsors", extra: "carvana veolia joola humana partners partnership" },
  { title: "What is Pickleball?", meta: "The basics for new fans", href: "/about/what-is-pickleball", extra: "rules beginner kitchen dink serve scoring" },
  { title: "Contact", meta: "Reach the right PPA team", href: "/about/contact", extra: "email press media tickets" },
  { title: "Host a Tournament", meta: "Bring a PPA event to your venue", href: "/about/host-tournament", extra: "venue bid host city" },
  { title: "Host a Private Event", meta: "Corporate pro-ams and hospitality", href: "/about/private-events", extra: "corporate pro-am hospitality" },
  { title: "Ambassador Program", meta: "Represent the tour in your region", href: "/about/ambassadors" },
  { title: "Careers", meta: "Work at the PPA Tour", href: "/about/careers", extra: "jobs hiring" },
  { title: "Player Handbook", meta: "Pro and amateur rule reference", href: "/about/player-handbook", extra: "rules code of conduct" },
  { title: "Integrity Reporting", meta: "Confidential reporting", href: "/about/integrity" },
  { title: "Privacy Policy", meta: "How we handle your data", href: "/about/privacy" },
  { title: "Terms of Use", meta: "Site terms", href: "/about/terms" },
  { title: "Volunteer", meta: "Work a tour stop", href: "/events/volunteer", extra: "volunteering help staff" },
];

function norm(s: string): string {
  return s.toLowerCase();
}

/**
 * Every term must hit somewhere (AND). Title matches outweigh a mention buried
 * in a bio or guide, and a term that opens the title outranks one in the middle.
 */
function score(terms: string[], title: string, meta: string, body: string): number {
  let total = 0;
  for (const term of terms) {
    // Singular fallback so "nationals" finds "National Championships".
    const singular = term.length > 3 && term.endsWith("s") ? term.slice(0, -1) : term;
    const hit = title.includes(term) || meta.includes(term) || body.includes(term)
      ? term
      : title.includes(singular) || meta.includes(singular) || body.includes(singular)
        ? singular
        : null;
    if (!hit) return 0;
    if (title.startsWith(hit)) total += 14;
    else if (title.includes(hit)) total += 10;
    else if (meta.includes(hit)) total += 5;
    else total += 1;
  }
  return total;
}

function takeTop<T>(scored: { item: T; s: number }[], limit: number): T[] {
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.item);
}

/* ─────────────────────────── athletes ─────────────────────────── */

type AthleteDoc = { hit: SearchHit; title: string; meta: string; body: string };
let athleteDocs: AthleteDoc[] | null = null;

function buildAthleteDocs(): AthleteDoc[] {
  if (athleteDocs) return athleteDocs;
  const canonicalToCurated: Record<string, string> = Object.fromEntries(
    Object.entries(CURATED_TO_CANONICAL).map(([ours, api]) => [api, ours]),
  );
  const docs: AthleteDoc[] = [];
  const seen = new Set<string>();

  for (const p of publishedAthletes) {
    seen.add(p.slug);
    const meta = p.divisions.length ? p.divisions.join(" · ") : "PPA Tour Pro";
    docs.push({
      hit: {
        group: "Athletes",
        title: p.name,
        meta,
        href: `/athletes/${canonicalToCurated[p.slug] ?? p.slug}`,
        snippet: p.bio[0]?.slice(0, 150) ?? undefined,
      },
      title: norm(p.name),
      meta: norm(`${meta} ${p.country} ${p.quickInfo.resides ?? ""} athlete pro player`),
      // 165 of the 180 profiles carry real bio copy (~1,700 chars each).
      body: norm(p.bio.join(" ")),
    });
  }
  // Curated pros with no published profile stay searchable.
  for (const a of athletes) {
    if (seen.has(CURATED_TO_CANONICAL[a.slug] ?? a.slug)) continue;
    docs.push({
      hit: {
        group: "Athletes",
        title: a.name,
        meta: a.divisions.join(" · "),
        href: `/athletes/${a.slug}`,
        snippet: a.tagline,
      },
      title: norm(a.name),
      meta: norm(`${a.divisions.join(" ")} ${a.country} athlete pro player`),
      body: norm(`${a.tagline ?? ""} ${a.bio ?? ""}`),
    });
  }
  athleteDocs = docs;
  return docs;
}

/* ─────────────────────────── events ─────────────────────────── */

function eventDoc(t: Tournament) {
  const dates = formatDateRange(t.startDate, t.endDate);
  const tier = tierShort(t);
  const guide = eventGuides[t.slug];
  // Travel-guide copy makes an event findable by hotel, airport or venue.
  const guideText = guide
    ? [
        guide.mapQuery,
        guide.airport,
        guide.airportNote,
        guide.gettingThere,
        guide.parking,
        ...guide.hotels.map((h) => h.name),
        ...guide.dining.map((h) => h.name),
        ...guide.doing.map((h) => h.name),
      ].join(" ")
    : "";
  return {
    hit: {
      group: "Events" as const,
      title: t.name,
      meta: `${tier} · ${t.city}, ${t.state} · ${dates}`,
      href: eventHref(t),
    },
    title: norm(t.name),
    meta: norm(
      `${t.shortName ?? ""} ${t.city} ${t.state} ${t.venue} ${tier} ${t.presentedBy ?? ""} ${dates} event tournament tickets`,
    ),
    body: norm(guideText),
  };
}

/* ─────────────────────────── entry point ─────────────────────────── */

/**
 * Ranked, grouped results across the whole site. Never throws — a failure in
 * the live events feed degrades to the curated calendar rather than taking
 * search down.
 */
export async function searchSite(query: string): Promise<SiteSearchResult> {
  const q = query.trim().replace(/\s+/g, " ");
  if (q.length < 2) return { query: q, groups: [], total: 0 };
  const terms = [...new Set(norm(q).split(" ").filter(Boolean))];

  /* News — delegated so /search and /news rank identically. */
  const newsResult = searchNews({ query: q, pageSize: PER_GROUP });
  const newsHits: SearchHit[] = newsResult.items.map((n: NewsCard) => ({
    group: "News",
    title: n.title,
    meta: `${n.category} · ${n.displayDate}`,
    href: n.href,
    snippet: n.dek || undefined,
  }));

  /* Athletes */
  const athleteScored = buildAthleteDocs()
    .map((d) => ({ item: d.hit, s: score(terms, d.title, d.meta, d.body) }))
    .filter((x) => x.s > 0);

  /* Events — live calendar when reachable, curated list otherwise. */
  let eventSource: Tournament[] = tournaments;
  try {
    const { events } = await getEvents();
    if (events.length) eventSource = events;
  } catch {
    /* keep the curated list */
  }
  const eventScored = eventSource
    .map(eventDoc)
    .map((d) => ({ item: d.hit as SearchHit, s: score(terms, d.title, d.meta, d.body) }))
    .filter((x) => x.s > 0);

  /* Programs */
  const programScored = tourPrograms
    .map((p) => ({
      item: {
        group: "Programs" as const,
        title: p.label,
        meta: p.headline,
        href: `/tour/${p.slug}`,
      } as SearchHit,
      s: score(
        terms,
        norm(p.label),
        norm(`${p.eyebrow} ${p.headline}`),
        norm(p.body.join(" ")),
      ),
    }))
    .filter((x) => x.s > 0);

  /* Pages + linked Pickleball.com coverage */
  const pageScored = STATIC_PAGES.map((p) => ({
    item: { group: "Pages" as const, title: p.title, meta: p.meta, href: p.href } as SearchHit,
    s: score(terms, norm(p.title), norm(`${p.meta} ${p.extra ?? ""}`), ""),
  })).filter((x) => x.s > 0);

  const ecoScored = ecosystemNews
    .map((n) => ({
      item: {
        group: "News" as const,
        title: n.title,
        meta: `Pickleball.com · ${n.date}`,
        href: n.href,
        external: true,
      } as SearchHit,
      s: score(terms, norm(n.title), norm(`${n.category} pickleball.com`), ""),
    }))
    .filter((x) => x.s > 0);

  const groups: SearchGroupResult[] = ([
    {
      group: "News" as const,
      hits: [...newsHits, ...takeTop(ecoScored, 2)].slice(0, PER_GROUP + 2),
      total: newsResult.total + ecoScored.length,
    },
    { group: "Athletes" as const, hits: takeTop(athleteScored, PER_GROUP), total: athleteScored.length },
    { group: "Events" as const, hits: takeTop(eventScored, PER_GROUP), total: eventScored.length },
    { group: "Programs" as const, hits: takeTop(programScored, PER_GROUP), total: programScored.length },
    { group: "Pages" as const, hits: takeTop(pageScored, PER_GROUP), total: pageScored.length },
  ] satisfies SearchGroupResult[]).filter((g) => g.hits.length > 0);

  groups.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));

  return {
    query: q,
    groups,
    total: groups.reduce((sum, g) => sum + g.total, 0),
  };
}
