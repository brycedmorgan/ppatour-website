import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { RankingsBoard } from "@/components/rankings/RankingsBoard";
import { ExplainerVideos } from "@/components/video/ExplainerVideos";
import { EXPLAINER_SERIES, RANKINGS_VIDEOS } from "@/lib/explainer-videos";
import { FULL_PAGE_SIZE, getRankings } from "@/lib/rankings-api";

/**
 * ISR. The complete boards are ~2,000 rows. Rendering that per request is the
 * expensive part, and rankings move on event results, not on the minute.
 *
 * Before this, every live-data page was rendered per request and served
 * `cache-control: private, no-store` with `x-vercel-cache: MISS` — nothing
 * reached the edge cache. /rankings was measured at a 34.8s TTFB on one pull
 * with zero traffic. Data was already cached (lib/pb-fetch tags its fetches);
 * what was uncached was the HTML.
 */
export const revalidate = 300;

/**
 * ⚠ `force-static` is load-bearing, not decoration.
 *
 * This page built as Static locally but **Dynamic in production** — confirmed
 * in the Vercel build log (`ƒ /rankings`). The difference is `PB_API_TOKEN`:
 * with a token the rankings fetch actually runs, and `lib/pb-fetch` retries a
 * 429 with `cache: "no-store"` (the partner_rankings endpoint rate-limits
 * under build load — that is the whole reason the retry exists). A single
 * no-store fetch during render opts the route out of static generation, so
 * whether this page was cacheable came down to whether upstream throttled us
 * mid-build. Non-deterministic, and it lost: every request re-rendered ~2,000
 * rows at the origin, with a 34.8s TTFB on one measured pull.
 *
 * force-static pins the intent instead of hoping the build wins the race. This
 * page reads no cookies, headers or searchParams, so nothing is lost by it.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "World Pickleball Rankings",
  description:
    "The World Pickleball Rankings — combined men's and women's standings, updated through the PPA Tour season.",
};

/**
 * How the composite is weighted — the 50/35/15 split, as a figure.
 *
 * Part-to-whole with three parts, so it's one horizontal stacked bar rather
 * than three separate meters: the point is that these sum to a single ranking,
 * which three bars would not say. Segment width IS the weight — no exaggerated
 * scale — so singles reads as the sliver it is.
 *
 * ⚠ Palette is `ppa-blue-deep → ppa-blue → ppa-sky`, a single-hue ramp in
 * weight order (heaviest darkest). Validated, not eyeballed: all six checks
 * pass against the ppa-paper surface (worst adjacent pair ΔE 15.7 protan /
 * 15.4 normal). The brand navy FAILS the lightness and chroma floors and the
 * yellow fails contrast at 1.21, so neither can carry a fill here.
 *
 * `ppa-sky` carries a contrast WARN (1.89 vs surface), which obliges visible
 * labels — every segment is direct-labelled below, so identity never rests on
 * colour alone. Keep those labels if you restyle this.
 */
const WEIGHTS = [
  { label: "Men's / Women's Doubles", weight: 50, fill: "bg-ppa-blue-deep" },
  { label: "Mixed Doubles", weight: 35, fill: "bg-ppa-blue" },
  { label: "Singles", weight: 15, fill: "bg-ppa-sky" },
] as const;

function WeightingBreakout() {
  return (
    <figure className="m-0 border border-ppa-line bg-white p-5 sm:p-6">
      <figcaption className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
        How the ranking is weighted
      </figcaption>

      {/* The bar. `gap-[2px]` is the surface gap between segments — the paper
          showing through is what separates them, not a border. */}
      <div className="mt-4 flex h-3 w-full gap-[2px]" role="presentation">
        {WEIGHTS.map((w, i) => (
          <span
            key={w.label}
            style={{ width: `${w.weight}%` }}
            className={`${w.fill} ${i === 0 ? "rounded-l-[4px]" : ""} ${
              i === WEIGHTS.length - 1 ? "rounded-r-[4px]" : ""
            }`}
          />
        ))}
      </div>

      <dl className="mt-5 space-y-3">
        {WEIGHTS.map((w) => (
          <div key={w.label} className="flex items-baseline gap-3">
            <span className={`${w.fill} mt-1.5 size-2 shrink-0 rounded-[1px]`} />
            <dt className="min-w-0 flex-1 text-sm font-bold text-ppa-navy">
              {w.label}
            </dt>
            {/* Text tokens, never the series colour — the chip beside it
                carries identity. */}
            <dd className="font-display text-xl leading-none tabular-nums text-ppa-navy">
              {w.weight}
              <span className="text-sm text-ppa-navy/50">%</span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-t border-ppa-line pt-3 text-xs leading-relaxed text-ppa-navy/50">
        Weighted across the last 52 weeks of Carvana PPA Tour results.
      </p>
    </figure>
  );
}

export default async function RankingsPage() {
  /**
   * 52-week World Pickleball Rankings, {@link FULL_PAGE_SIZE} rows a page.
   *
   * ⚠ THE BOARDS ARE PAGINATED NOW, WHICH REVERSES CONNOR'S "ALL THE WAY".
   * Wesley asked for it directly on 8/5 ("add pagination to the /rankings page.
   * 50 per page"), knowing that ruling — this is the same call the 8/3 pt. 4
   * session built, measured (DOM 18,646 → 1,292, HTML 2.04 → 0.88 MB) and then
   * reverted for lack of it. **Don't re-revert it on the strength of the old
   * note.** Every ranked pro is still reachable — by paging, by the name search
   * (which runs against the whole board, not the page), and on /leaderboards.
   *
   * The server renders page 1 of each board and the rest arrives from
   * /api/rankings after load, so the search can reach No. 1,300 without the
   * ~2,000 rows of markup that made this page 2.10 MB. See `useFullBoards` and
   * `usePagedBoards` in RankingsBoard.
   */
  const ranking = await getRankings(FULL_PAGE_SIZE);

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
          {/* Copy left, the weighting as a figure right (Bryce, 8/3: "balanced
              better up top… highlight the breakout… use space better"). The
              hero used ~half the container and left the rest empty, while the
              50/35/15 split — the thing that actually explains the ranking —
              sat at the bottom as three bullets. */}
          <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-ppa-navy/60">
              {/* Copy: Jeff + Nathan's audit doc, 7/27. */}
              <p>
                Designed to identify the top overall pickleball players in the
                world, the World Pickleball Ranking is a composite ranking that
                takes into account performance across all three disciplines:
                men&apos;s/women&apos;s doubles, mixed doubles, and singles.
              </p>
              <p>
                It is determined using a weighted point system based on each
                player&apos;s Carvana PPA Tour points earned in the last 52
                weeks.
              </p>
            </div>

            <WeightingBreakout />
          </div>
        </div>
      </section>

      {/* Understand the ranking — the explainer videos.

          Wesley, 8/5: above the board AND above the Current No. 1's, so it sits
          directly under the hero — the hero explains what the WPR is, and these
          two videos are the long form of that same explanation.

          White, matching the Current No. 1's section directly below it (his
          call, 8/5). The two light sections read as one continuous band rather
          than as separate stripes — so the hero hands off to a single pale
          stretch, then the navy board.

          ⚠ The iframe still only mounts on click (see ExplainerVideos). That
          matters more here than anywhere: this is the first thing below the hero
          on a ~2MB document, and eager players would land squarely on this
          page's LCP. */}
      <section id="explained" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              {EXPLAINER_SERIES}
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Understand the Rankings
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Where the World Pickleball Ranking came from, and how the tour&apos;s
            points feed it.
          </p>
          <div className="mt-6">
            <ExplainerVideos videos={RANKINGS_VIDEOS} />
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
            The complete boards — every ranked pro, top to bottom. Search by
            name or filter by region, and click any name to open that
            pro&apos;s profile.
          </p>

          {/* Section links, above the search rather than under the board
              (Wesley, 8/5). At the foot they sat below 50 rows and a paginator,
              so "See Full Leaderboard" — the way to a linkable, deep-pageable
              view of this same data — was the last thing you could reach.
              ⚠ Left-aligned, not centred as they were: they now sit directly
              under left-aligned copy, and a centred row there reads as a
              misalignment rather than as a deliberate footer. */}
          <div className="mt-6 flex flex-wrap gap-3">
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
              /* `filterable` — the name search + region filter. Only the full
                 boards get it; the homepage/athletes top-10 modules don't.
                 `fullBoardsUrl` makes these rows a seed: the rest of both
                 boards arrives after load.

                 ⚠ The trailing slash is load-bearing — `trailingSlash: true`
                 in next.config, so `/api/rankings` 308s and the board would
                 wait out a redirect before the fetch even starts. */
              <RankingsBoard
                divisions={ranking.divisions}
                filterable
                fullBoardsUrl="/api/rankings/"
                pageSize={FULL_PAGE_SIZE}
              />
            )}
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
