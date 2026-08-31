/**
 * One on-site happening to feature under "At the Venue" — a pro-am, a fan
 * fest, a watch party — pointing at the article that announces it.
 *
 * ⚠ THE COPY LIVES IN THE ARTICLE, NOT HERE. A spotlight names an article
 * slug and nothing else; the headline, blurb and thumbnail are read back out
 * of `lib/news-articles.ts` at render. Re-typing the description here would
 * give the same event two wordings that drift the moment comms revises one —
 * and comms revises the article, never this file.
 *
 * ⚠ CURATED PER STOP, because the alternative is worse. Every article tagged
 * with an `eventSlug` already surfaces under Coverage on its event page; a
 * spotlight is an editorial choice that ONE of them is worth a promo block
 * above the fold of the venue section. Deriving it (say, "the newest tagged
 * article") would rotate a recap into the slot the week after the event.
 */
import { getArticle, type NewsArticle } from "@/lib/news-articles";

export type EventSpotlight = {
  /** Slug in lib/news-articles.ts. Missing or draft → nothing renders. */
  articleSlug: string;
  /** Small label above the headline. Defaults to "Don't Miss". */
  eyebrow?: string;
  /** Link text. Defaults to "Read more". */
  cta?: string;
};

const SPOTLIGHT_BY_SLUG: Record<string, EventSpotlight> = {
  "veolia-pickleball-national-championships": {
    articleSlug: "canes-and-the-cup-pro-am",
    eyebrow: "Don't Miss",
    cta: "Full Details",
  },
};

export type ResolvedSpotlight = {
  article: NewsArticle;
  href: string;
  eyebrow: string;
  cta: string;
  /**
   * The happening's OWN ticket listing, lifted from the article's `ctaUrl` —
   * so the spotlight and the article footer sell the same thing and there is
   * no second URL to keep in step.
   *
   * ⚠ Comes through CLEAN, and the caller must run it through `withUtm`. The
   * article stores it untagged for exactly this reason: a pre-tagged link
   * reused in a second placement reports both clicks as the first one.
   *
   * Undefined when the article has no ticket link, and the spotlight then
   * renders the details button alone rather than a dead second button.
   */
  ticketUrl?: string;
  ticketLabel: string;
};

/**
 * The featured happening for a stop, or null.
 *
 * ⚠ Resolves through `getArticle`, which only returns PUBLISHED articles — so
 * a spotlight pointing at a draft, or at a slug that has been renamed or
 * pulled, renders nothing rather than a dead card. Null is the normal case.
 */
export function spotlightFor(slug: string): ResolvedSpotlight | null {
  const entry = SPOTLIGHT_BY_SLUG[slug];
  if (!entry) return null;
  const article = getArticle(entry.articleSlug);
  if (!article) return null;
  return {
    article,
    // Native articles serve from the root, not under /news.
    href: `/${article.slug}`,
    eyebrow: entry.eyebrow ?? "Don't Miss",
    cta: entry.cta ?? "Read more",
    ticketUrl: article.ctaUrl,
    ticketLabel: article.ctaLabel ?? "Get Tickets",
  };
}
