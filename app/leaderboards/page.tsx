import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RankingPager } from "@/components/rankings/RankingPager";
import { RankingTable } from "@/components/rankings/RankingTable";
import { RankingTableSkeleton } from "@/components/rankings/RankingTableSkeleton";
import {
  isFiltering,
  REGION_OPTIONS,
  type RegionFilter,
  toRegionFilter,
} from "@/lib/ranking-filters";
import { countRankingMatches, getRankingPage, RANKING_GENDERS } from "@/lib/rankings-api";

/**
 * ⚠ THE BOARD FETCHES HERE ARE ONLY CACHED BECAUSE OF THIS LINE (9/5). This
 * page reads `searchParams` — a Request-time API — before it asks for a board,
 * and Next’s default `fetchCache: "auto"` "will not cache fetch requests that
 * are discovered AFTER Request-time APIs are used". So every page, search and
 * region filter re-paged both boards from upstream: up to ten requests per
 * gender, per view. It is the same class of bug as the `force-dynamic` one on
 * /api/rankings, arrived at from the other direction.
 *
 * `default-cache` lets the `revalidate` + `tags` that `lib/rankings-api.ts`
 * already passes be respected. The page stays dynamic — this changes what its
 * DATA does, not when the page renders.
 */
export const fetchCache = "default-cache";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "The full World Pickleball Rankings — search any ranked pro by name, filter by region, and page the complete men's and women's standings.",
};

type SearchParams = { gender?: string; page?: string; q?: string; region?: string };

/**
 * Search + region live in the URL, not in component state, so a result is
 * linkable and the page keeps working with JS off (the controls are a plain GET
 * form). Every gender tab and pagination link therefore has to carry them
 * forward — dropping them silently would reset the search on any click.
 */
function hrefFor(g: string, p: number, q: string, region: RegionFilter) {
  const params = new URLSearchParams({ gender: g, page: String(p) });
  if (q) params.set("q", q);
  if (region !== "all") params.set("region", region);
  return `/leaderboards?${params}`;
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const genderKey = RANKING_GENDERS.some((g) => g.key === sp.gender) ? sp.gender! : "men";
  const requestedPage = Number.parseInt(sp.page ?? "1", 10);
  const q = (sp.q ?? "").trim();
  const region = toRegionFilter(sp.region);

  /**
   * ⚠ NOTHING IS AWAITED FROM HERE DOWN — that is the point.
   *
   * The standings live behind a <Suspense> boundary rather than being awaited
   * at the top of the page. `getRankingPage` reads the WHOLE board before it can
   * slice 50 rows (it has to: a name search must be able to reach No. 1,300, and
   * the unfiltered total has to count rows that actually render — see its doc
   * comment), and this route is dynamic on searchParams, so every hit paid for
   * that assembly before a single byte left the server.
   *
   * Now the shell — heading, search form, gender tabs — streams immediately and
   * the table swaps in behind a skeleton when it's ready. The controls are usable
   * while it loads, which is what makes this more than a cosmetic change.
   */
  return (
    <section className="min-h-[70svh] bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
            Full Standings
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Leaderboards
          </h1>
          <Link
            href="/rankings"
            className="text-xs font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white"
          >
            ← Rankings overview
          </Link>
        </div>
        {/* ⚠ The counts that used to live here ("Showing 1–50 of 1,324") moved
            down next to the table, inside the streaming boundary. They describe
            a result set we haven't read yet, so leaving them up here would have
            held the whole shell — including the search box — behind the board. */}
        <p className="mt-3 max-w-xl text-sm text-white/60">
          The complete World Pickleball Rankings — every ranked pro, searchable
          by name and filterable by region.
        </p>

        {/*
          Search + region as a GET form: no JS required, and the result is a
          shareable URL. `page` is deliberately absent so any new search starts
          at page 1; gender rides along as a hidden field so searching doesn't
          bounce you back to the men's board.
        */}
        <form method="get" action="/leaderboards" className="mt-6">
          <input type="hidden" name="gender" value={genderKey} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="lb-search" className="sr-only">
                Search players by name
              </label>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id="lb-search"
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search any ranked player by name…"
                autoComplete="off"
                className="h-10 w-full border border-white/20 bg-ppa-navy-deep pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ppa-sky"
              />
            </div>
            <label htmlFor="lb-region" className="sr-only">
              Filter by region
            </label>
            <select
              id="lb-region"
              name="region"
              defaultValue={region}
              className="h-10 shrink-0 border border-white/20 bg-ppa-navy-deep px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white outline-none focus:border-ppa-sky"
            >
              {REGION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-ppa-navy text-white">
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                Search
              </button>
              {/* Derived from the URL, not from the result set — so the shell
                  can render it without waiting on the board. */}
              {isFiltering(q, region) && (
                <Link
                  href={`/leaderboards?gender=${genderKey}&page=1`}
                  className="inline-flex h-10 items-center border border-white/25 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:bg-white hover:text-ppa-navy"
                >
                  Clear
                </Link>
              )}
            </div>
          </div>
        </form>

        {/* Gender tabs — reset to page 1 on switch, search/region carried over */}
        <div className="mt-4 flex gap-1">
          {RANKING_GENDERS.map((g) => (
            <Link
              key={g.key}
              href={hrefFor(g.key, 1, q, region)}
              aria-current={g.key === genderKey ? "page" : undefined}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                g.key === genderKey
                  ? "bg-white text-ppa-navy"
                  : "border border-white/20 text-white/60 hover:text-white"
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>

        {/* Standings — the streaming boundary.

            `key` re-arms the fallback on every new query: without it a
            client-side navigation to page 2 (or a new search) would sit on the
            previous page's rows with no sign anything was happening, which is
            the same "did that click work?" problem this change exists to fix. */}
        <Suspense
          key={`${genderKey}:${requestedPage}:${q}:${region}`}
          fallback={<LeaderboardSkeleton />}
        >
          <LeaderboardResults
            genderKey={genderKey}
            requestedPage={requestedPage}
            q={q}
            region={region}
          />
        </Suspense>
      </div>
    </section>
  );
}

/** Reserves the table's space while the board is being assembled. */
function LeaderboardSkeleton() {
  return (
    <div className="mt-6">
      <p className="mb-3 h-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
        Loading the board…
      </p>
      {/* A full page is 50 rows; 12 is enough to fill a viewport without laying
          out 50 placeholders we're about to throw away. */}
      <RankingTableSkeleton rows={12} label="Loading the leaderboard" />
    </div>
  );
}

/**
 * The result set: count line, table, pagination. Everything here needs the
 * board, so it all lives inside the one boundary — a second Suspense around the
 * pagination would only mean two skeletons resolving a millisecond apart.
 */
async function LeaderboardResults({
  genderKey,
  requestedPage,
  q,
  region,
}: {
  genderKey: string;
  requestedPage: number;
  q: string;
  region: RegionFilter;
}) {
  const query = { q, region };
  const data = await getRankingPage(
    genderKey,
    Number.isFinite(requestedPage) ? requestedPage : 1,
    query,
  );

  const { page, totalPages, total, pageSize, filtered, boardTotal } = data;
  const href = (g: string, p: number) => hrefFor(g, p, q, region);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total || page * pageSize);

  // Only when this board came up empty — see countRankingMatches.
  const otherGender = RANKING_GENDERS.find((g) => g.key !== genderKey);
  const otherMatches =
    filtered && total === 0 && otherGender
      ? await countRankingMatches(otherGender.key, query)
      : 0;

  const regionLabel = REGION_OPTIONS.find((o) => o.value === region)?.label;

  return (
    <>
      {/* What's on screen, in the same slot the skeleton's line occupied. */}
      <p className="mb-3 mt-6 h-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
        {total === 0
          ? ""
          : filtered
            ? `${total.toLocaleString()} match${total === 1 ? "" : "es"} of ${boardTotal.toLocaleString()} ranked ${data.label.toLowerCase()}${
                totalPages > 1 ? ` — showing ${rangeStart}–${rangeEnd}` : ""
              }`
            : `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()}`}
      </p>

      {data.entries.length > 0 ? (
        <RankingTable entries={data.entries} />
      ) : (
        <div className="border border-white/10 px-4 py-10 text-center">
          <p className="text-sm text-white/55">
            {filtered
              ? [
                  `No ranked ${data.label.toLowerCase()}`,
                  q ? ` match “${q}”` : " match",
                  region !== "all" ? ` in ${regionLabel}` : "",
                  ".",
                ].join("")
              : "No players on this page."}
          </p>
          {/* A correct search that happens to be on the wrong board is the
              most likely zero-result — say where the matches are. */}
          {otherMatches > 0 && otherGender && (
            <Link
              href={href(otherGender.key, 1)}
              className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline"
            >
              {otherMatches} {otherMatches === 1 ? "match" : "matches"} in{" "}
              {otherGender.label} →
            </Link>
          )}
        </div>
      )}

      {/* Pagination. Shared with the /rankings board — see RankingPager for why
          it is one component and how it stays link-based (and JS-free) here. */}
      <RankingPager
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => href(genderKey, p)}
        label="Leaderboard pages"
      />
    </>
  );
}
