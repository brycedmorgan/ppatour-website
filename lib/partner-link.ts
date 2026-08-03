import type { Partner } from "@/lib/home-content";
import { withUtm } from "@/lib/utm";

/**
 * Where a partner card sends a fan, and whether it leaves the site.
 *
 * Shared by the partner wall (homepage + every event page) and the Category
 * Leaders grid on /about/sponsors. It lived inside PartnerWall until 8/3, which
 * is why the sponsors page — the one page a brand is most likely to be sent —
 * rendered its logos as plain divs that linked nowhere at all.
 *
 * Every partner carries a `website` as of 8/3, so the internal fallback is now
 * unreachable in practice. It stays because the roster is edited by hand and a
 * new partner may land before their URL is confirmed: better they route to our
 * own sponsor directory than to a guessed destination.
 */
export function partnerLink(p: Partner): { href: string; external: boolean } {
  if (p.website) {
    return {
      href: withUtm(p.website, {
        campaign: "sponsor-directory",
        content: `partner-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      }),
      external: true,
    };
  }
  return { href: "/about/sponsors", external: false };
}
