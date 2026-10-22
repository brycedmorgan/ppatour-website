/**
 * Dataset + ItemList JSON-LD for the two standings pages (docs/SEO.md, Phase 1
 * item 9). /rankings ranks #1 for "pickleball rankings" with no structured
 * data at all; this describes the board as a dataset the tour publishes and
 * lists the top ten of each board as ranked ListItems that point at the
 * athlete pages — the same links the table renders.
 *
 * One builder for both pages so the Dataset node cannot describe itself two
 * different ways.
 */
import type { RankingEntry } from "@/lib/rankings-api";
import { SITE_URL } from "@/lib/site";

const CREATOR = {
  "@type": "SportsOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: "Carvana PPA Tour",
  url: SITE_URL,
};

export const RANKINGS_DATASET_ID = `${SITE_URL}/rankings/#dataset`;

const absolute = (u: string) => (u.startsWith("/") ? `${SITE_URL}${u}` : u);

/** Ranked ListItems for one board. `entries` should already be rank-ordered. */
export function rankingItemList(
  boardLabel: string,
  entries: RankingEntry[],
  url: string,
  limit = 10,
) {
  return {
    "@type": "ItemList",
    name: `World Pickleball Rankings — ${boardLabel}, Top ${limit}`,
    url,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: Math.min(limit, entries.length),
    itemListElement: entries.slice(0, limit).map((e, i) => ({
      "@type": "ListItem",
      position: e.rank || i + 1,
      name: e.name,
      url: absolute(e.profileUrl),
    })),
  };
}

export function buildRankingsJsonLd(opts: {
  /** Page URL, absolute. */
  url: string;
  name: string;
  description: string;
  /** yyyy-mm-dd the board was taken. */
  dateModified: string;
  /** One list per board (men, women). */
  boards: { label: string; entries: RankingEntry[] }[];
}) {
  const lists = opts.boards
    .filter((b) => b.entries.length > 0)
    .map((b) => rankingItemList(b.label, b.entries, opts.url));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": RANKINGS_DATASET_ID,
        name: opts.name,
        description: opts.description,
        url: opts.url,
        creator: CREATOR,
        publisher: CREATOR,
        dateModified: opts.dateModified,
        isAccessibleForFree: true,
        license: `${SITE_URL}/about/terms/`,
        keywords: ["pickleball rankings", "World Pickleball Rankings", "PPA Tour", "WPR"],
        temporalCoverage: "P52W",
        ...(lists.length ? { hasPart: lists } : {}),
      },
    ],
  };
}
