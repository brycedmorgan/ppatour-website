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
    slug: "travel",
    label: "Travel",
    eyebrow: "Hotel + Travel Partners",
    headline: "Travel With the Tour",
    body: [
      "Tour partner hotels offer tournament-rate rooms at every tour stop, with priority booking for registered players and ticket holders.",
      "Partner airlines and rental partners offer tournament-rate flights and ground transport into each host city, and on-site shuttles run from partner hotels to the venue.",
    ],
    bullets: [
      { title: "Partner hotels", detail: "Tournament-rate rooms at every tour stop, walking distance or shuttle to the venue." },
      { title: "Airline partners", detail: "Tournament-rate flights and priority booking into each host city." },
      { title: "Ground transport", detail: "Rental rates and on-site shuttles included in partner bookings." },
      { title: "Priority booking", detail: "Registered players and ticket holders book first." },
    ],
    cta: { label: "See Partner Hotels", href: "/events" },
    image: "/ppa/action-masters.jpg",
  },
  {
    slug: "hospitality",
    label: "Hospitality",
    eyebrow: "Premium Seating + Suites",
    headline: "The Best Seats on Every Court",
    body: [
      "PPA Tour Hospitality delivers premium seating, private suites, and player experiences at every tour stop — from courtside boxes at Stadium Court to corporate suites with catering and dedicated service.",
      "Hospitality packages include on-site concierge, player meet-and-greets, and broadcast-quality views of every match.",
    ],
    bullets: [
      { title: "Courtside boxes", detail: "Premium reserved seating at Stadium Court for the marquee matches." },
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
