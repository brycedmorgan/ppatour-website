import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AthleteRoster, type RosterAthlete } from "@/components/athletes/AthleteRoster";
import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { RegionSwitcher } from "@/components/global/RegionSwitcher";
import { getEvents } from "@/lib/events-api";
import { EUROPE_PUBLIC, europeRobots } from "@/lib/europe-launch";
import { europeRoster } from "@/lib/europe-roster";
import { countryCodeFor } from "@/lib/published-athletes";
import { getWprIndex } from "@/lib/rankings-api";
import { SITE_URL } from "@/lib/site";

/**
 * PPA Tour Europe — a REGION of ppatour.com, not a fifth website.
 *
 * Bryce's call 2026-08-24; the full reasoning, the domain audit, the unlisted
 * launch flag and the subfolder-vs-subdomain ruling are all in `docs/EUROPE.md`.
 * Read that before adding anything here.
 *
 * ⚠ THIS PAGE RENDERS THE SITE'S OWN COMPONENTS, NOT ITS OWN LOOKALIKES, AND
 * THAT IS THE WHOLE POINT OF THIS FILE'S SECOND DRAFT. The first version
 * hand-rolled an event grid and a roster grid that were *nearly* the site's —
 * different card, different hero, no filters, no live rank, no follow button —
 * and Bryce's note was immediate: *"This should follow the same feel, look, and
 * structure we have for the other events and pages."* A regional page is a page
 * OF this site. It uses `FeaturedEvents` for the schedule and `AthleteRoster`
 * for the pros, so a fix to either lands here for free and neither can drift.
 * **Do not reintroduce a bespoke card here.**
 *
 * ⚠ THIS PAGE OWNS NO CALENDAR OF ITS OWN. `lib/events-api.ts` already reads
 * every PPA org from one feed and rolls 20+ European ISO codes up to a single
 * `Europe` country value (Connor, 7/31). The schedule below is that feed,
 * filtered. A Europe stop appears the moment it lands in PB Tournaments, with no
 * code change — which also means an EMPTY schedule here is a data problem for
 * Chris Patrick, never a bug in this file.
 *
 * ⚠ CONTENT SOURCE: Payton Pemberton, #ppa-tour-europe 9/3, with the rules
 * differences written by the Europe team. The rules copy is theirs, near
 * verbatim, and should not be "improved" without asking them — several lines are
 * deliberately hedged (draw sizes vary, no fixed entry threshold) because the
 * tournament director has discretion.
 *
 * ⚠ THE CONTACT SECTION RENDERS A FORM AND NO ADDRESS, ON PURPOSE. Payton, 9/3:
 * "Don't publicize the email but have the form forward to us." The destination
 * is the `europe@ppatour.com` group, held in `FORM_INBOX_EUROPE`. Do not add a
 * mailto row here like /about/contact has.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: "PPA Tour Europe",
  description:
    "PPA Tour Europe — the European professional pickleball tour. Schedule, signed pros, event tiers, entry priority and the rules that differ from the US tour.",
  alternates: { canonical: `${SITE_URL}/europe` },
  // ⚠ Unlisted, not private. Live for anyone with the link, invisible to search
  // until EUROPE_PUBLIC flips. See lib/europe-launch.ts.
  robots: europeRobots,
};

/* ------------------------------------------------------------------ *
 * Reference tables — the Europe team's copy, 9/3.
 * ------------------------------------------------------------------ */

/**
 * ⚠ FOUR TIERS, AND THEY ARE NOT THE US TIERS. The US tour runs Worlds /
 * Majors / Cups / Opens (see /about/how-it-works); Europe is sized purely by
 * ranking points. Do not map one onto the other — a Europe 500 is not a US
 * Open, and printing them in the same table would say it is.
 */
const EVENT_TIERS = [
  { points: "75", note: "Entry level. Open to ITP players." },
  { points: "125", note: "Open to ITP players." },
  { points: "250", note: "Touring pros and aspiring touring pros only." },
  { points: "500", note: "Touring pros and aspiring touring pros only." },
];

const ENTRY_PRIORITY = [
  {
    n: "01",
    title: "Signed Touring Pros",
    body: "Only players on a PPA contract are guaranteed a spot in the main draw. Any signed player who does not make the main draw is guaranteed a place in qualifying.",
  },
  {
    n: "02",
    title: "Pairs with one contracted player",
    body: "In doubles and mixed doubles, a pair with one PPA-contracted player has a stronger chance of direct main-draw entry than a pair where neither player is contracted.",
  },
  {
    n: "03",
    title: "PPA Points, then DUPR",
    body: "Remaining spots are ordered by PPA Points (World Pickleball Ranking), then by DUPR rating. Once the main draw is full, remaining teams fill qualifying in the same order.",
  },
];

const DIFFERENCES = [
  "Its own calendar, events and player operations across the region.",
  "Four event tiers — 75, 125, 250 and 500 points — rather than the US Worlds / Majors / Cups / Opens structure.",
  "ITP players may compete, capped at 125-point events.",
  "Draw sizes of 32 to 64, set per event by the tournament director.",
];

/** House section heading — the same eyebrow + rule the rest of the site uses. */
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

function genderFromDivisions(divisions: string[]): "male" | "female" {
  return divisions.some((d) => d.startsWith("Women")) ? "female" : "male";
}

export default async function EuropePage() {
  const { events } = await getEvents();
  const europeEvents = events
    .filter((e) => e.country === "Europe" && e.status !== "completed")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  /**
   * Live world rank for any Europe pro who is on the board. This is the payoff
   * for keying `europeRoster` on the pickleball.com slug rather than a name we
   * made up: the same index /athletes uses answers for these 26 with no extra
   * request. Degrades to rank 0 (the roster's own "unranked" state) with no
   * token or on a 429 — never a fabricated number.
   */
  const wprIndex = await getWprIndex().catch(
    () => ({}) as Awaited<ReturnType<typeof getWprIndex>>,
  );

  const roster: RosterAthlete[] = europeRoster.map((p) => {
    const wpr = wprIndex[p.slug];
    return {
      slug: p.slug,
      name: p.name,
      // ⚠ "" is the roster's documented "render the branded placeholder" value.
      // Never a path to a file that is not in the repo — that shipped 25 broken
      // images to production once already. See lib/europe-roster.ts.
      headshot: p.portrait ?? wpr?.image ?? "",
      country: p.country,
      countryCode: wpr?.countryCode || countryCodeFor(p.country),
      rank: wpr?.rank ?? 0,
      points: wpr?.points ?? 0,
      gender: wpr?.gender ?? genderFromDivisions(p.divisions),
      divisions: p.divisions,
    };
  });

  return (
    <>
      {/* ⚠ Review banner, shown only while EUROPE_PUBLIC is false. Payton, Catie,
          Chris and Smash are being sent this URL before launch, and a finished
          page with no "not live yet" marker reads as already published — which
          is how someone forwards it to a licensee or posts it to social. It
          disappears with the flag, along with the nav gap it explains. */}
      {!EUROPE_PUBLIC && (
        <div className="bg-ppa-blue-deep text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              Preview — not yet live.{" "}
              <span className="font-normal normal-case tracking-normal text-white/60">
                Reachable by link only. Not linked from ppatour.com and not in
                search. Please don&apos;t share it publicly yet.
              </span>
            </p>
          </div>
        </div>
      )}

      <RegionSwitcher active="Europe" />

      {/* ------------------------------------------------------------ Hero */}
      {/* Same hero as /tour/[slug] and the event pages: full-bleed photograph,
          the house `.scrim-hero`, eyebrow, display headline, CTA row. */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/event-barcelona.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              PPA Tour Europe
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            Professional Pickleball, Across Europe
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            PPA Tour Europe is operated separately from the PPA Tour in the
            United States. It shares the PPA name and standards, and runs its own
            calendar, events and player operations across the region.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#schedule"
              className="inline-flex items-center border border-ppa-blue bg-ppa-blue px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-ppa-blue-deep hover:bg-ppa-blue-deep"
            >
              Schedule
            </a>
            <a
              href="#pros"
              className="inline-flex items-center border border-white/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white hover:bg-white/10"
            >
              The Pros
            </a>
            <a
              href="#entry"
              className="inline-flex items-center border border-white/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Entry &amp; Rules
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Schedule */}
      {/* ⚠ The site's own event band, not a lookalike. Same card, same tier
          badge, same date and link behaviour as /events and the homepage. */}
      <section id="schedule" className="scroll-mt-24">
        {europeEvents.length > 0 ? (
          <FeaturedEvents
            events={europeEvents}
            kicker="Calendar"
            title="Next Up in Europe"
            /* ⚠ NOT "Challenger". Europe's tiers are 75 / 125 / 250 / 500 and
               the table further down this page says so; the house badge would
               print the US sub-1,000 word and contradict it. */
            tierName="PPA Tour Europe"
            subtitle="Every PPA Tour Europe stop, from the same live feed that runs the global calendar. Filter the full tour by region on Find an Event."
          />
        ) : (
          /* ⚠ NOT AN ERROR STATE. The feed is authoritative; with no Europe stop
             in it the honest thing is to say the calendar is being confirmed
             rather than print a fabricated one. */
          <div className="border-b border-ppa-line bg-white">
            <div className="mx-auto w-full max-w-6xl px-4 py-12">
              <SectionHead eyebrow="Calendar" title="The Calendar Is Being Confirmed" />
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
                Dates and venues are announced as each host city is confirmed.
                Sign up below and we will send the schedule the day it lands.
              </p>
            </div>
          </div>
        )}
        <div className="border-b border-ppa-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 text-sm">
            <Link href="/events" className="text-ppa-blue hover:text-ppa-navy">
              See the full tour schedule →
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Pros */}
      {/* ⚠ The site's roster component — search, gender, discipline and rank
          filters, live world rank, follow chips, and the branded placeholder for
          a pro whose portrait has not arrived. All of it for free. */}
      <section id="pros" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Pros" title="Signed to PPA Tour Europe" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            {europeRoster.length} professionals from{" "}
            {new Set(europeRoster.map((p) => p.country)).size} countries. Search
            the roster, filter it, and tap any pro for their profile.
          </p>
          <div className="mt-6">
            <AthleteRoster athletes={roster} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Event types */}
      <section id="events" className="scroll-mt-24 border-t border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Event Types" title="Four Tiers, Sized by Points" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            PPA Tour Europe currently runs four event tiers, sized by how many
            ranking points are on the line.
          </p>

          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-4">
            {EVENT_TIERS.map((t) => (
              <div key={t.points} className="min-w-0 bg-white p-5">
                <p className="font-display text-3xl leading-none text-ppa-blue">{t.points}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
                  Point Event
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ppa-navy/60">{t.note}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Draw sizes vary between 32 and 64 depending on venue capacity and
            sign-ups. The final main-draw size and qualifier setup remain at the
            tournament director&apos;s discretion.
          </p>
        </div>
      </section>

      {/* ------------------------------------------- Entry & eligibility */}
      <section id="entry" className="scroll-mt-24 border-t border-ppa-line bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Entry & Eligibility" title="How the Main Draw Is Filled" />

          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Pro event entry priority
              </p>
              <ol className="mt-3 grid gap-px border border-ppa-line bg-ppa-line">
                {ENTRY_PRIORITY.map((r) => (
                  <li key={r.n} className="flex min-w-0 gap-3 bg-white p-4">
                    <span className="font-display text-lg leading-none text-ppa-blue">{r.n}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-sm uppercase text-ppa-navy">
                        {r.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ppa-navy/60">
                        {r.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs leading-relaxed text-ppa-navy/55">
                There is no fixed entry threshold. Whether a pair needs to play
                the qualifying round depends on how many PPA-contracted players
                register in that category and how big the draw is. Pairs where
                neither player holds a PPA contract are likely to compete in the
                qualifying round.
              </p>
            </div>

            <div className="min-w-0 space-y-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                  Ineligible Touring Players (ITP)
                </p>
                <div className="mt-3 space-y-3 border border-ppa-line bg-white p-5 text-sm leading-relaxed text-ppa-navy/70">
                  <p>
                    ITPs are players who were offered a contract but did not
                    sign, whose contract has expired, or who signed with a
                    competing tour.
                  </p>
                  <p>
                    In Europe, ITP players may compete, but they cannot enter
                    events worth more than 125 points. That makes them eligible
                    for{" "}
                    <strong className="font-semibold text-ppa-navy">
                      125-point and 75-point events
                    </strong>
                    , and not for 250- and 500-point events — those are designed
                    for touring pros and aspiring touring pros fighting for WPR
                    points and hoping to earn a contract.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                  Prize money
                </p>
                <div className="mt-3 border border-ppa-line bg-white p-5 text-sm leading-relaxed text-ppa-navy/70">
                  <p>
                    Displayed prize money represents the prize levels for PPA
                    pros on a contract. For prize money for unsigned players,
                    contact the tournament organizers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Rules */}
      <section id="rules" className="scroll-mt-24 border-t border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Rules" title="The Rulebook" />
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0 space-y-4 text-sm leading-relaxed text-ppa-navy/70">
              <p>
                PPA Tour Europe plays to the official UPA-A Rulebook — the same
                book that governs the PPA Tour and Major League Pickleball. It
                applies to{" "}
                <strong className="font-semibold text-ppa-navy">
                  both amateur and pro divisions
                </strong>{" "}
                at PPA Tour Europe events.
              </p>
              <p>
                The rules on this page are the ones specific to Europe. Anything
                not covered here follows the rulebook.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="https://upaa.unitedpickleball.com/official-rulebook/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center border border-ppa-blue bg-ppa-blue px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-ppa-blue-deep hover:bg-ppa-blue-deep"
                >
                  Read the UPA-A Rulebook ↗
                </a>
                <Link
                  href="/about/how-it-works"
                  className="inline-flex items-center border border-ppa-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
                >
                  How the US Tour Works
                </Link>
              </div>
            </div>
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                How Europe differs from the US tour
              </p>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ppa-navy/65">
                {DIFFERENCES.map((d) => (
                  <li key={d} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Contact */}
      <section id="contact" className="scroll-mt-24 border-t border-ppa-line bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="mx-auto w-full max-w-3xl">
            <InquiryForm formType="europe" />
          </div>
        </div>
      </section>

      <LeadMagnetCapture />
    </>
  );
}
