/**
 * Extended-tour programs surfaced under /tour/[slug]. Catch-all looks up
 * the slug here and renders a rich page if present; otherwise falls back
 * to a ComingSoon. Copy + CTA targets are placeholder for the demo.
 */

export type TourProgram = {
  slug: string;
  label: string;
  eyebrow: string;
  headline: string;
  /** Optional distinct heading for the About section; falls back to `headline`.
   *  When set, the About body skips body[0] (already shown in the hero). */
  sectionHeadline?: string;
  body: string[];
  bullets: { title: string; detail: string }[];
  cta: { label: string; href: string; external?: boolean };
  image: string;
};

const REGISTER = "https://www.pickleballtournaments.com/";
/** PPA-sanctioned event search — where an amateur/junior actually registers.
 *  Dave Rogers 7/27: "register a junior player takes you to the wrong spot"
 *  (it landed on the pickleballtournaments.com homepage). */
const REGISTER_PPA = "https://www.pickleballtournaments.com/search?partner=sanction_ppa";

export const tourPrograms: TourProgram[] = [
  {
    slug: "junior",
    label: "Junior PPA",
    eyebrow: "For Players 18 & Under",
    headline: "The Official Competition for the Next Generation",
    body: [
      "The Junior PPA Tour is the official competition for players 18 and younger. Serving as the developmental pipeline for the Carvana PPA Tour, events transpire alongside each Carvana PPA Tour stop, with dedicated junior divisions and championship weekends.",
      "Players climb a national junior ranking that mirrors the pro tour's points race, and the top juniors qualify into Junior Nationals at the end of the season.",
    ],
    bullets: [
      { title: "Age divisions", detail: "Under-12, Under-14, Under-16, Under-19 in singles, doubles, and mixed doubles." },
      { title: "Run at every tour stop", detail: "Play in the same venue as the pros, the same weekend." },
      { title: "Junior Nationals", detail: "Top-ranked juniors qualify for the season-end championship." },
      { title: "Coach + parent resources", detail: "Tournament prep, travel, and on-site player support." },
    ],
    cta: { label: "Register a Junior Player", href: REGISTER_PPA, external: true },
    image: "/ppa/action-singles.jpg",
  },
  /**
   * ⚠ THIS ENTRY NO LONGER RENDERS A PAGE — /tour/senior is its own route, same
   * as `junior`. It stays because nav, the sitemap, site search and the other
   * programs' cross-link grids read this list, and `senior` is in that route's
   * HAS_OWN_ROUTE set so no dead duplicate is prerendered.
   *
   * ⚠ THE COPY BELOW WAS INVENTED AND IS NOW CORRECTED TO ppatour.com/senior-open/
   * (Wesley, 8/4). It used to state age brackets "50+, 55+, 60+, 65+, 70+, 75+",
   * skill brackets "3.5, 4.0, 4.5, 5.0", and a "Senior Nationals ... at the
   * Pickleball World Championships in Dallas". The live page states none of
   * those. It is also the **Humana** Senior Open — a sponsored program, which is
   * why the page has a sponsor section. Keep this in step with that route.
   */
  {
    slug: "senior",
    label: "Senior Open",
    eyebrow: "For Players 50+",
    headline: "Humana Senior Open",
    sectionHeadline: "Top Competition for Players 50 and Over at Carvana PPA Tour Stops",
    body: [
      "The Humana Senior Open events bring together the best players aged 50 and older, showcasing their skills and passion for the game. These competitions are held as part of the Carvana PPA Tour, adding an extra layer of action and camaraderie to the tour stops.",
      "Brackets run in singles, doubles and mixed doubles, on the same grounds and in the same week as the pros.",
    ],
    bullets: [
      { title: "Who plays", detail: "Players 50 and older, at Carvana PPA Tour stops." },
      { title: "Events", detail: "Singles, doubles and mixed doubles." },
      { title: "Senior points", detail: "Points are awarded per division and scale with the tournament tier." },
      { title: "Prize money", detail: "Every division pays out, from a pool set by the size of its field." },
    ],
    cta: { label: "Register for a Senior Bracket", href: REGISTER_PPA, external: true },
    image: "/ppa/action-md-final.jpg",
  },
  {
    /**
     * ⚠ APPROVED COPY (Wesley, 8/5: "got approval from Tanner and team"). Treat
     * the wording here as signed off — don't rewrite it for house style without
     * going back to them.
     *
     * ⚠ IT IS A TITLED SERIES NOW: the **2026 Powerball Pickleball State
     * Championship Series**. Powerball is the title sponsor, which is why the
     * name leads the page. The nav `label` stays the short "State Championships"
     * because it sits in a dropdown beside five siblings; the full name carries
     * the H1.
     *
     * ⚠ WHAT THE OLD COPY GOT WRONG, so none of it comes back:
     *   - It sent state champions to "priority entry into the National
     *     Championships". They get AUTOMATIC QUALIFICATION into the Champions
     *     Division brackets of the **Pickleball World Championships** — a
     *     different event and a stronger claim.
     *   - It invented "Brackets from 2.5 through 5.0+" and "qualifier weekends".
     *     The approved copy says all ages and skill levels competing within
     *     their respective divisions, and names no bracket numbers.
     *   - It located Worlds "in Dallas". The 2026 Worlds is at Brookhaven Country
     *     Club, Farmers Branch TX. The approved copy names no city, so neither
     *     does this.
     *
     * ⚠ "Gold medalists" brushes against Hannah's 7/28 ruling to drop medal
     * terminology sitewide. Kept, because here it names the QUALIFICATION
     * MECHANISM in copy a sponsor has approved — you win gold in your state, you
     * are in at Worlds — not a career stat on a player page, which is what that
     * ruling targeted. Flagged rather than resolved; if she is firm it is one
     * sentence, and it needs Tanner's side to agree.
     */
    slug: "state-championships",
    label: "State Championships",
    eyebrow: "All 50 States · 55+ Events",
    headline: "2026 Powerball Pickleball State Championship Series",
    sectionHeadline: "Where Community, Competition, and Championship Dreams Collide",
    body: [
      "The Powerball Pickleball State Championship Series is more than just a tournament, it's a nationwide celebration of America's fastest-growing sport. Spanning all 50 states with 55+ events, the series gives amateur players of all ages and skill levels the opportunity to compete within their respective divisions in each state's amateur championship.",
      "Gold medalists in each state, who earn the title of state champion, receive automatic qualification into the Champions Division brackets of the Pickleball World Championships, where they compete against medalists from other State Championship events.",
      "Join the movement. From local courts in your hometown to the grand stage of the Pickleball World Championships, we're showcasing the best players in each state's amateur championship tournament in the country.",
    ],
    bullets: [
      { title: "All 50 states", detail: "55+ events across the country, from local courts to the national stage." },
      { title: "Every age and skill level", detail: "Amateur players compete within their respective divisions at each state's amateur championship." },
      { title: "State champion status", detail: "Gold medalists in each state earn the title of state champion." },
      { title: "A place at the World Championships", detail: "State champions qualify automatically for the Champions Division brackets at the Pickleball World Championships." },
    ],
    cta: { label: "Find a Tournament Near You", href: REGISTER_PPA, external: true },
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "camps",
    label: "PPA Camps",
    eyebrow: "Multi-Day Instruction with the Pros",
    headline: "Camps Built Around the Pro Game",
    body: [
      "PPA Camps are multi-day instructional weekends led by pro coaches and current PPA Tour athletes — small-group instruction, on-court drills, video review, and live-ball play.",
      "Camps run year-round at premium venues and are open to all skill levels, with separate tracks for intermediate, advanced, and competitive players.",
    ],
    bullets: [
      { title: "Pro-led instruction", detail: "Coaching from current PPA Tour pros and certified camp staff." },
      { title: "Small groups", detail: "8:1 student-to-coach ratios on every drill." },
      { title: "Skill tracks", detail: "Intermediate, advanced, and competitive — find your level." },
      { title: "Premium venues", detail: "All-inclusive weekends at top resorts and clubs." },
    ],
    cta: { label: "Browse Upcoming Camps", href: REGISTER, external: true },
    image: "/ppa/action-champ-sunday.jpg",
  },
  /**
   * ⚠ THE "TRAVEL" PROGRAM WAS REMOVED (Aug 2026). Pickleball Vacations is no
   * longer a separate property linked out to — it lives on this site at
   * `/vacations`, with its own Stripe checkout and a room block read live from
   * Jackalope. `/tour/travel` 301s there (see next.config.ts) and the nav
   * points at it directly.
   *
   * Do NOT re-add a Travel program here. It duplicated trip facts by hand,
   * which is how the page came to advertise a resort with a CTA pointing at a
   * parked domain. `lib/vacations/content.ts` is the only home for trip data.
   *
   * Tournament partner hotels were the page's other half; those live on each
   * event page's "Where to Stay", fed from Jackalope's hotel blocks.
   */
  {
    slug: "hospitality",
    label: "Hospitality",
    eyebrow: "Premium Seating + Suites",
    headline: "The Best Seats on Every Court",
    sectionHeadline: "Enjoy an Elevated Experience at all Carvana PPA Tour stops",
    body: [
      "Carvana PPA Tour Hospitality delivers premium seating, private suites, and on-court player experiences at every Carvana PPA Tour stop — from courtside boxes at Humana Championship Court to corporate suites with catering and dedicated VIP service.",
      "The Carvana PPA Tour is proud to offer the very best hospitality offerings to every tournament. Hospitality packages include courtside boxes and corporate suites at Humana Championship Court, on-site concierge and dedicated VIP service, player meet-and-greets and on-court experiences, plus broadcast-quality views of every match.",
    ],
    bullets: [
      { title: "Courtside boxes", detail: "Premium reserved seating at Humana Championship Court for every marquee match." },
      { title: "Corporate suites", detail: "Private suites with catering, dedicated bar, and a host." },
      { title: "Player experiences", detail: "Meet-and-greets, clinics, and access opportunities with PPA pros." },
      { title: "Concierge service", detail: "On-site host, parking, and dedicated entry across the weekend." },
    ],
    cta: { label: "Hospitality Inquiry", href: "mailto:hospitality@ppatour.com" },
    image: "/ppa/action-waters-bright.jpg",
  },
];

export function getTourProgram(slug: string): TourProgram | undefined {
  return tourPrograms.find((p) => p.slug === slug);
}
