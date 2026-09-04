import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { getEvents } from "@/lib/events-api";
import { europeRoster } from "@/lib/europe-roster";
import { SITE_URL } from "@/lib/site";

/**
 * PPA Tour Europe — a REGION of ppatour.com, not a fifth website.
 *
 * Bryce's call 2026-08-24; the full reasoning, the domain audit and the list of
 * what actually blocks Europe launching are in `docs/EUROPE.md`. Read that
 * before adding anything here.
 *
 * ⚠ THIS PAGE OWNS NO CALENDAR OF ITS OWN, AND THAT IS THE WHOLE POINT.
 * `lib/events-api.ts` already reads every PPA org from one feed and rolls 20+
 * European ISO codes up to a single `Europe` country value (Connor, 7/31). The
 * schedule below is that feed, filtered. A Europe stop appears here the moment
 * it lands in PB Tournaments, with no code change — which also means an EMPTY
 * schedule here is a data problem for Chris Patrick, never a bug in this file.
 *
 * ⚠ CONTENT SOURCE: Payton Pemberton, #ppa-tour-europe 9/3, with the rules
 * differences written by the Europe team. Rules copy below is theirs, near
 * verbatim, and should not be "improved" without asking them — several lines
 * are deliberately hedged (draw sizes vary, no fixed entry threshold) because
 * the tournament director has discretion.
 *
 * ⚠ THE CONTACT SECTION RENDERS A FORM AND NO ADDRESS, ON PURPOSE. Payton, 9/3:
 * "Don't publicize the email but have the form forward to us." The destination
 * is the `europe@ppatour.com` Google Group, held in `FORM_INBOX_EUROPE`. Do not
 * add a mailto row here like /about/contact has.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: "PPA Tour Europe",
  description:
    "PPA Tour Europe — the European professional pickleball tour. Schedule, signed pros, event tiers, entry priority and the rules that differ from the US tour.",
  alternates: { canonical: `${SITE_URL}/europe` },
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

const SECTIONS = [
  { id: "schedule", label: "Schedule" },
  { id: "roster", label: "The Pros" },
  { id: "events", label: "Event Types" },
  { id: "entry", label: "Entry & Eligibility" },
  { id: "rules", label: "Rules" },
  { id: "contact", label: "Contact" },
];

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

function dateRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T12:00:00Z`);
  const e = new Date(`${endIso}T12:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const left = s.toLocaleDateString("en-US", opts);
  const right = sameMonth
    ? String(e.getUTCDate())
    : e.toLocaleDateString("en-US", opts);
  return `${left}–${right}, ${e.getUTCFullYear()}`;
}

export default async function EuropePage() {
  const { events } = await getEvents();
  const europeEvents = events
    .filter((e) => e.country === "Europe")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const upcoming = europeEvents.filter((e) => e.status !== "completed");

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              PPA Tour Europe
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            Professional Pickleball, Across Europe
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60 sm:text-base">
            PPA Tour Europe is operated separately from the PPA Tour in the
            United States. It shares the PPA name and standards, and runs its own
            calendar, events and player operations across the region.
          </p>

          <nav aria-label="On this page" className="mt-6 flex min-w-0 flex-wrap gap-2">
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

      {/* ------------------------------------------------------ Schedule */}
      <section id="schedule" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Calendar" title="PPA Tour Europe Schedule" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Every PPA Tour Europe stop, from the same live feed that runs the
            global calendar. Filter the full tour by region on{" "}
            <Link href="/events" className="text-ppa-blue hover:text-ppa-navy">
              Find an Event
            </Link>
            .
          </p>

          {upcoming.length === 0 ? (
            /* ⚠ NOT AN ERROR STATE. The feed is authoritative; if it holds no
               Europe stop, the honest thing is to say the calendar is being
               confirmed rather than print a fabricated one. */
            <div className="mt-6 border border-ppa-line bg-ppa-paper p-6">
              <p className="font-display text-base uppercase text-ppa-navy">
                The 2026–2027 calendar is being confirmed
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
                Dates and venues are announced as each host city is confirmed.
                Sign up below and we will send the schedule the day it lands.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
              {upcoming.map((e) => {
                const inner = (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                      {dateRange(e.startDate, e.endDate)}
                    </p>
                    <p className="mt-1 font-display text-base uppercase leading-tight text-ppa-navy">
                      {e.name}
                    </p>
                    <p className="mt-1 text-xs text-ppa-navy/55">
                      {[e.venue, e.city, e.state].filter(Boolean).join(" · ")}
                    </p>
                  </>
                );
                /* Three link states, exactly as lib/placeholder-data.ts
                   documents them: internal page, link-out, or nowhere to go. */
                if (e.detailsComingSoon) {
                  return (
                    <div key={e.slug} className="bg-white p-5">
                      {inner}
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">
                        Details Coming Soon
                      </p>
                    </div>
                  );
                }
                if (e.hasInternalPage) {
                  return (
                    <Link
                      key={e.slug}
                      href={`/events/${e.slug}`}
                      className="bg-white p-5 transition-colors hover:bg-ppa-paper"
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <a
                    key={e.slug}
                    href={e.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-5 transition-colors hover:bg-ppa-paper"
                  >
                    {inner}
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                      Event Details ↗
                    </p>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- Roster */}
      <section id="roster" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="The Pros" title="Signed to PPA Tour Europe" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            {europeRoster.length} professionals from {new Set(europeRoster.map((p) => p.country)).size}{" "}
            countries. Tap any pro for their full profile.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-px border border-ppa-line bg-ppa-line sm:grid-cols-3 lg:grid-cols-4">
            {europeRoster.map((p) => (
              <Link
                key={p.slug}
                href={`/athletes/${p.slug}`}
                className="group min-w-0 bg-white transition-colors hover:bg-ppa-paper"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-ppa-navy/5">
                  {p.portrait ? (
                    <Image
                      src={p.portrait}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    /* ⚠ Deliberate, visible gap — Alexia Alvarez's portrait has
                       not arrived. See lib/europe-roster.ts. */
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl uppercase text-ppa-navy/25">
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 p-4">
                  <p className="font-display text-sm uppercase leading-tight text-ppa-navy group-hover:text-ppa-blue">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    {p.country} · {p.age}
                  </p>
                  {p.sponsors.length > 0 && (
                    <p className="mt-1.5 text-xs leading-snug text-ppa-navy/55">
                      {p.sponsors.join(", ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Event types */}
      <section id="events" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Event Types" title="Four Tiers, Sized by Points" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            PPA Tour Europe currently runs four event tiers, sized by how many
            ranking points are on the line.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EVENT_TIERS.map((t) => (
              <div key={t.points} className="min-w-0 border border-ppa-line bg-ppa-paper p-5">
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
      <section id="entry" className="scroll-mt-24 bg-ppa-paper">
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
      <section id="rules" className="scroll-mt-24 bg-white">
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
              <a
                href="https://upaa.unitedpickleball.com/official-rulebook/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-ppa-blue bg-ppa-blue px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-ppa-blue-deep hover:bg-ppa-blue-deep"
              >
                Read the UPA-A Rulebook ↗
              </a>
            </div>
            <div className="min-w-0 border border-ppa-line bg-ppa-paper p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                How Europe differs from the US tour
              </p>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ppa-navy/65">
                <li>Its own calendar, events and player operations across the region.</li>
                <li>Four event tiers — 75, 125, 250 and 500 points — rather than the US Worlds / Majors / Cups / Opens structure.</li>
                <li>ITP players may compete, capped at 125-point events.</li>
                <li>Draw sizes of 32 to 64, set per event by the tournament director.</li>
              </ul>
              <Link
                href="/about/how-it-works"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
              >
                How the US tour works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Contact */}
      <section id="contact" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="mx-auto w-full max-w-3xl">
            <InquiryForm formType="europe" />
          </div>
        </div>
      </section>
    </>
  );
}
