import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JuniorRankings } from "@/components/tour/JuniorRankings";
import { JuniorFinalists, type FinalsYear } from "@/components/tour/JuniorFinalists";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { getEvents } from "@/lib/events-api";
import { eventHref } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * Junior PPA Tour.
 *
 * ⚠ Ported to match ppatour.com/junior-ppa-tour/ (Wesley, 8/4). This is a
 * SPECIFIC route, so it wins over the /tour/[slug] catch-all — same pattern as
 * the /about/* pages. The `junior` entry stays in lib/tour-programs.ts because
 * the other five programs cross-link to it and nav/search/sitemap read it, but
 * that entry no longer renders this page.
 *
 * ⚠ It replaced content that was WRONG, not merely thin: we had age divisions
 * as "Under-12/14/16/Under-19" (they are 12U/14U/16U/18U), called the
 * season-ender "Junior Nationals" (it is the Junior PPA Finals), and said
 * events run alongside EVERY tour stop (the live page says certain stops, and
 * lists nine). Don't reintroduce any of that.
 *
 * ⚠ /junior-ppa-tour already 301s here (next.config.ts), which is why the
 * rankings snapshot matters — the live page's own registration instructions
 * tell players "rankings can be found at ppatour.com/junior-ppa-tour/", and
 * after the DNS cutover that URL is THIS page.
 */

const REGISTER = withUtm(
  "https://www.pickleballtournaments.com/search?partner=sanction_ppa",
  { campaign: "junior-ppa", content: "register" },
);
const YOUTUBE = withUtm("https://www.youtube.com/@JuniorPPATour", {
  campaign: "junior-ppa",
  content: "youtube",
});
const INSTAGRAM = "https://www.instagram.com/junior.ppa/";
const FACEBOOK =
  "https://www.facebook.com/people/Junior-PPA-Tour/61587897389740/";

/**
 * Junior PPA staff, for the Stay Connected section (Daniela Almendarez, 9/3).
 *
 * ⚠ NAMES, TITLES AND ADDRESSES ARE VERBATIM FROM HER REQUEST. These are real
 * people's work addresses published on a public page — never guess a colleague's
 * address from a naming pattern, and never add a row here that did not come from
 * the team itself.
 */
const CONTACTS = [
  {
    name: "Jake Weinbach",
    title: "Director of Junior PPA Tour",
    email: "j.weinbach@ppatour.com",
  },
  {
    name: "Daniela Almendarez",
    title: "Junior PPA Coordinator",
    email: "d.almendarez@ppatour.com",
  },
];

/** Self-hosted on purpose: the original lives at ppatour.com/wp-content/, which
 *  stops resolving the moment DNS moves ppatour.com off WordPress. */
const HANDBOOK = "/ppa/junior/2026-junior-ppa-handbook.pdf";

/**
 * ⚠ THE LABELS ARE VERBATIM FROM THE LIVE PAGE (Wesley's call, 8/4) AND STAY
 * THAT WAY — three of them are not what the tour's own feed calls the event
 * ("Florida Open" is the Proton Daytona Beach Open, "Mesa, AZ" is the Veolia
 * Arizona Open, "Pickleball National Championships" is the Veolia PPA National
 * Championships). Daniela asked on 9/3 for these to link to their event pages,
 * which is a link, not a rename: the row keeps her words and gains an href.
 *
 * ⚠ THE SLUG AND YEAR ARE CURATED AND HAND-VERIFIED, NEVER MATCHED ON THE NAME.
 * Every one of these labels matches several events by name across seasons, and
 * the loose ones match the WRONG one: name-matching "Mesa, AZ" returns the
 * February Carvana Mesa Cup, and "Pickleball National Championships" returns
 * the 2023 Biofreeze edition. Each row below was resolved by DATE OVERLAP
 * against the live feed and then written down — the same one-row-per-event
 * discipline as lib/asia-tour-links.ts, for the same reason: a link to the
 * wrong tour stop sends a junior's family to the wrong week.
 *
 * ⚠ `slug: null` MEANS "HAS NO EVENT PAGE", NOT "NOT LOOKED UP YET". The
 * Vancouver stop is a PPA Canada event, and international stops deliberately
 * have no internal page (8/6) — linking it would hit a redirect out or a 404.
 * It renders as plain text, exactly as every row did before today.
 *
 * The href is only emitted if the slug still resolves to an event that really
 * has an internal page (see `upcomingWithLinks`), so a stale row degrades to
 * plain text rather than publishing a dead link.
 */
const UPCOMING: {
  dates: string;
  event: string;
  slug: string | null;
  year: number;
}[] = [
  // PPA Canada — link-out stop, no internal event page.
  { dates: "August 19–23, 2026", event: "Vancouver, Canada", slug: null, year: 2026 },
  { dates: "August 31 – September 6, 2026", event: "Pickleball National Championships", slug: "veolia-pickleball-national-championships", year: 2026 },
  // Her label is the city; the tour stop that week is the Veolia Arizona Open.
  { dates: "September 14–20, 2026", event: "Mesa, AZ", slug: "veolia-arizona-open", year: 2026 },
  { dates: "September 28 – October 4, 2026", event: "Las Vegas Open", slug: "rate-las-vegas-open", year: 2026 },
  { dates: "October 5–11, 2026", event: "Chicago Cup", slug: "veolia-chicago-cup", year: 2026 },
  { dates: "October 12–18, 2026", event: "Virginia Beach Open", slug: "virginia-beach-open", year: 2026 },
  { dates: "November 2–8, 2026", event: "Pickleball World Championships", slug: "pickleball-world-championships", year: 2026 },
  // "Florida Open" is the Proton Daytona Beach Open in the feed.
  { dates: "November 16–22, 2026", event: "Florida Open", slug: "proton-daytona-beach-open", year: 2026 },
  { dates: "April 12–18, 2027", event: "Cincinnati Open", slug: "cincinnati-open", year: 2027 },
];

/**
 * Attach an href to each upcoming row, but only where it is genuinely safe.
 *
 * Three gates, and all three have failed for real elsewhere in this repo:
 *   1. the row must name a slug (null = a link-out stop with no page),
 *   2. the slug AND year must both match a live event — the slug alone is not
 *      unique, `pickleball-world-championships` exists for 2025 and 2026, and
 *      `eventHref` builds the year from the record it is given, so matching on
 *      slug alone can publish a link to last season's page,
 *   3. that event must have `hasInternalPage`, or the URL redirects out (8/6).
 *
 * The feed being unreachable falls back to the curated schedule inside
 * `getEvents()`; if a row still cannot be resolved it simply renders unlinked.
 */
async function upcomingWithLinks() {
  const { events } = await getEvents();
  return UPCOMING.map((u) => {
    if (!u.slug) return { ...u, href: null };
    const match = events.find(
      (e) =>
        e.slug === u.slug &&
        Number(e.startDate.slice(0, 4)) === u.year &&
        e.hasInternalPage,
    );
    return { ...u, href: match ? eventHref(match) : null };
  });
}

const DIVISIONS = [
  { group: "Singles", items: ["Boys Singles 12U, 14U, 16U, 18U", "Girls Singles 12U, 14U, 16U, 18U"] },
  { group: "Doubles", items: ["Boys Doubles 12U, 14U, 16U, 18U", "Girls Doubles 12U, 14U, 16U, 18U"] },
  { group: "Mixed Doubles", items: ["Junior Mixed Doubles 12U, 14U, 16U, 18U"] },
];

/**
 * ⚠ "National" reads "PPA Majors", not the live page's "PPA Slams" — Slam was
 * retired on 7/23 in favour of Major and that is a standing ruling. The numbers
 * are the live page's, unchanged.
 */
const POINTS = [
  { place: "1st", global: "2,000", national: "1,000", regional: "500" },
  { place: "2nd", global: "1,600", national: "800", regional: "400" },
  { place: "3rd", global: "1,200", national: "600", regional: "300" },
  { place: "4th", global: "800", national: "400", regional: "200" },
  { place: "5th", global: "400", national: "200", regional: "100" },
  { place: "6th", global: "200", national: "100", regional: "50" },
  { place: "App.", global: "100", national: "50", regional: "25" },
];

const REGISTER_STEPS = [
  {
    n: "01",
    title: "Register & Checkout",
    items: [
      "Visit pickleballtournaments.com and select your tournament.",
      "Click Register Now and choose your events (Singles, Doubles, Mixed Doubles) by selecting Waitlist for each event. Players are only allowed to participate in one event per day.",
      "Review and agree to the Terms of Service and submit your registration. No payment should be made at this time.",
      "Await notification regarding event entry.",
    ],
  },
  {
    n: "02",
    title: "Selection Process",
    items: [
      "Event entry is determined through the Junior PPA Tour selection process.",
      "Players are selected based on Junior PPA Ranking Points and available spots in each division.",
      "Rankings are published on this page.",
      "Players will be notified by email after registration closes, typically two weeks before the tournament.",
      "Event fees are not due until selections have been finalized.",
    ],
  },
  {
    n: "03",
    title: "Payment",
    items: [
      "Accepted players will complete payment through the tournament registration site.",
      "Waitlisted players will not be charged.",
      "Registration and event fees must be paid before the tournament begins.",
    ],
  },
];

const SPORTSMANSHIP = [
  { title: "Respect", items: ["Tapping paddles", "No boasting or taunting"] },
  { title: "Fairness", items: ["Honesty — line calls, faults, scores", "Integrity"] },
  { title: "Kindness", items: ["Positive attitude and body language", "Supportive language, no profanity"] },
];

const SERVES = [
  {
    title: "Clinics and Events",
    body: "Junior PPA players will be offered the opportunity to participate in engaging events that maximize youth development at each tour stop. These events will be free of charge.",
  },
  {
    title: "Education and Character Building",
    body: "Junior PPA players will be given access to online and in-person instruction to learn fundamentals, construct the right mindset, and build character to grow on and off the court.",
  },
];

const FINALS_2025 = [
  ["Girls Singles 12U", "Scout Johnson"],
  ["Boys Singles 12U", "Ari Chandra"],
  ["Girls Singles 14U", "Jing Robinson"],
  ["Boys Singles 14U", "Ethan Bakalinsky"],
  ["Girls Singles 16U", "Jayda Maldonado"],
  ["Boys Singles 16U", "Soli Mosseri"],
  ["Girls Doubles 12U", "Scout Johnson & Lolo Williams"],
  ["Boys Doubles 12U", "Nicholas Zhang & Adym Pham"],
  ["Girls Doubles 14U", "Diane Huynh & Leah Jones"],
  ["Boys Doubles 14U", "Ethan Bakalinsky & MJ Greiner"],
  ["Girls Doubles 16U", "Jayda Maldonado & Aline Morales"],
  ["Boys Doubles 16U", "Indigo Dagnall & Andrew Angulo"],
  ["Mixed Doubles 12U", "Ella Evans & Nicholas Zhang"],
  ["Mixed Doubles 14U", "CC Eleven Sacca & Francis Chi"],
  ["Mixed Doubles 16U", "Cami Gonzalez & Andrew Angulo"],
];

const FINALS_2024 = [
  ["Girls Singles 12U", "Elsie Hendershot"],
  ["Boys Singles 12U", "Ryder Brown"],
  ["Girls Singles 14U", "Ella Yeh"],
  ["Boys Singles 14U", "Charlie Konkachbaev"],
  ["Girls Singles 16U", "Ella Cosma"],
  ["Boys Singles 16U", "Ford Casady"],
  ["Girls Doubles 12U", "Clarissa Year & Natalia Simson"],
  ["Boys Doubles 12U", "Leo Chun & MJ Greiner"],
  ["Girls Doubles 16U", "Ella Cosma & Cami Gonzalez"],
  ["Boys Doubles 16U", "Ford Casady & Boone Casady"],
  ["Mixed Doubles 12U", "Karina Lam & Leo Chun"],
  ["Mixed Doubles 16U", "Elsie Hendershot & Braden Jacobson"],
];

/**
 * Every season of Junior PPA Finals champions, NEWEST FIRST — the selector
 * defaults to `FINALS[0]`, so adding a season is one entry at the top and
 * nothing else. Don't reorder these oldest-first.
 */
const FINALS: FinalsYear[] = [
  { year: "2025", rows: FINALS_2025 },
  { year: "2024", rows: FINALS_2024 },
];

const SECTIONS = [
  { id: "tournaments", label: "Tournaments" },
  { id: "rankings", label: "Rankings" },
  { id: "compete", label: "How to Compete" },
  { id: "register", label: "How to Register" },
  { id: "finals", label: "Junior PPA Finals" },
  { id: "serves", label: "Junior PPA Serves" },
  { id: "connected", label: "Stay Connected" },
];

export const metadata: Metadata = {
  title: "Junior PPA Tour",
  description:
    "The Junior PPA Tour powered by Proton — youth pickleball competition for ages 8–18 alongside Carvana PPA Tour stops. Divisions, eligibility, format, points, rankings, and how to register.",
};

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 bg-ppa-blue" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
        {title}
      </h2>
    </>
  );
}

export default async function JuniorPage() {
  const upcoming = await upcomingWithLinks();
  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/action-singles.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25 will-change-transform"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          {/**
           * The Junior PPA lockup (Daniela Almendarez, 9/3: "Add our logo back
           * up").
           *
           * ⚠ THIS IS THE REVERSED (WHITE) CUT AND IT ONLY WORKS ON A DARK
           * GROUND. Rendered on white it very nearly disappears — the type is
           * white, and all that survives is the navy inside the P counters. It
           * is placed here because this hero is bg-ppa-navy. Do NOT reuse it on
           * ppa-paper or white without getting the positive cut from the brand
           * team first. Same trap as the reversed MOJO mark (8/10).
           *
           * ⚠ PROVENANCE: extracted from page 1 of the official 2026 Junior PPA
           * Handbook we already self-host (public/ppa/junior/), which is the
           * tour's own publication — not lifted off a third-party site. The navy
           * it was flattened onto measured rgb(12,44,69), one level per channel
           * off ppa-navy, so it was flood-filled to transparency rather than
           * dropped in as a JPEG that would show a faint box.
           *
           * alt="" on purpose: the <h1> immediately below says the same words,
           * and a screen reader should not read the brand twice.
           */}
          <Image
            src="/ppa/junior/junior-ppa-logo.png"
            alt=""
            width={371}
            height={396}
            priority
            sizes="(min-width: 640px) 144px, 112px"
            className="h-28 w-auto sm:h-36"
          />
          <div className="mt-6 flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              For Players 18 &amp; Under
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            Junior PPA Tour Powered by Proton
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Junior PPA is a campaign dedicated to fostering youth pickleball
            players through competition events, development opportunities, and
            social activity — a spotlight for youth athletes around the world to
            showcase their talents, develop physical and mental skills, and
            compete against other top juniors. Junior PPA events transpire
            alongside certain stops of the PPA Tour, where the top professional
            pickleball players in the world play.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={REGISTER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Register a Junior Player ↗
            </a>
            <a
              href={HANDBOOK}
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              2026 Handbook (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <section className="border-b border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <nav aria-label="On this page" className="flex min-w-0 flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-ppa-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* -------------------------------------------- Mission and vision */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="About Junior PPA" title="Mission & Vision" />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-white p-6">
              <h3 className="font-display text-lg uppercase text-ppa-navy">
                Our Mission
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                To promote, encourage, and advance youth pickleball by creating
                opportunities for athletes 18 years of age and under to compete,
                learn, and grow in a positive and fun environment. The Junior
                PPA&apos;s approach is intended to strengthen the skill set,
                health, and character of youth, as well as the culture of youth
                pickleball.
              </p>
            </div>
            <div className="min-w-0 border-l-2 border-ppa-navy/25 bg-white p-6">
              <h3 className="font-display text-lg uppercase text-ppa-navy">
                Our Vision
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                We strive to be committed to youth development while encouraging
                continued participation in the community of pickleball. We hope
                to use our resources, platform, and passion to inspire the next
                generation of pickleball athletes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------ Upcoming tournaments */}
      <section id="tournaments" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Schedule" title="Upcoming Tournaments" />
          {/**
           * Each row links to that stop's event page where one exists
           * (Daniela, 9/3). A row with no resolved href stays exactly as it
           * always rendered — see the gates on `upcomingWithLinks`. The whole
           * cell is the link so the target is a comfortable size on a phone.
           */}
          <ul className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((u) => {
              const inner = (
                <>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {u.dates}
                  </span>
                  <span className="mt-1 block font-display text-sm uppercase text-ppa-navy">
                    {u.event}
                    {u.href && (
                      <span aria-hidden className="ml-1.5 text-ppa-blue">
                        →
                      </span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={`${u.dates}-${u.event}`} className="min-w-0 bg-white">
                  {u.href ? (
                    <Link
                      href={u.href}
                      className="group block h-full p-4 transition-colors hover:bg-ppa-paper"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="p-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------- Rankings */}
      <section id="rankings" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead
            eyebrow="Presented by Proton"
            title="Junior PPA Rankings"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ppa-navy/45">
            Last updated May 19, 2026
          </p>
          <div className="mt-6">
            <JuniorRankings />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ How to compete */}
      <section id="compete" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Competition" title="How to Compete" />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Compete against the top junior pickleball players around the country
            in traditional tournament events, where you will have the
            opportunity to showcase your talents, refine your skill set, and
            #BeTheBest.
          </p>

          {/* Eligibility + cost */}
          {/**
           * ⚠ THE GRID IS COUNT-AGNOSTIC ON PURPOSE. Daniela asked on 9/3 to
           * drop the "Skill — Under 5.5 DUPR" tile, which left three tiles in a
           * hardcoded lg:grid-cols-4 and a visible empty column. Same fix as the
           * event-page quick-facts bar (8/5 pt. 20): let the column count follow
           * the number of tiles so the next add or removal needs no layout edit.
           */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Age", value: "8–18" },
              { label: "Registration fee", value: "$75" },
              { label: "Event fee", value: "$30" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex min-w-0 flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  {f.label}
                </span>
                <span className="mt-1 font-display text-2xl uppercase leading-none text-ppa-navy">
                  {f.value}
                </span>
              </div>
            ))}
          </div>

          {/* Divisions */}
          <div className="mt-10">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              Divisions
            </h3>
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              {DIVISIONS.map((d) => (
                <div key={d.group} className="min-w-0 border border-ppa-line bg-ppa-paper p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {d.group}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {d.items.map((i) => (
                      <li key={i} className="text-sm leading-relaxed text-ppa-navy/70">
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Format — heading added at Daniela's request (9/3); the two cards
              below were previously unlabelled, unlike Divisions above them. */}
          <div className="mt-10">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              Format
            </h3>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                7 teams or more
              </p>
              <h3 className="mt-1.5 font-display text-lg uppercase text-ppa-navy">
                Double elimination, no come-around
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                If a team loses a match, the best they can do from there is win
                bronze — they cannot come around for a chance at gold.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-ppa-navy/70">
                <li>Main draw: 2 of 3 games to 11, win by 2</li>
                <li>Back draw: 1 game to 15, win by 2</li>
                <li>Bronze medal match: 2 of 3 games to 11, win by 2</li>
              </ul>
            </div>
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Fewer than 7 teams
              </p>
              <h3 className="mt-1.5 font-display text-lg uppercase text-ppa-navy">
                Round robin
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-ppa-navy/70">
                <li>3 teams: double round robin, no playoffs</li>
                <li>4–6 teams: single round robin, playoffs for the top three</li>
                <li>7+ teams: double elimination with no come-around</li>
              </ul>
              <ul className="mt-3 space-y-1.5 border-t border-ppa-line pt-3 text-sm text-ppa-navy/70">
                <li>Pool play: 1 game to 15, win by 2</li>
                <li>Playoff seeding tiebreaker: head-to-head, then total point differential</li>
                <li>Gold medal match: 2 of 3 games to 11, win by 2</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <p className="min-w-0 border-l-2 border-ppa-navy/20 bg-ppa-paper p-4 text-xs leading-relaxed text-ppa-navy/60">
              Events may be combined or canceled if there are fewer than 4 teams
              in a division. Tournament organizers possess the right to combine
              events and alter seedings to provide the best overall playing
              experience.
            </p>
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Bracket seeding
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ppa-navy/70">
                1–2 seeds: Junior PPA ranking points. 3+ seeds: DUPR rating.
              </p>
            </div>
          </div>

          {/* Points */}
          <div className="mt-10">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              Points
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ppa-navy/65">
              Global is the Pickleball World Championships, National is the PPA
              Majors, and Regional covers PPA Cups and Opens.
            </p>
            <div className="mt-4 overflow-x-auto border border-ppa-line">
              <table className="w-full min-w-96 border-collapse text-left">
                <caption className="sr-only">
                  Junior PPA points by finishing place and event level
                </caption>
                <thead>
                  <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    <th scope="col" className="px-4 py-2.5 font-bold">Place</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">Global</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">National</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold">Regional</th>
                  </tr>
                </thead>
                <tbody>
                  {POINTS.map((p) => (
                    <tr key={p.place} className="border-t border-ppa-line bg-white">
                      <th
                        scope="row"
                        className="px-4 py-2.5 font-display text-sm font-normal uppercase text-ppa-navy"
                      >
                        {p.place}
                      </th>
                      <td className="px-4 py-2.5 text-right text-sm text-ppa-blue tabular-nums">
                        {p.global}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-ppa-navy/70 tabular-nums">
                        {p.national}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-ppa-navy/70 tabular-nums">
                        {p.regional}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- How to register */}
      <section id="register" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Entry" title="How to Register" />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {REGISTER_STEPS.map((s) => (
              <div key={s.n} className="min-w-0 border border-ppa-line bg-white p-6">
                <span className="font-display text-2xl leading-none text-ppa-blue">
                  {s.n}
                </span>
                <h3 className="mt-2 font-display text-base uppercase text-ppa-navy">
                  {s.title}
                </h3>
                <ol className="mt-3 space-y-2">
                  {s.items.map((i) => (
                    <li key={i} className="flex min-w-0 gap-2.5 text-sm leading-relaxed text-ppa-navy/65">
                      <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <a
            href={REGISTER}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
          >
            Register a Junior Player ↗
          </a>

          {/* Grounds pass */}
          <div className="mt-10 border-l-2 border-ppa-yellow bg-white p-6">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              PPA Tour Grounds Pass
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ppa-navy/65">
              All registered Junior PPA players receive a{" "}
              <strong className="font-semibold text-ppa-navy">
                free grounds pass
              </strong>{" "}
              for the week of the event, included in the registration fee.
              Registration also comes with one complimentary grounds pass for a
              parent or guardian aged 18 or older to accompany them on the day
              they play — to claim it, the parent or guardian must be present
              when the player checks in. Juniors are encouraged to watch the best
              professional pickleball players in the world.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Watch + Finals */}
      <section id="finals" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Season-Ender" title="Junior PPA Finals" />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            The Junior PPA Finals is the season-ending invitational tournament on
            the Junior PPA Tour, attracting more than 50 top-ranked juniors from
            around the world to compete for the ultimate prize and recognition.
            Juniors qualify through Junior PPA points accumulated throughout the
            year, with the top-ranked players from each division earning an
            invite.
          </p>

          {/* Champions by season, selectable (Daniela, 9/3 — "like the
              rankings where you can select by year"). */}
          <div className="mt-8">
            <JuniorFinalists seasons={FINALS} />
          </div>

          <div className="mt-10 border border-ppa-line bg-ppa-paper p-6">
            <h3 className="font-display text-lg uppercase text-ppa-navy">
              Watch Junior PPA
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ppa-navy/65">
              Come watch all of the action and experience the future of
              pickleball. Our YouTube channel carries streams, matches, and
              highlights from top junior competition across the country.
            </p>
            <a
              href={YOUTUBE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
            >
              Watch Junior PPA ↗
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------- Sportsmanship + Serves */}
      <section id="serves" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="On and Off the Court" title="Sportsmanship" />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            We define sportsmanship as the behavior of treating others with
            respect, fairness, and kindness, especially in a competition setting.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {SPORTSMANSHIP.map((s) => (
              <div key={s.title} className="min-w-0 border border-ppa-line bg-white p-5">
                <h3 className="font-display text-base uppercase text-ppa-navy">
                  {s.title}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {s.items.map((i) => (
                    <li key={i} className="flex min-w-0 gap-2.5 text-sm leading-relaxed text-ppa-navy/65">
                      <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 border-l-2 border-ppa-blue bg-white p-4 text-sm leading-relaxed text-ppa-navy/70">
            Players with exceptional sportsmanship are rewarded with an honorable{" "}
            <strong className="font-semibold text-ppa-navy">
              Sportsmanship Award presented by Proton Sports
            </strong>{" "}
            at each tour stop.
          </p>

          <div className="mt-12">
            <SectionHead eyebrow="The Initiative" title="Junior PPA Serves" />
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
              In addition to competition events on the Junior PPA Tour, Junior
              PPA Serves is an initiative committed to serving the youth
              pickleball community by building opportunities centered around
              youth development and individual growth on and off the court. It
              embodies our mission of promoting, encouraging, and advancing the
              culture of youth pickleball.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {SERVES.map((s) => (
                <div key={s.title} className="min-w-0 border border-ppa-line bg-white p-5">
                  <h3 className="font-display text-base uppercase text-ppa-navy">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Stay connected */}
      {/**
       * Daniela Almendarez, 9/3: a Stay Connected section of its own, "separate
       * from the Junior PPA Serves" — it used to be one card inside that grid,
       * where a newsletter signup and the staff contacts had nowhere to live.
       * Heading, blurb, channel list and both contacts are her copy.
       *
       * ⚠ The Junior PPA GALLERY she also asked for belongs BETWEEN THIS
       * SECTION AND THE HANDBOOK ("Between Stay Connected and Learn more"). It
       * is not built yet — it needs her junior photos, and this repo does not
       * publish photographs of children chosen by us. Drop it in right here.
       */}
      <section id="connected" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Follow Along" title="Stay Connected" />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Stay connected and never miss the action! Follow us for upcoming
            events, important announcements, and all things Junior PPA.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Social */}
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-5">
              <h3 className="font-display text-base uppercase text-ppa-navy">
                Follow Junior PPA
              </h3>
              <ul className="mt-3 space-y-2">
                {[
                  { label: "Instagram", handle: "@junior.ppa", href: INSTAGRAM },
                  { label: "Facebook", handle: "Junior PPA Tour", href: FACEBOOK },
                  { label: "YouTube", handle: "@JuniorPPATour", href: YOUTUBE },
                ].map((sm) => (
                  <li key={sm.label} className="min-w-0">
                    <a
                      href={sm.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-w-0 items-baseline gap-2 text-sm text-ppa-navy/70 hover:text-ppa-blue"
                    >
                      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {sm.label}
                      </span>
                      <span className="min-w-0 truncate font-semibold text-ppa-navy group-hover:text-ppa-blue">
                        {sm.handle}
                      </span>
                      <span aria-hidden className="shrink-0 text-ppa-blue">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacts */}
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-5 lg:col-span-2">
              <h3 className="font-display text-base uppercase text-ppa-navy">
                Contact Junior PPA
              </h3>
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {CONTACTS.map((c) => (
                  <li key={c.email} className="min-w-0">
                    <p className="text-sm font-semibold text-ppa-navy">
                      {c.name}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
                      {c.title}
                    </p>
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-1.5 inline-block min-w-0 max-w-full truncate border-b border-ppa-blue text-sm text-ppa-navy hover:text-ppa-blue"
                    >
                      {c.email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/**
           * Newsletter (the "Newsletter" line in Daniela's list).
           *
           * Its own `junior` variant, so a Junior PPA signup is segmented as one
           * in Customer.io rather than filed with the adult amateur guide.
           *
           * ⚠ THE NAVY WRAPPER IS REQUIRED, NOT DECORATION. LeadMagnetCapture
           * renders its heading white and its body white/55, so on this white
           * section it published an eyebrow above an empty gap with a stray
           * button under it — caught by looking at the section, not by tsc.
           */}
          <div className="mt-4 bg-ppa-navy p-6 sm:p-8">
            <LeadMagnetCapture variant="junior" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Handbook */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-sky">
                Learn More
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
                The 2026 Junior PPA Handbook
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                The handbook provides valuable information to help guide and
                ensure that all Junior PPA stakeholders have a positive and
                enjoyable experience.
              </p>
            </div>
            {/* Self-hosted on purpose: the original lives at
                ppatour.com/wp-content/, which stops resolving the moment DNS
                moves ppatour.com off WordPress and onto this site. */}
            <a
              href={HANDBOOK}
              className="inline-flex h-11 shrink-0 items-center bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-transform hover:bg-ppa-yellow active:scale-[0.98]"
            >
              Download the Handbook (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Other programs */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            More Ways to Play
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { href: "/tour/senior", label: "Senior Open" },
              { href: "/tour/state-championships", label: "State Championships" },
              { href: "/tour/camps", label: "PPA Camps" },
              { href: "/events", label: "Full Schedule" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border border-ppa-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
