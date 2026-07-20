import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { getFullRankings } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "World Pickleball Rankings",
  description:
    "The World Pickleball Rankings — combined men's and women's standings, updated through the PPA Tour season.",
};

export default async function RankingsPage() {
  // 52-week World Pickleball Rankings — the COMPLETE boards, every ranked
  // pro in both genders (Connor: "all the way", no 25-row cap).
  const ranking = await getFullRankings();

  // Current No. 1s: the top man + top woman.
  const leaders = ranking.divisions
    .map((d) => ({ division: d.label, entry: d.entries[0] }))
    .filter((l) => l.entry);

  return (
    <>
      {/* Hero */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Standings
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            World Pickleball Rankings
          </h1>
          <div className="mt-4 max-w-2xl space-y-3 text-sm leading-relaxed text-ppa-navy/60">
            <p>
              The World Pickleball Ranking represents a comprehensive system
              designed to identify the top overall pickleball players in the
              world. This composite ranking takes into account performance
              across all three events: gender doubles, mixed doubles, and
              singles.
            </p>
            <p>
              World Pickleball Rankings are determined using a weighted point
              system based on a combination of each player&apos;s PPA Tour
              points earned in the last 52 weeks across all three events:
            </p>
            <ul className="space-y-1.5">
              {[
                ["Gender Doubles", "50%"],
                ["Mixed Doubles", "35%"],
                ["Singles", "15%"],
              ].map(([event, weight]) => (
                <li key={event} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
                  <span className="text-ppa-navy/70">
                    <span className="font-bold text-ppa-navy">{event}:</span>{" "}
                    {weight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The Current No. 1s */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Atop the Rankings
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            The Current No. 1s
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {leaders.map(({ division, entry }) => (
              <Link
                key={division}
                href={entry.profileUrl}
                target={entry.hasLocalProfile ? undefined : "_blank"}
                rel={entry.hasLocalProfile ? undefined : "noopener noreferrer"}
                className="group flex items-center gap-4 border border-ppa-line bg-ppa-paper p-4 transition-colors hover:bg-white"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep">
                  {entry.headshot ? (
                    <Image
                      src={entry.headshot}
                      alt={entry.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {division} · No. 1
                  </span>
                  <span className="mt-0.5 font-display text-lg uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                    {entry.name}
                  </span>
                  <span className="mt-0.5 text-xs tabular-nums text-ppa-navy/55">
                    {entry.points.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Full standings */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Full Standings
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            Men&apos;s &amp; Women&apos;s Rankings
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            The complete boards — every ranked pro, top to bottom. Switch
            between men&apos;s and women&apos;s, and click any name to open
            that pro&apos;s profile.
          </p>
          <div className="mt-6">
            <RankingsBoard divisions={ranking.divisions} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/leaderboards"
              className="inline-flex h-11 items-center bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              See Full Leaderboard →
            </Link>
            <Link
              href="/athletes"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-ppa-navy"
            >
              Full Roster →
            </Link>
            <Link
              href="/about/how-it-works"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-ppa-navy"
            >
              How Points Work
            </Link>
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
