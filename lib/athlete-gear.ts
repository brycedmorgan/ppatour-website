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

/** Pickleball Central product search for a paddle (BigCommerce search route). */
function pbcSearch(paddle: string): string {
  return withUtm(
    `https://www.pickleballcentral.com/search.php?search_query=${encodeURIComponent(paddle)}`,
    { campaign: "athlete-gear", content: "paddle-pickleball-central" },
  );
}

export function resolveGear(paddle: string | null | undefined): GearLink | null {
  if (!paddle || !paddle.trim()) return null;
  const lc = paddle.toLowerCase();

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
      href: pbcSearch(paddle),
      external: true,
      brandHref: withUtm(partner.website, {
        campaign: "athlete-gear",
        content: `paddle-${contentSlug}`,
      }),
      pbcHref: pbcSearch(paddle),
    };
  }

  // Not an official partner brand: the primary CTA becomes Pickleball Central
  // — our own retail partner — rather than the sponsor directory, which was a
  // dead end for someone trying to buy a paddle (Conner Ogden, 7/27).
  return {
    paddle,
    brand: null,
    href: pbcSearch(paddle),
    external: true,
    brandHref: null,
    pbcHref: pbcSearch(paddle),
  };
}
