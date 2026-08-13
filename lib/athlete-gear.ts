/**
 * Athlete gear → official-partner shop link (Connor, 7/23: player profiles
 * need a "link to gear", and we only promote official partners).
 *
 * We take the player's paddle string (from the published quick-info) and, when
 * the brand is an OFFICIAL PPA Tour partner we hold a site for (JOOLA, Six
 * Zero, Proton, …), return a UTM-tagged link straight to that partner's shop.
 *
 * Note this reads the live `partners` roster, so it self-corrects: when Selkirk
 * came off the roster on 8/3, the ~15 athletes on Selkirk paddles stopped
 * showing "Official Partner of the PPA Tour" beside their paddle — which is the
 * right outcome, not a regression. Don't hardcode brand lists here.
 * Any other brand still shows the paddle name, but the CTA points to the tour's
 * official-partner directory instead of a competitor's store — never sending a
 * fan (or Braydn's sell-through) to gear we don't rep.
 */
import { partners } from "@/lib/home-content";
import { paddleTerm } from "@/lib/paddle-images";
import { pbcDestination } from "@/lib/pbc-links";
import { withUtm } from "@/lib/utm";

export type GearLink = {
  /** The paddle exactly as we display it (e.g. "JOOLA Perseus 3"). */
  paddle: string;
  /** Matched official-partner brand, or null when it isn't one of ours. */
  brand: string | null;
  /** Where "Shop the gear" points. Always Pickleball Central — see below. */
  href: string;
  /** true = official partner's own shop; false = our sponsor directory. */
  external: boolean;
  /** The matched partner's own store. NOT linked today (Connor, 7/29) — kept so
   *  the brand-store CTA is a one-line restore when he reverses the call. */
  brandHref: string | null;
  /** This exact paddle on Pickleball Central — "buy the same paddle as your
   *  favorite pro" (Conner Ogden, 7/27). Always set; PBC is our retail
   *  partner, so it's a valid destination for every paddle on the roster. */
  pbcHref: string;
};

/**
 * The buy destination for a paddle. `pinnedUrl` (an exact product page set per
 * player in Jackalope) wins over everything.
 *
 * ⚠ THIS NO LONGER FALLS BACK TO `search.php?search_query=`, AND MUST NOT AGAIN.
 * That route renders an EMPTY page on PBC's storefront — header, nothing,
 * footer — for every query tried, so "Buy This Paddle" was a dead end for the
 * 110 of 127 pros with no pinned URL. It answers 200 with the products sitting
 * in a Searchanise JSON blob, so a status check calls it healthy and only a
 * browser shows that nothing paints. `lib/pbc-links.ts` owns the replacement
 * ladder, and every page it can return has been loaded and confirmed to render
 * products with prices.
 *
 * `content` carries the UTM placement — per-player (`paddle:<slug>`) when we know the
 * slug, so PBC's Shopify/GA4 (and our own GA4 partner_click) can attribute the click
 * to a specific pro; a static fallback otherwise.
 *
 * ⚠ A PINNED URL IS NOT ALWAYS PICKLEBALL CENTRAL, despite the field names. PBC
 * does not carry every paddle on the roster (MEHAU, 8/13), and a PBC search that
 * returns no product is a buy button that finds nothing — so a brand's own
 * product page is allowed here. Two consequences: nothing visible says
 * "Pickleball Central" (the button reads "Buy This Paddle"), and the click is
 * NOT counted as a `partner_click`, because only partner hosts are tracked
 * (components/global/OutboundClickTracker.tsx) and these brands aren't partners.
 */
function pbcLink(
  paddle: string,
  content: string,
  opts?: { brand?: string | null; slug?: string | null; pinnedUrl?: string | null },
): string {
  const base = pbcDestination(paddle, opts?.brand, opts?.slug, opts?.pinnedUrl);
  // `term` = the paddle model, so the brand can count clicks per PADDLE across
  // every player who plays it. `content` stays per-player, which is the cut we
  // read. Both travel on the same link; neither replaces the other.
  return withUtm(base, { campaign: "athlete-gear", content, term: paddleTerm(paddle) });
}

/**
 * @param paddle     what we display, verbatim from the broadcast masterlist
 * @param searchTerm what to look up at Pickleball Central, when it differs from
 *                   the display string (one pro is listed with two paddles in a
 *                   single cell, and searching for both finds no product).
 * @param opts.slug      the player's slug — makes the PBC click per-player-attributable,
 *                       and picks the right product for a signature colourway
 * @param opts.brand     the manufacturer on its own, when we have it
 * @param opts.pbcUrl    a pinned exact product URL (Jackalope override, or a
 *                       pending paddle update) — wins over the PBC search. Named
 *                       for the feed's own field; it may be a brand store when
 *                       PBC doesn't carry the paddle. See `pbcLink`.
 */
export function resolveGear(
  paddle: string | null | undefined,
  searchTerm?: string | null,
  opts?: { slug?: string; brand?: string | null; pbcUrl?: string | null },
): GearLink | null {
  if (!paddle || !paddle.trim()) return null;
  const lc = paddle.toLowerCase();
  const query = searchTerm?.trim() || paddle;
  const pbcContent = opts?.slug ? `paddle:${opts.slug}` : "paddle-pickleball-central";
  const pbcSearch = (q: string) =>
    pbcLink(q, pbcContent, { brand: opts?.brand, slug: opts?.slug, pinnedUrl: opts?.pbcUrl });

  // Match the paddle brand to an official partner we can send traffic to.
  const partner = partners.find(
    (p) => p.website && lc.includes(p.name.toLowerCase()),
  );

  if (partner?.website) {
    const contentSlug = partner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      paddle,
      brand: partner.name,
      // Connor 7/29: "make sure on player profiles that it's always linking to
      // Pickleball Central for now, not directly to the manufacturers" — Ben
      // Johns' paddle was sending fans to joola.com. PBC is our retail partner
      // and every one of these paddles is sold there.
      href: pbcSearch(query),
      external: true,
      brandHref: withUtm(partner.website, {
        campaign: "athlete-gear",
        content: `paddle-${contentSlug}`,
      }),
      pbcHref: pbcSearch(query),
    };
  }

  // Not an official partner brand: the primary CTA becomes Pickleball Central
  // — our own retail partner — rather than the sponsor directory, which was a
  // dead end for someone trying to buy a paddle (Conner Ogden, 7/27).
  return {
    paddle,
    brand: null,
    href: pbcSearch(query),
    external: true,
    brandHref: null,
    pbcHref: pbcSearch(query),
  };
}
