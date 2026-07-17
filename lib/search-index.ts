import { athletes } from "@/lib/athletes";
import { ecosystemNews, news } from "@/lib/home-content";
import { CURATED_TO_CANONICAL, publishedAthletes } from "@/lib/published-athletes";
import {
  formatDateRange,
  tierShort,
  tournaments,
} from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";

/**
 * Static in-memory site search. Everything the site renders lives in lib/
 * data files, so a unified index needs no API or CMS — rebuild this when the
 * scoring API / Sanity land and content goes dynamic.
 */

export type SearchGroup = "Events" | "Athletes" | "Programs" | "News" | "Pages";

export type SearchDoc = {
  group: SearchGroup;
  title: string;
  meta: string;
  href: string;
  external?: boolean;
  /** Lowercase text blob the query is matched against. */
  haystack: string;
};

const STATIC_PAGES: { title: string; meta: string; href: string }[] = [
  { title: "Watch", meta: "Live streams, broadcast schedule, where to watch", href: "/watch" },
  { title: "Play", meta: "Register to play at a PPA Tour stop", href: "/play" },
  { title: "Athletes", meta: "The full pro roster", href: "/athletes" },
  { title: "Rankings", meta: "World Pickleball Rankings — the top men's and women's standings", href: "/rankings" },
  { title: "Leaderboards", meta: "The full World Pickleball Rankings, 50 players per page", href: "/leaderboards" },
  { title: "Schedule", meta: "Every main-tour event", href: "/events" },
  { title: "News", meta: "Storylines and recaps from the tour", href: "/news" },
  { title: "About the PPA Tour", meta: "Story, mission, and structure", href: "/about" },
  { title: "The Pro Tour", meta: "How the professional tour works", href: "/about/pro-tour" },
  { title: "Tournament History", meta: "National champions year by year", href: "/about/history" },
  { title: "How It Works", meta: "Season format, points, and divisions", href: "/about/how-it-works" },
  { title: "Sponsors", meta: "Title and official partners", href: "/about/sponsors" },
  { title: "What is Pickleball?", meta: "The basics for new fans", href: "/about/what-is-pickleball" },
  { title: "Contact", meta: "Reach the right PPA team", href: "/about/contact" },
  { title: "Host a Tournament", meta: "Bring a PPA event to your venue", href: "/about/host-tournament" },
  { title: "Host a Private Event", meta: "Corporate pro-ams and hospitality", href: "/about/private-events" },
  { title: "Ambassador Program", meta: "Represent the tour in your region", href: "/about/ambassadors" },
  { title: "Careers", meta: "Work at the PPA Tour", href: "/about/careers" },
  { title: "Player Handbook", meta: "Pro and amateur rule reference", href: "/about/player-handbook" },
  { title: "Integrity Reporting", meta: "Confidential reporting", href: "/about/integrity" },
  { title: "Privacy Policy", meta: "How we handle your data", href: "/about/privacy" },
  { title: "Terms of Use", meta: "Site terms", href: "/about/terms" },
];

function blob(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function buildIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const t of tournaments) {
    const dates = formatDateRange(t.startDate, t.endDate);
    docs.push({
      group: "Events",
      title: t.name,
      meta: `${tierShort(t)} · ${t.city}, ${t.state} · ${dates}`,
      href: `/events/${t.slug}`,
      haystack: blob(
        t.name,
        t.shortName,
        t.city,
        t.state,
        t.venue,
        tierShort(t),
        t.presentedBy,
        dates,
        "event tournament tickets",
      ),
    });
  }

  // Every published athlete is searchable; the display slug prefers the curated
  // shorthand page when one exists (richer, local headshot).
  const canonicalToCurated: Record<string, string> = Object.fromEntries(
    Object.entries(CURATED_TO_CANONICAL).map(([ours, api]) => [api, ours]),
  );
  const indexedCanonical = new Set<string>();
  for (const p of publishedAthletes) {
    indexedCanonical.add(p.slug);
    const href = `/athletes/${canonicalToCurated[p.slug] ?? p.slug}`;
    docs.push({
      group: "Athletes",
      title: p.name,
      meta: p.divisions.length ? p.divisions.join(" · ") : "PPA Tour Pro",
      href,
      haystack: blob(
        p.name,
        p.country,
        p.divisions.join(" "),
        p.quickInfo.resides ?? "",
        "athlete pro player",
      ),
    });
  }
  // Curated pros without a published profile (keep them searchable too).
  for (const a of athletes) {
    const canonical = CURATED_TO_CANONICAL[a.slug] ?? a.slug;
    if (indexedCanonical.has(canonical)) continue;
    docs.push({
      group: "Athletes",
      title: a.name,
      meta: `#${a.bestRank} · ${a.divisions.join(" · ")}`,
      href: `/athletes/${a.slug}`,
      haystack: blob(a.name, a.country, a.divisions.join(" "), a.tagline, "athlete pro player"),
    });
  }

  for (const p of tourPrograms) {
    docs.push({
      group: "Programs",
      title: p.label,
      meta: p.headline,
      href: `/tour/${p.slug}`,
      haystack: blob(p.label, p.eyebrow, p.headline, p.body.join(" ")),
    });
  }

  for (const n of [...news, ...ecosystemNews]) {
    docs.push({
      group: "News",
      title: n.title,
      meta: `${n.category} · ${n.date}`,
      href: n.href,
      external: n.href.startsWith("http"),
      haystack: blob(n.title, n.category, "news article"),
    });
  }

  for (const p of STATIC_PAGES) {
    docs.push({
      group: "Pages",
      title: p.title,
      meta: p.meta,
      href: p.href,
      haystack: blob(p.title, p.meta),
    });
  }

  return docs;
}

const INDEX = buildIndex();

/**
 * Every whitespace-separated term must match the doc; results are ranked by
 * how prominently the terms hit the title.
 */
export function searchSite(query: string): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);

  return INDEX.flatMap((doc) => {
    const title = doc.title.toLowerCase();
    let score = 0;
    for (const term of terms) {
      // Fall back to the singular so "nationals" hits "National Championships".
      const singular =
        term.length > 3 && term.endsWith("s") ? term.slice(0, -1) : term;
      const hit = doc.haystack.includes(term)
        ? term
        : doc.haystack.includes(singular)
          ? singular
          : null;
      if (!hit) return [];
      if (title.startsWith(hit)) score += 3;
      else if (title.includes(hit)) score += 2;
      else score += 1;
    }
    return [{ doc, score }];
  })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.doc);
}
