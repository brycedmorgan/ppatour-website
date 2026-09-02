/**
 * The one on-site happening worth interrupting a visitor for — rendered as a
 * dismissible modal on the homepage and on its own event page.
 *
 * ⚠ ONE PROMO AT A TIME, BY DESIGN. `ACTIVE_PROMO` is a single record, not a
 * list, because two modals racing for the same first-visit moment is how a
 * popup stops being read at all. Retiring one is setting this to `null`;
 * replacing one is editing it in place.
 *
 * ⚠ THE COPY LIVES IN THE ARTICLE, NOT HERE — same rule as
 * `lib/event-spotlight.ts`. A promo names an article slug; the headline, the
 * date line, the ticket URL and its label are all read back out of
 * `lib/news-articles.ts` at render. Re-typing them here would give the same
 * event two wordings that drift the moment comms revises one, and comms
 * revises the article.
 *
 * ⚠ THE IMAGE IS THE ONE THING THAT IS *NOT* THE ARTICLE'S. The article hero
 * is a 16:9 crop of the key art; a modal wants the square cut, where the
 * "STANLEY CUP CHAMPIONS" and "CARVANA PPA TOUR" marks along the foot are
 * actually inside the frame. Supplied art, not a crop we derived — the same
 * rule the heroes and the parking maps are under.
 */
import { getArticle } from "@/lib/news-articles";
import { tournaments } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

type PromoConfig = {
  /** Dismissal key + UTM label. Change it and every visitor sees the promo again. */
  id: string;
  /** Slug in lib/news-articles.ts. Missing or draft → nothing renders. */
  articleSlug: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  /**
   * When the promo stops showing, as an ISO instant WITH AN EXPLICIT OFFSET.
   *
   * ⚠ The offset is not optional pedantry. A bare `2026-09-03T21:00` is parsed
   * against the *viewer's* zone, so a fan in Los Angeles would keep getting a
   * popup for a pro-am that finished three hours earlier. This is a fixed
   * moment in Cary, and it is written as one.
   */
  endsAt: string;
  /**
   * The stop it belongs to. Drives the UTM campaign only — the modal is a
   * homepage placement, so this does not gate where it renders.
   */
  eventSlug: string;
  /** Small label above the date line — context the key art doesn't give. */
  eyebrow: string;
  /**
   * Overrides the article's own `ctaLabel` on the MODAL ONLY.
   *
   * ⚠ This is the one deliberate exception to "the copy lives in the article",
   * so it needs a reason. The article's label is "Get Canes Night Tickets",
   * which is right on the article page — that button can appear a long scroll
   * away from anything naming the event. In the modal it sits directly under
   * key art reading CANES & THE CUP · PICKLEBALL PRO-AM, so the event name is
   * said twice and the button wraps to two lines to do it. Omit this and the
   * article's label is used, which stays the default.
   */
  ticketLabel?: string;
  /**
   * Overrides the article's `subtitle` as the modal's date line.
   *
   * ⚠ Second scoped exception, same shape as `ticketLabel` and same reason:
   * the article's standfirst carries the venue ("… at Cary Tennis Park")
   * because a reader can arrive there from anywhere. In the modal the eyebrow
   * directly above already names the tournament, and on the event page the
   * venue is the page. Omit this and the article's subtitle is used.
   */
  headline?: string;
};

const ACTIVE_PROMO: PromoConfig | null = {
  id: "canes-and-the-cup-pro-am",
  articleSlug: "canes-and-the-cup-pro-am",
  /* The 1:1 cut of the same key art, reissued 9/2 with Jalen Chatfield in
     Cam Ward's place. ⚠ THE FILENAME CARRIES A VERSION, AND IT IS NOT COSMETIC. The
     first pass overwrote the original file in place; the URL never changed,
     so the optimizer served the CACHED first-cut bytes and the modal kept
     publishing Cam Ward — reproduced locally with the new file on disk. The
     optimized variant is cached against the URL, so a same-name replacement
     can keep serving the superseded roster for as long as the TTL holds. A
     new name is a new cache key. Version it again on the next reissue. */
  image: "/ppa/promos/canes-and-the-cup-pro-am-square-v2.jpg",
  imageWidth: 1080,
  imageHeight: 1080,
  // 9 p.m. ET on the night itself — the promo dies when the Pro-Am ends, not
  // when Nationals does. Sept 3 2026 is EDT, hence -04:00.
  endsAt: "2026-09-03T21:00:00-04:00",
  eventSlug: "veolia-pickleball-national-championships",
  eyebrow: "Veolia Pickleball National Championships",
  ticketLabel: "Buy Tickets",
  headline: "Thursday, Sept. 3, 6-9 p.m.",
};

export type ResolvedPromo = {
  id: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** The article headline — the modal's accessible name, since the art carries the words. */
  alt: string;
  eyebrow: string;
  /** The when-and-where line. The key art already says what it is. */
  headline: string;
  /** The announcement article. Native articles serve from the root, not /news. */
  href: string;
  /** Tagged here — see below. Undefined → the modal shows details alone. */
  ticketUrl?: string;
  ticketLabel: string;
  endsAt: string;
};

/** The homepage promo, or null. Null is the normal case between promos. */
export function homePromo(): ResolvedPromo | null {
  const cfg = ACTIVE_PROMO;
  if (!cfg) return null;

  // Only PUBLISHED articles come back, so a promo pointing at a draft, a
  // renamed slug or a pulled story renders nothing rather than a dead card.
  const article = getArticle(cfg.articleSlug);
  if (!article) return null;

  /**
   * ⚠ THE UTMs ARE STAMPED HERE, AND THE CAMPAIGN IS THE STOP'S EVENT CODE.
   *
   * The article stores `ctaUrl` clean precisely so each placement can tag it
   * (a pre-tagged link reused in a second placement reports both clicks as the
   * first one). The campaign is the stop's own `MMYY-PPA-CITY-ST-USA` code,
   * which is what Jackalope joins marketing data on, and `utm_content` names
   * the placement so this popup stays separable from the event page's
   * spotlight block, which sells the same night.
   */
  const campaign =
    tournaments.find((t) => t.slug === cfg.eventSlug)?.eventCode ?? cfg.eventSlug;
  const content = `home-promo-${cfg.id}`;

  return {
    id: cfg.id,
    image: cfg.image,
    imageWidth: cfg.imageWidth,
    imageHeight: cfg.imageHeight,
    alt: article.title,
    eyebrow: cfg.eyebrow,
    // Comms' own logistics line, unless the promo trims it — see `headline`
    // on the config. The dek falls back for an article without a subtitle.
    headline: cfg.headline ?? article.subtitle ?? article.dek,
    href: `/${article.slug}`,
    ticketUrl: article.ctaUrl
      ? withUtm(article.ctaUrl, { campaign, content })
      : undefined,
    ticketLabel: cfg.ticketLabel ?? article.ctaLabel ?? "Get Tickets",
    endsAt: cfg.endsAt,
  };
}
