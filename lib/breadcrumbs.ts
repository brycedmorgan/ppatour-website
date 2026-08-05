import { SITE_URL } from "@/lib/site";

/**
 * BreadcrumbList JSON-LD. Gives Google (and AI answer engines building a site
 * map) the hierarchy of a nested page, which powers the breadcrumb rich result
 * and helps a page be understood as "an event under /events", "a pro under
 * /athletes" rather than a loose URL.
 *
 * Pass paths root-first, INCLUDING the current page as the last item. Paths are
 * site-relative (e.g. "/events/") and resolved against SITE_URL.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
