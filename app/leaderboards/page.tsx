import type { Metadata } from "next";
import Link from "next/link";
import { RankingTable } from "@/components/rankings/RankingTable";
import { REGION_OPTIONS, toRegionFilter } from "@/lib/ranking-filters";
import { countRankingMatches, getRankingPage, RANKING_GENDERS } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "The full World Pickleball Rankings — search any ranked pro by name, filter by region, and page the complete men's and women's standings.",
};

type SearchParams = { gender?: string; page?: string; q?: string; region?: string };

/** Windowed page list with ellipses, e.g. [1, "…", 5, 6, 7, "…", 27]. */
function pageList(current: number, total: number): (number | "…")[] {
  const wanted = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
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
  const query = { q, region };

  const data = await getRankingPage(
    genderKey,
    Number.isFinite(requestedPage) ? requestedPage : 1,
    query,
  );

  const { page, totalPages, total, pageSize, filtered, boardTotal } = data;

  /**
   * Search + region live in the URL, not in component state, so a result is
   * linkable and the page keeps working with JS off (the controls are a plain
   * GET form). Every gender tab and pagination link therefore has to carry them
   * forward — dropping them silently would reset the search on any click.
   */
  const href = (g: string, p: number) => {
    const params = new URLSearchParams({ gender: g, page: String(p) });
    if (q) params.set("q", q);
    if (region !== "all") params.set("region", region);
    return `/leaderboards?${params}`;
  };

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
        <p className="mt-3 max-w-xl text-sm text-white/60">
          The complete World Pickleball Rankings.{" "}
          {filtered
            ? total > 0 &&
              `${total.toLocaleString()} match${total === 1 ? "" : "es"} of ${boardTotal.toLocaleString()} ranked ${data.label.toLowerCase()}${
                totalPages > 1 ? ` — showing ${rangeStart}–${rangeEnd}.` : "."
              }`
            : total > 0 && `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()}.`}
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
              {filtered && (
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
              href={href(g.key, 1)}
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

        {/* Standings */}
        <div className="mt-6">
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
            aria-label="Leaderboard pages"
          >
            {page > 1 ? (
              <Link
                href={href(genderKey, page - 1)}
                aria-label="Previous page"
                className="inline-flex h-10 items-center border border-white/25 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-ppa-navy"
              >
                ← Prev
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/25">
                ← Prev
              </span>
            )}

            {pageList(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`gap-${i}`}
                  className="inline-flex h-10 w-6 items-center justify-center text-xs text-white/40"
                >
                  …
                </span>
              ) : p === page ? (
                <span
                  key={p}
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center bg-white px-2 text-xs font-bold tabular-nums text-ppa-navy"
                >
                  {p}
                </span>
              ) : (
                <Link
                  key={p}
                  href={href(genderKey, p)}
                  aria-label={`Page ${p}`}
                  className="inline-flex h-10 min-w-10 items-center justify-center border border-white/20 px-2 text-xs font-bold tabular-nums text-white/70 transition-colors hover:bg-white hover:text-ppa-navy"
                >
                  {p}
                </Link>
              ),
            )}

            {page < totalPages ? (
              <Link
                href={href(genderKey, page + 1)}
                aria-label="Next page"
                className="inline-flex h-10 items-center border border-white/25 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-ppa-navy"
              >
                Next →
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/25">
                Next →
              </span>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
