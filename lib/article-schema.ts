/**
 * The one place the article JSON-LD is built — `NewsArticle` for the newsroom
 * (the 811 migrated posts + native articles at the root) and `BlogPosting` for
 * the 39 evergreen posts under /ppa-blog/. Same shape as `buildEventJsonLd`:
 * one builder, called from the one component (ArticleView) both routes render,
 * so the two archives cannot drift.
 *
 * The 9/23 crawl found no Article schema on any of the 859 posts — the single
 * biggest structured-data gap on the site, and the prerequisite for Top Stories
 * and Google Publisher Center (docs/SEO.md, Phase 1 items 1–2).
 *
 * Every field is a fact the page already renders, from the same NewsDetail:
 *   - headline / description / image / datePublished / author from the card;
 *   - dateModified from WordPress's own `modifiedAt` when the post has one and
 *     it is not before publication, otherwise the publish date (Google wants
 *     the field present; a modified date earlier than publish is a data bug);
 *   - publisher is the site-wide organisation node, referenced by name and
 *     logo (Google requires `publisher.logo` for article rich results, so it
 *     is inlined rather than an `@id` reference).
 */
import type { NewsDetail } from "@/lib/news";
import { SITE_URL } from "@/lib/site";

/** Bylines that mean "the tour wrote this", not a named person. */
const HOUSE_BYLINES = new Set(["ppa tour", "carvana ppa tour", "ppa tour staff", "ppa", "staff"]);

const PUBLISHER = {
  "@type": "Organization",
  name: "Carvana PPA Tour",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/ppa/logos/ppa-horizontal-white.png`,
  },
};

/** Site-relative paths become absolute; already-absolute URLs pass through. */
function absolute(url: string): string {
  return url.startsWith("/") ? `${SITE_URL}${url}` : url;
}

function author(name: string) {
  const clean = name.trim();
  if (!clean || HOUSE_BYLINES.has(clean.toLowerCase())) {
    return { "@type": "Organization", name: "PPA Tour", url: SITE_URL };
  }
  return { "@type": "Person", name: clean };
}

/**
 * The later of publish and modified. WordPress stamps are timezone-less
 * ("2023-07-11T18:47:47"), so compare as strings — both come from the same
 * WP clock and the ISO layout sorts lexically.
 */
function modifiedDate(detail: NewsDetail): string {
  const published = detail.card.publishedAt;
  if (detail.source !== "wordpress") return published;
  const modified = detail.post.modifiedAt?.trim();
  return modified && modified >= published ? modified : published;
}

export function buildArticleJsonLd(detail: NewsDetail) {
  const { card } = detail;
  const url = `${SITE_URL}${card.href}/`;
  const isBlog = card.postType === "ppa-blog";
  return {
    "@context": "https://schema.org",
    "@type": isBlog ? "BlogPosting" : "NewsArticle",
    headline: card.title,
    ...(card.dek ? { description: card.dek } : {}),
    ...(card.image ? { image: [absolute(card.image)] } : {}),
    datePublished: card.publishedAt,
    dateModified: modifiedDate(detail),
    author: author(card.author),
    publisher: PUBLISHER,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(card.category ? { articleSection: card.category } : {}),
    inLanguage: "en",
    isAccessibleForFree: true,
  };
}
