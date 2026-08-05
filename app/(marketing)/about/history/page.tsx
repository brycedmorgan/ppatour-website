import type { Metadata } from "next";
import Link from "next/link";
import { TournamentHistoryTable } from "@/components/marketing/TournamentHistoryTable";
import {
  getTournamentHistory,
  seasonsOf,
  titleLeaders,
} from "@/lib/tournament-history";

/**
 * The tour's competitive record — every completed PPA Tour stop, with the
 * champion, runner-up and third place in all five pro divisions.
 *
 * ⚠ URL DELIBERATELY UNCHANGED. `/about/history` is linked from the header, the
 * footer, /about and site search, and it is in the sitemap. This page grew from a
 * hand-typed five-row table of recent National Championships into the whole
 * record; nothing about the address moved.
 *
 * The data comes from `lib/tournament-history.ts`, which layers a committed
 * archive under a live tail so a stop that finishes tomorrow lands here without
 * a code change (Wesley's ask). ISR daily — results never change once played, so
 * the only thing a revalidate buys is picking up a newly completed stop.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Tournament History",
  description:
    "Every PPA Tour champion, tournament by tournament — men's and women's singles and doubles and mixed doubles, from the 2020 season to today. Search by player or event.",
};

/**
 * Tour milestones. Corrected 7/28 against Hannah's historical timeline (the doc
 * behind the Pickleball Central on-site superstore) — we had the founding year
 * and the Carvana deal wrong.
 */
const MILESTONES = [
  { year: "2019", note: "The PPA Tour is founded by Connor Pardoe." },
  { year: "2020", note: "The first PPA Tour event is held in Mesa, Arizona." },
  { year: "2021", note: "The tour signs the first exclusive pro player contracts in pickleball." },
  { year: "2022", note: "Tom Dundon unites the sport's top brands, and CBS airs live pickleball on national television for the first time." },
  { year: "2023", note: "Dallas draws 3,500 players and 50,000 spectators, the biggest pickleball event ever held. Carvana signs on as title partner." },
  { year: "2024", note: "PPA Tour and MLP merge to form the United Pickleball Association." },
  { year: "2025", note: "The tour goes global with its first international events across five continents." },
];

export default async function TournamentHistoryPage() {
  const events = await getTournamentHistory();
  const seasons = seasonsOf(events);
  const leaders = titleLeaders(events, 8);
  // Every division title ever awarded — the honest way to size the record.
  const titles = events.reduce((n, e) => n + e.divisions.length, 0);

  const STATS = [
    { figure: events.length.toLocaleString(), label: "Tournaments" },
    { figure: `${seasons.length}`, label: "Seasons" },
    { figure: titles.toLocaleString(), label: "Titles Awarded" },
    { figure: "5", label: "Pro Divisions" },
  ];

  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Tournament History
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Every Champion. Every Stop.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The complete PPA Tour record — {events.length} tournaments across{" "}
            {seasons.at(-1)}&ndash;{seasons[0]}, every pro division, champion through
            third place. New stops are added as they finish.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-px border border-ppa-line bg-ppa-line sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-4 py-5">
                <p className="font-display text-3xl leading-none text-ppa-blue">{s.figure}</p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            The Record
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Champions, Tournament by Tournament
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Pick a division, then filter by season or search for a player or an
            event. Stops before 2024 carry the name the tour published at the
            time, sponsors included.
          </p>

          <TournamentHistoryTable events={events} />
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Most Titles
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            The Winningest Pros
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Tour titles won across all five pro divisions, counted from the record
            above. Both players on a winning doubles team are credited.
          </p>
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map((p, i) => (
              <div key={p.name} className="flex items-baseline gap-3 bg-white px-4 py-4">
                <span className="w-6 shrink-0 font-display text-sm text-ppa-navy/35">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ppa-navy">
                  {p.name}
                </span>
                <span className="shrink-0 font-display text-xl leading-none text-ppa-blue">
                  {p.titles}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Milestones
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            A Brief Timeline
          </h2>
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
            {MILESTONES.map((m) => (
              <div key={m.year} className="bg-white p-5">
                <p className="font-display text-3xl leading-none text-ppa-blue">{m.year}</p>
                <p className="mt-2 text-sm text-ppa-navy/70">{m.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep"
            >
              World Pickleball Rankings
            </Link>
            <Link
              href="/about/how-it-works"
              className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
            >
              How the Race Works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
