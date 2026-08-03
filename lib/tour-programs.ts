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
  {
    slug: "senior",
    label: "Senior Open",
    eyebrow: "For Players 50+",
    headline: "Seniors Competition at Every Tournament",
    sectionHeadline: "Top Competition Exclusive to Seniors at Every Carvana PPA Tour Stop",
    body: [
      "The Senior Open is the PPA's dedicated 50+ amateur circuit — separate brackets, separate seedings, and national rankings that run all season.",
      "The PPA values senior pickleball competition and is thrilled to provide dedicated brackets at every Carvana PPA Tour destination.",
      "Senior divisions are split by age (50+, 55+, 60+, 65+, 70+, 75+) and skill (3.5, 4.0, 4.5, 5.0), with singles, doubles, and mixed doubles at every tour stop.",
    ],
    bullets: [
      { title: "Age brackets", detail: "50+, 55+, 60+, 65+, 70+, 75+ in every tournament." },
      { title: "Skill brackets", detail: "3.5, 4.0, 4.5, 5.0 — find your level, play your match." },
      { title: "Senior Nationals", detail: "Top seniors compete for the season-end title in each age and skill bracket at the Pickleball World Championships in Dallas." },
      { title: "Same venues, same weekends", detail: "Play alongside the pro tour at every tour stop." },
    ],
    cta: { label: "Register for a Senior Bracket", href: REGISTER_PPA, external: true },
    image: "/ppa/action-md-final.jpg",
  },
  {
    slug: "state-championships",
    label: "State Championships",
    eyebrow: "Your State's Biggest Amateur Stage",
    headline: "Every State, One Title",
    body: [
      "The PPA State Championships are the most competitive single-state amateur events in pickleball — qualifier weekends in every state, with the top seeds competing in the Champion's Division at the Pickleball World Championships in Dallas.",
      "Brackets are open by age and skill, and State Champions earn priority entry into the National Championships.",
    ],
    bullets: [
      { title: "Every state, every year", detail: "Qualifiers and State Finals across all 50 states." },
      { title: "Open to all skill levels", detail: "Brackets from 2.5 through 5.0+." },
      { title: "Path to Nationals", detail: "State Champions get priority registration at the National Championships." },
      { title: "Community + competition", detail: "The largest pickleball weekend in your state, every year." },
    ],
    cta: { label: "Find Your State", href: REGISTER_PPA, external: true },
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
  {
    /**
     * Front door for **Pickleball Vacations** (ppavacations.com), which is its
     * own property — a real Stripe checkout with a room block read live from
     * Jackalope. This site does not embed checkout, so this page sells the trip
     * and hands off; it does not replicate the booking flow.
     *
     * ⚠ Trip facts are transcribed from that project's `src/lib/content.ts`
     * (Club Med Turkoise, Dec 8–12 2026, the `included` list). **No price is
     * quoted here on purpose** — pricing lives in `pricing.ts` over there and
     * would go stale the moment it moved. Update the dates/resort here when the
     * trip rolls over, or this page starts advertising a trip that has sailed.
     */
    slug: "travel",
    label: "Travel",
    eyebrow: "Pickleball Vacations",
    headline: "Play the Islands With the Pros",
    // Without this the About section repeats the hero headline and its first
    // paragraph verbatim; setting it also makes the About body skip body[0].
    sectionHeadline: "Turks & Caicos, December 8-12",
    body: [
      "Pickleball Vacations is the tour's own trip: an adults-only, all-inclusive week at Club Med Turkoise on Grace Bay, Turks & Caicos, December 8–12, 2026. Mornings are structured clinics with professional coaches, afternoons are yours.",
      "Ten permanent courts, unlimited open play, all-inclusive dining, and ground transport from Providenciales (PLS). Hayden Patriquin is on the confirmed player list.",
      "Separately, tour partner hotels offer tournament-rate rooms at every stop on the schedule, with priority booking for registered players and ticket holders.",
    ],
    bullets: [
      { title: "Clinics with the pros", detail: "Daily 8 AM–12 PM coaching, 8+ hours of instruction and on-court play." },
      { title: "Ten permanent courts", detail: "Unlimited open play plus skill-based organized matchups." },
      { title: "All-inclusive", detail: "Four nights, dining and beverages, resort amenities, Wi-Fi and taxes." },
      { title: "Partner hotels on tour", detail: "Tournament-rate rooms at every stop, walking distance or shuttle to the venue." },
    ],
    cta: {
      label: "Explore the Trip",
      href: "https://ppavacations.com/?utm_source=ppatour&utm_medium=website&utm_campaign=pickleball-vacations&utm_content=tour-travel-cta",
      external: true,
    },
    image: "/ppa/action-masters.jpg",
  },
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
