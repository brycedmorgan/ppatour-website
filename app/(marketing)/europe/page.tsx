import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AthleteRoster, type RosterAthlete } from "@/components/athletes/AthleteRoster";
import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { RegionSwitcher } from "@/components/global/RegionSwitcher";
import { getEvents } from "@/lib/events-api";
import { europeRobots } from "@/lib/europe-launch";
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

/**
 * ⚠ EVERY CARVANA STRING HERE IS A DELIBERATE OVERRIDE OF THE ROOT LAYOUT, NOT
 * DUPLICATION. Carvana is the US title sponsor. This page is shown to European
 * sponsor prospects, so the tour's US title partner must not appear on it —
 * their own pitch would be carrying a rival's billing.
 *
 * The root layout (`app/layout.tsx`) sets a title template `"%s · Carvana PPA
 * Tour"`, `openGraph.siteName`/`title` and `twitter.title`, all reading
 * "Carvana PPA Tour". Next merges page metadata over the layout's, so each one
 * has to be displaced explicitly:
 *
 * - `title.absolute` — bypasses the template entirely. Plain `title` would come
 *   out as "PPA Tour Europe · Carvana PPA Tour", which is what shipped until
 *   2026-09-14.
 * - `openGraph` — the root object otherwise wins WHOLE. Before this block the
 *   page's own description never reached og:description at all; the unfurl read
 *   "Carvana PPA Tour — The Pro Tour of Pickleball". That is what appeared when
 *   anyone pasted this link into Slack or a calendar invite.
 * - `twitter` — same reason.
 *
 * ⚠ The OG IMAGE is NOT set here. It comes from the sibling
 * `opengraph-image.tsx`, which Next resolves file-first and which overrides
 * anything named in metadata. Without that file this page inherits the root
 * card, and the root card draws the Carvana lockup.
 *
 * ⚠ STILL CARVANA-BRANDED AND NOT FIXABLE FROM THIS FILE: the header and footer
 * lockups, the footer's ten US partner marks (Carvana among them, labelled
 * "Title Partner" and linking to carvana.com), and `SITE_JSON_LD` in the root
 * layout, which is rendered as a raw script rather than through the metadata
 * API and so cannot be overridden per page. Those need region-aware chrome.
 */
export const metadata: Metadata = {
  title: { absolute: "PPA Tour Europe" },
  description:
    "PPA Tour Europe — the European professional pickleball tour. Schedule, signed pros, event tiers, entry priority and the rules that differ from the US tour.",
  alternates: { canonical: `${SITE_URL}/europe` },
  openGraph: {
    type: "website",
    siteName: "PPA Tour Europe",
    title: "PPA Tour Europe",
    description:
      "The European professional pickleball tour — schedule, signed pros, event tiers and entry priority.",
    url: `${SITE_URL}/europe`,
  },
  twitter: {
    card: "summary_large_image",
    title: "PPA Tour Europe",
    description:
      "The European professional pickleball tour — schedule, signed pros, event tiers and entry priority.",
  },
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
      {/* ⚠ THE "Preview — not yet live" BANNER WAS REMOVED 2026-09-14, on Bryce's
          instruction ("take the preview off"), because this URL is being shown to
          a sponsor prospect and a banner saying the page is not live reads badly
          on their own pitch.

          ⚠ REMOVING THE BANNER DID NOT PUBLISH THE PAGE. `europeRobots` above
          still returns noindex/nofollow while EUROPE_PUBLIC is false, and the
          page is still absent from the nav, the footer, site search and the
          sitemap. So it remains reachable by link only — the banner was the only
          thing that SAID so. Anyone sending this link still needs to say it out
          loud, because the page no longer does.

          Do not re-add it as a way of marking the page unlaunched; that is what
          EUROPE_PUBLIC is for. */}

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
            {/* ⚠ The Carvana-free lockup, not the site default. A pro with no
                portrait gets a branded "Photo Coming" card, and the default
                mark is the Carvana lockup — the US title sponsor, inside a
                roster shown to European sponsor prospects. Alexia Alvarez has
                no portrait today, so this card renders on this page. */}
            <AthleteRoster
              athletes={roster}
              profileBase="/europe/athletes"
              placeholderMark={{
                src: "/ppa/logos/ppa-tour-horizontal-white.svg",
                width: 670,
              }}
            />
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

      {/* Email — LeadMagnetCapture draws white type and a white-bordered input,
          so it MUST sit on a navy section. Rendered bare it was invisible on
          this page's ppa-paper ground and ran flush to the viewport edge.
          Same wrapper as the other 15 call sites. */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" region="europe" />
        </div>
      </section>
    </>
  );
}
