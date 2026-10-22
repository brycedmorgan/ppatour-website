/**
 * GET /news-sitemap.xml — the Google News sitemap (docs/SEO.md, Phase 1 item 13).
 *
 * Google News only reads articles published in the last 48 hours from a news
 * sitemap, and rejects one with more than 1,000 URLs; the newsroom publishes a
 * few times a week, so this is usually a handful of entries and often empty.
 * An empty `<urlset>` is valid and is what Google expects on a quiet day —
 * do not 404 it or list older posts to "fill" it. The main sitemap.xml still
 * carries every article with `lastmod`.
 *
 * Newsroom posts only (`rootNews`) — the /ppa-blog evergreen how-tos are not
 * news and would be rejected by Publisher Center.
 *
 * Listed in robots.ts as a second Sitemap line; submit it in Search Console
 * once, and again to Publisher Center when the tour applies.
 */
import { rootNews } from "@/lib/news";
import { SITE_URL } from "@/lib/site";

/** Re-read hourly; a new post is picked up on the next fetch. */
export const revalidate = 3600;

const WINDOW_MS = 48 * 60 * 60 * 1000;
const PUBLICATION = "Carvana PPA Tour";

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * WordPress stamps are timezone-less local time ("2026-09-22T14:05:00") and
 * native articles are noon local; treat both as UTC. Google wants W3C
 * datetime with a zone, so the `Z` is added when the stamp has none.
 */
function w3cDate(iso: string): string {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
}

export async function GET() {
  const cutoff = Date.now() - WINDOW_MS;
  const recent = rootNews().filter((n) => {
    const t = Date.parse(w3cDate(n.publishedAt));
    return Number.isFinite(t) && t >= cutoff && t <= Date.now() + 60_000;
  });

  const urls = recent
    .map(
      (n) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${n.href}/`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(w3cDate(n.publishedAt))}</news:publication_date>
      <news:title>${escapeXml(n.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
