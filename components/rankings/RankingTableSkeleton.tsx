import type { CSSProperties } from "react";

/**
 * Loading state for a standings table (dark section).
 *
 * ⚠ It reuses `.wpr-row` and sets `--wpr-cols` to the same three-column
 * template {@link RankingTable} uses, so the placeholder rows land on the exact
 * grid the real rows will. That is a CLS decision, not a styling one: this
 * fallback is swapped for content of the same shape, and a skeleton on a
 * different grid would shift every row when it resolves.
 *
 * Row height is 38px avatar + 2 × 0.625rem padding ≈ 59px — the same figure
 * `contain-intrinsic-size` uses in globals.css.
 *
 * `header={false}` + `continued` is the "more rows are still arriving" variant
 * used under a partly-rendered table on /rankings; it drops the column header
 * and the top border so it reads as one continuous board.
 */
const NAME_WIDTHS = ["58%", "42%", "71%", "49%", "64%", "38%", "55%", "46%"];

export function RankingTableSkeleton({
  rows = 10,
  header = true,
  continued = false,
  label = "Loading rankings",
}: {
  rows?: number;
  header?: boolean;
  continued?: boolean;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`border border-white/10 ${continued ? "border-t-0" : ""}`}
      style={{ "--wpr-cols": "2.5rem 1fr 5rem" } as CSSProperties}
    >
      {header && (
        <div className="wpr-row border-b border-white/10 bg-ppa-navy-deep text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Points</span>
        </div>
      )}
      <div className="animate-pulse motion-reduce:animate-none">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="wpr-row border-b border-white/5 last:border-b-0">
            <span className="h-7 w-7 bg-white/10" />
            <span className="flex min-w-0 items-center gap-3">
              <span className="size-9.5 shrink-0 rounded-full bg-white/10" />
              <span
                className="h-3 bg-white/10"
                style={{ width: NAME_WIDTHS[i % NAME_WIDTHS.length] }}
              />
            </span>
            <span className="ml-auto h-3 w-10 bg-white/10" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
