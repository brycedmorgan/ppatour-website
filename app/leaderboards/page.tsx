import type { Metadata } from "next";
import Link from "next/link";
import { RankingTable } from "@/components/rankings/RankingTable";
import { getRankingPage, RANKING_GENDERS } from "@/lib/rankings-api";

export const metadata: Metadata = {
  title: "Leaderboards",
  description:
    "The full World Pickleball Rankings — complete men's and women's standings, 50 players per page.",
};

type SearchParams = { gender?: string; page?: string };

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
  const data = await getRankingPage(genderKey, Number.isFinite(requestedPage) ? requestedPage : 1);

  const { page, totalPages, total, pageSize } = data;
  const href = (g: string, p: number) => `/leaderboards?gender=${g}&page=${p}`;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total || page * pageSize);

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
          The complete World Pickleball Rankings. {total > 0 && `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()}.`}
        </p>

        {/* Gender tabs — reset to page 1 on switch */}
        <div className="mt-6 flex gap-1">
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
            <p className="border border-white/10 px-4 py-10 text-center text-sm text-white/55">
              No players on this page.
            </p>
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
