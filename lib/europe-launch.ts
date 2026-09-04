/**
 * Whether PPA Tour Europe is publicly launched.
 *
 * `false` = BUILT BUT UNLISTED. The routes are live and anyone holding the link
 * sees the finished page — that is the point, it is how Payton, Catie, Chris and
 * Smash review it — but nothing on ppatour.com links to it and no crawler
 * indexes it. Bryce, 9/4: *"I want them to be able to see it, but not be live
 * for everyone yet."*
 *
 * **Launching is this one line.** Flip it to `true` and the nav item, the footer
 * link, site search, the sitemap entries and the indexable robots directives all
 * come back together. Nothing else needs touching, which is the whole reason the
 * flag exists rather than five commented-out lines in five files.
 *
 * ⚠ THIS FILE IMPORTS NOTHING, AND THAT IS LOAD-BEARING. `Header.tsx` is a
 * client component, so anything this module pulls in ships to every browser on
 * every page. The first draft imported `europeRoster` and `published-athletes`
 * (a 179-profile JSON) for the helper that now lives in ./europe-visibility.ts.
 * Same split as `lib/score-names.ts` beside `lib/score-headshots.ts`. **Keep
 * this file dependency-free.**
 *
 * ⚠ THIS IS NOT A PASSWORD AND MUST NOT BE DESCRIBED AS ONE. An unlisted page is
 * reachable by anyone who guesses or is forwarded the URL. It is the right weight
 * for a page whose content is a public tour's schedule and roster; it would be
 * the wrong weight for anything commercially sensitive. If Europe ever needs a
 * real gate before launch, that is HTTP Basic auth in a `proxy.ts`, not this.
 *
 * ⚠ AND IT DELIBERATELY DOES NOT ADD A robots.txt `Disallow`. Blocking the crawl
 * would stop Google reading the `noindex` it is meant to obey, and a URL that is
 * disallowed but linked from somewhere external can still surface as a bare,
 * contentless result. Noindex WITH crawling allowed is the state that actually
 * keeps a page out of the index.
 */
export const EUROPE_PUBLIC = false;

/** Metadata `robots` value for a Europe surface. Indexable only once launched. */
export const europeRobots = EUROPE_PUBLIC
  ? undefined
  : { index: false, follow: false };
