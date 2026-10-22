/**
 * Which sponsors back a SPECIFIC tour stop.
 *
 * ⚠ THIS EXISTS BECAUSE THE EVENT PAGE USED TO SHOW THE WHOLE TOUR ROSTER.
 * Every event page rendered all 30 site-wide partners, which is right for
 * "who backs the PPA Tour" and wrong for "who backs this event" — it credited
 * partners who bought nothing at this stop, and it left out the local sponsors
 * who did (Bryan Renahan, 8/27). `EventSponsors` now renders this list where a
 * stop has one, and falls back to the tour roster where it does not.
 *
 * ⚠ A STOP'S LIST IS EXHAUSTIVE. Naming a stop here removes every partner not
 * named — that is the point of the feature, so adding a stop means getting the
 * full list from the event team, not a partial one.
 *
 * Two kinds of entry:
 *   • a STRING — the display name of a partner already on the tour roster in
 *     `lib/home-content.ts`, whose logo, link and designation are reused. One
 *     source for a tour partner's mark, so a logo refresh reaches every stop.
 *   • an OBJECT — a sponsor that exists only at this event (a host city, a
 *     regional sports authority, a local brand). These deliberately do NOT go
 *     on the tour roster: they are not PPA Tour partners and would otherwise
 *     appear in the footer, the homepage marquee and every other event page.
 */
import { partnerByDisplayName, type Partner } from "@/lib/home-content";

export type LocalSponsor = {
  name: string;
  /** Optional — a sponsor with no mark yet renders as a name card. */
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  website?: string;
  /** Shown under the mark, e.g. "Host City". Omit rather than invent one. */
  role?: string;
};

export type EventSponsorRef = string | LocalSponsor;

const EVENT_SPONSORS_BY_SLUG: Record<string, EventSponsorRef[]> = {
  /**
   * Nationals / Cary — Bryan Renahan's approved list, 8/27, in his order.
   * Twelve sponsors; everything else on the tour roster is deliberately off
   * this page.
   *
   * ⚠ ASTRAZENECA WAS ON BRYAN'S LIST AND WAS REMOVED 9/4/26, at marketing's
   * request, along with the roster record itself — see the tombstone in
   * `lib/home-content.ts`. It is a deliberate absence, not a transcription miss
   * against his list. Do not re-add it from that list without marketing.
   * ⚠ The hero's "presented by Fasenra" credit is a different fact and stays.
   *
   * ⚠ THE THREE LOCAL MARKS WERE RECOVERED FROM PRINT FILES — the .eps preview
   * and the .ai's PDF stream. How, and the one that is under-resolution, is
   * written up on their jobs in scripts/import-sponsor-logos.mjs. GRSA's is
   * only 328px and should be replaced when Delaney or Jason sends a real
   * PNG/SVG; the other two are full quality.
   *
   * ⚠ "Town of Cary", NOT "City of Cary". The request says City; Cary is
   * legally a TOWN and the supplied file is named TOC_Logo (Town of Cary).
   * Printing "City of Cary" beside a mark that reads "Town of Cary" is wrong
   * on the host municipality's own name, at their own event. Confirm with
   * Bryan, but the file wins until he says otherwise.
   */
  "veolia-pickleball-national-championships": [
    "Veolia",
    "Carvana",
    {
      name: "Dominator",
      website: "https://dominatorpickleball.com",
      logo: "/ppa/sponsors/dominator.png",
      logoWidth: 900,
      logoHeight: 92,
    },
    "LT Pro 48",
    {
      name: "Greater Raleigh Sports Alliance",
      website: "https://www.raleighsports.org",
      role: "Host Region",
      // ⚠ 328px wide, not the 900 the others ship at — it is the preview
      // extracted from their EPS (see the importer). Fine at card size, soft
      // on a 3x phone. Swap when a real PNG/SVG arrives.
      logo: "/ppa/sponsors/greater-raleigh-sports-alliance.png",
      logoWidth: 328,
      logoHeight: 121,
    },
    {
      name: "City of Cary",
      website: "https://www.carync.gov",
      role: "Host City",
      // The mark itself reads only "CARY" — it settles neither City nor Town.
      logo: "/ppa/sponsors/city-of-cary.png",
      logoWidth: 900,
      logoHeight: 260,
    },
    "Humana",
    "Joma",
    "Proton",
    // Bryan wrote "MOJO"; the roster name is the full one and nothing matches
    // the short form — it would have been dropped silently.
    "MOJO Energy Pouches",
    "Rate",
    "Zimmer Biomet",
  ],

  /**
   * Las Vegas — the event team's "logos activating at Las Vegas" pack, sent by
   * Wesley 9/24 with the NC list named as the model. Eleven marks; everything
   * else on the tour roster is deliberately off this page.
   *
   * ⚠ RATE AND JOOLA ALSO RENDER ABOVE THIS GRID AND ARE NOT DUPLICATES OF IT.
   * The section's marquee is built from the event record, not from this list:
   * Rate is the title partner (its `eventNamePrefix` matches "Rate Las Vegas
   * Open") and JOOLA is the presenting partner (`PRESENTER_BY_SLUG`). Both keep
   * that billing untouched. Rate is in this list as well because it is in the
   * pack and because Nationals does the same with Veolia — a stop's own title
   * partner leads its wall.
   *
   * ⚠ CARVANA IS IN THIS LIST FOR A REASON THAT IS EASY TO UNDO BY ACCIDENT.
   * Until a stop has an entry here the section falls back to `PartnerWall`,
   * which gives the tour's title partner its own wide hero card above the grid.
   * Naming this stop replaces that whole wall — so leaving Carvana out would
   * have taken the tour title partner off the page altogether, which is not
   * what "Carvana is good as is" meant. It is a grid tile here, exactly as at
   * Nationals. Restoring the hero on a stop that has its own list is a change
   * to `EventSponsors`, not to this file.
   *
   * ⚠ TWO ENTRIES ARE OBJECTS BECAUSE NEITHER IS ON THE TOUR ROSTER, and a
   * string that matches no partner is dropped silently rather than rendered:
   *
   *  • SHARP has never been on it. No designation came with the pack, so it
   *    carries no `role` — inventing one puts words in a sponsor's mouth on
   *    their own card. The destination was checked rather than assumed: Sharp
   *    Electronics' US home page, canonical https://www.sharpusa.com ("Sharp
   *    USA delivers reliable technology for businesses and homes").
   *  • Picklebalm came OFF the roster with the 8/4 approved list; its tombstone
   *    is in lib/home-content.ts. It is activating here, so it is named here.
   *    ⚠ Do NOT "fix" this by putting Picklebalm back on the tour roster —
   *    that republishes it in the footer, the homepage marquee and every other
   *    event page, which is marketing's call and not this task's.
   */
  "rate-las-vegas-open": [
    "Rate",
    "Carvana",
    {
      name: "Sharp",
      website: "https://www.sharpusa.com",
      logo: "/ppa/sponsors/sharp.png",
      logoWidth: 900,
      logoHeight: 134,
    },
    "Zimmer Biomet",
    "Humana",
    "Six Zero",
    "Joma",
    "Mineragua",
    {
      name: "Picklebalm",
      website: "https://picklebalm.com/",
      logo: "/ppa/sponsors/picklebalm.png",
      logoWidth: 900,
      logoHeight: 201,
    },
    "Ensure Max Protein",
    // The pack's file reads "MOJO ENERGY POUCHES"; the roster name is the full
    // one, and a short "MOJO" would resolve to nothing and be dropped — the
    // same trap Bryan's Nationals list set.
    "MOJO Energy Pouches",
  ],
};

/** What the section actually renders: a resolved mark plus where it links. */
export type ResolvedEventSponsor = {
  name: string;
  role?: string;
  website?: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
};

function fromPartner(p: Partner): ResolvedEventSponsor {
  return {
    name: p.name,
    role: p.hideRole ? undefined : p.role,
    website: p.website,
    logo: p.logo,
    logoWidth: p.logoWidth,
    logoHeight: p.logoHeight,
  };
}

/**
 * This stop's sponsors, or null to fall back to the tour-wide roster.
 *
 * ⚠ A NAME THAT MATCHES NO ROSTER PARTNER IS DROPPED, not rendered blank. A
 * typo'd or retired partner name would otherwise publish an empty card on a
 * sponsor wall, which is worse than a shorter wall.
 */
export function eventSponsorsFor(slug: string): ResolvedEventSponsor[] | null {
  const refs = EVENT_SPONSORS_BY_SLUG[slug];
  if (!refs?.length) return null;
  const resolved = refs
    .map((ref) => {
      if (typeof ref !== "string") return ref as ResolvedEventSponsor;
      const partner = partnerByDisplayName(ref);
      return partner ? fromPartner(partner) : null;
    })
    .filter((s): s is ResolvedEventSponsor => s !== null);
  return resolved.length ? resolved : null;
}
