import Link from "next/link";

/**
 * The standings paginator, shared by /rankings and /leaderboards.
 *
 * ⚠ ONE COMPONENT ON PURPOSE. These two pages show the same boards at the same
 * 50 rows a page, and this repo's recurring failure mode is two surfaces that
 * render the same data drifting apart silently (the event page vs NationalsLive,
 * the curated names vs lib/tv-schedule). A windowing rule that differs between
 * them would be that bug in its most invisible form.
 *
 * It deliberately carries NO `"use client"` and NO hooks, so it renders on the
 * server for /leaderboards — where pagination has to keep working with JS off —
 * and compiles into the client bundle for RankingsBoard, where the board lives
 * in component state and there is no URL to link to.
 *
 *  - `hrefFor` → renders <Link>s. Linkable, crawlable, no JS required.
 *  - `onSelect` → renders <button>s. For a board paginated in memory.
 *
 * Exactly one of the two is expected; `hrefFor` wins if both are passed.
 */

/** Windowed page list with ellipses, e.g. [1, "…", 5, 6, 7, "…", 27]. */
export function pageList(current: number, total: number): (number | "…")[] {
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

const STEP =
  "inline-flex h-10 items-center border border-white/25 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-ppa-navy";
const STEP_OFF =
  "inline-flex h-10 items-center px-4 text-xs font-bold uppercase tracking-[0.12em] text-white/25";
const NUM =
  "inline-flex h-10 min-w-10 items-center justify-center border border-white/20 px-2 text-xs font-bold tabular-nums text-white/70 transition-colors hover:bg-white hover:text-ppa-navy";
const NUM_ON =
  "inline-flex h-10 min-w-10 items-center justify-center bg-white px-2 text-xs font-bold tabular-nums text-ppa-navy";

export function RankingPager({
  page,
  totalPages,
  hrefFor,
  onSelect,
  label = "Pages",
}: {
  page: number;
  totalPages: number;
  hrefFor?: (p: number) => string;
  onSelect?: (p: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const step = (p: number, text: string, aria: string) =>
    hrefFor ? (
      <Link href={hrefFor(p)} aria-label={aria} className={STEP}>
        {text}
      </Link>
    ) : (
      <button type="button" onClick={() => onSelect?.(p)} aria-label={aria} className={STEP}>
        {text}
      </button>
    );

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label={label}>
      {page > 1 ? (
        step(page - 1, "← Prev", "Previous page")
      ) : (
        <span className={STEP_OFF}>← Prev</span>
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
          <span key={p} aria-current="page" className={NUM_ON}>
            {p}
          </span>
        ) : hrefFor ? (
          <Link key={p} href={hrefFor(p)} aria-label={`Page ${p}`} className={NUM}>
            {p}
          </Link>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onSelect?.(p)}
            aria-label={`Page ${p}`}
            className={NUM}
          >
            {p}
          </button>
        ),
      )}

      {page < totalPages ? (
        step(page + 1, "Next →", "Next page")
      ) : (
        <span className={STEP_OFF}>Next →</span>
      )}
    </nav>
  );
}
