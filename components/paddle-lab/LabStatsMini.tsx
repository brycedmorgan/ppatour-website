import Link from "next/link";
import { formatMetric, METRIC_BY_KEY, type Paddle } from "@/lib/paddle-lab";

const KEYS = ["power", "pop", "spin", "swingWeight", "twistWeight"] as const;

/**
 * The five headline measurements for a paddle, in a dark, compact strip. Sits
 * inside the athlete "In the Bag" card (Bryce, 9/3: share the stats on the
 * player's page too) under the buy button. Only renders for a tested paddle;
 * a shop-only match shows nothing rather than five dashes.
 */
export function LabStatsMini({ paddle }: { paddle: Paddle }) {
  if (!paddle.tested) return null;
  const rows = KEYS.map((k) => METRIC_BY_KEY.get(k)!).map((d) => ({
    d,
    value: formatMetric(d, d.value(paddle)),
    score: d.score ? d.score(paddle) : null,
  }));
  if (rows.every((r) => r.value === "—")) return null;

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Lab data</p>
      <dl className="mt-2 grid grid-cols-5 gap-2">
        {rows.map(({ d, value, score }) => (
          <div key={d.key} className="min-w-0">
            <dt className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/45">{d.short}</dt>
            <dd className="mt-0.5 text-xs font-bold tabular-nums text-white">
              {value === "—" ? <span className="font-medium text-white/35">—</span> : value.replace(/ (mph|rpm)$/, "")}
            </dd>
            {score != null && (
              <div className="mt-1 h-1 w-full bg-white/15" aria-hidden>
                <div className="h-full bg-ppa-sky" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
              </div>
            )}
          </div>
        ))}
      </dl>
      <Link
        href={paddle.href}
        className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-sky hover:text-white"
      >
        Full lab data →
      </Link>
    </div>
  );
}
