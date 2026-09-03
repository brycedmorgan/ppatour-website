import { Hint } from "./Hint";

/**
 * One metric on a paddle page: label, the raw number, and John Kew's 0–100
 * scaled score as a bar when he publishes one for that metric. A metric he has
 * not measured for this paddle says so, rather than drawing an empty bar that
 * reads as zero.
 */
export function ScoreBar({
  label,
  value,
  score,
  hint,
  highlightMax,
}: {
  label: string;
  value: string;
  score: number | null;
  hint: string;
  /** Whether "higher is more of the thing" — decides the bar colour. */
  highlightMax: boolean;
}) {
  const measured = value !== "—";
  const pct = score == null ? null : Math.max(0, Math.min(100, score));
  return (
    <div className="border-b border-ppa-line py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/60">
          {label}
          <Hint label={label} text={hint} align="left" />
        </p>
        <p className="text-sm font-bold tabular-nums text-ppa-navy">
          {measured ? value : <span className="font-medium text-ppa-navy/40">Not measured</span>}
        </p>
      </div>
      {pct != null && (
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-ppa-line" aria-hidden>
            <div
              className={`h-full ${highlightMax ? "bg-ppa-blue" : "bg-ppa-navy/60"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-8 text-right text-[11px] font-bold tabular-nums text-ppa-navy/55">
            {Math.round(pct)}
          </span>
        </div>
      )}
    </div>
  );
}
