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

  // Current No. 1's: the top man + top woman.
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
          {/* Jeff Watson, 7/31: "the ranking one should be the header of the
              ranking page." The WPR identity ships a horizontal wordmark AND a
              stacked combo mark precisely so a narrow screen doesn't have to
              shrink a 17:1 lockup down to unreadable — so we swap marks rather
              than scale one past its floor. The <h1> stays in the DOM as
              screen-reader/SEO text: replacing a heading with an image must not
              cost us the heading. */}
          <h1 className="sr-only">World Pickleball Rankings</h1>
          <div aria-hidden className="mt-3">
            <Image
              src="/ppa/logos/wpr-combo-color.svg"
              alt=""
              width={530}
              height={233}
              priority
              className="h-20 w-auto sm:hidden"
            />
            <Image
              src="/ppa/logos/wpr-horizontal-color.svg"
              alt=""
              width={1003}
              height={60}
              priority
              className="hidden h-9 w-auto sm:block lg:h-11"
            />
          </div>
          <div className="mt-4 max-w-2xl space-y-3 text-sm leading-relaxed text-ppa-navy/60">
            {/* Copy: Jeff + Nathan's audit doc, 7/27. */}
            <p>
              Designed to identify the top overall pickleball players in the
              world, the World Pickleball Ranking is a composite ranking that
              takes into account performance across all three disciplines:
              men&apos;s/women&apos;s doubles, mixed doubles, and singles.
            </p>
            <p>
              The World Pickleball Ranking is determined using a weighted
              point system based on a combination of each player&apos;s Carvana
              PPA Tour points earned in the last 52 weeks across all three
              disciplines:
            </p>
            <ul className="space-y-1.5">
              {[
                ["Men's/Women's Doubles", "50%"],
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

      {/* The Current No. 1&apos;s */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Atop the Rankings
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            The Current No. 1&apos;s
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
            The complete boards — every ranked pro, top to bottom. Click any
            name to open that pro&apos;s profile.
          </p>
          <div className="mt-6">
            {ranking.source === "unavailable" ? (
              /* Say the board is down rather than print numbers we invented.
                 The demo dataset used to land here on any API hiccup and read
                 as real — Fed at 9,840 when he is on 10,895 (7/29). */
              <div className="border border-ppa-line bg-white px-4 py-12 text-center">
                <p className="font-display text-lg uppercase text-ppa-navy">
                  Rankings are temporarily unavailable
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-ppa-navy/55">
                  We couldn&apos;t reach the World Pickleball Rankings feed just now. Rather
                  than show numbers that might be out of date, we&apos;ve left this blank —
                  please check back shortly.
                </p>
                <a
                  href="https://www.pickleball.com/rankings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                >
                  View on Pickleball.com ↗
                </a>
              </div>
            ) : (
              <RankingsBoard divisions={ranking.divisions} />
            )}
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
            {/* Hannah 7/28: people still search for a pro's singles/doubles/
                mixed ranking. If we don't answer that query, someone else
                outranks us for it. */}
            <a
              href="https://www.pickleball.com/rankings?utm_source=ppatour&utm_medium=website&utm_campaign=rankings&utm_content=event-specific-standings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-ppa-navy"
            >
              Event-Specific Standings ↗
            </a>
            <Link
              href="/about/how-it-works"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-ppa-navy"
            >
              How Points Work
            </Link>
          </div>

          {/* Bryce, 7/31: put Be the Best "by the rankings stuff as well" — and
              this is the one page on the site where the tagline is a statement
              of fact rather than a slogan. The board above is literally the
              answer to it, so the lockup closes the page instead of opening it.
              Decorative: the tagline is already the footer's, and a second
              "Be the Best" read aloud on every rankings visit is noise. */}
          <div className="mt-12 flex justify-center border-t border-white/10 pt-10">
            <Image
              src="/ppa/logos/be-the-best-white.svg"
              alt=""
              aria-hidden
              width={881}
              height={172}
              className="h-10 w-auto opacity-90 sm:h-14"
            />
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
