import { goldGridTotal, type Tournament } from "@/lib/placeholder-data";

/**
 * The Gold Prize Grid (Connor, 7/23: "clickable to see the gold grid… make us
 * look the biggest and best"). Leads with the real on-court purse for the event
 * BIG, then expands to the full grid — every one of the five pro divisions pays
 * a champion, finalist, and semifinalist. Native <details> so it's clickable
 * with zero JS (works before hydration). `accent` tints it to the event brand.
 */
const DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

const FINISHES = [
  { medal: "🥇", label: "Champion", tone: "text-ppa-yellow" },
  { medal: "🥈", label: "Finalist", tone: "text-white/70" },
  { medal: "🥉", label: "Semifinalist", tone: "text-[#e0a060]" },
];

export function GoldPrizeGrid({
  t,
  accent = "#228be6",
}: {
  t: Tournament;
  accent?: string;
}) {
  const total = goldGridTotal(t);
  if (!total) return null;

  return (
    <div className="overflow-hidden border border-white/12 bg-ppa-navy text-white">
      {/* gold rule */}
      <div className="h-1.5 bg-gradient-to-r from-ppa-yellow via-[#f5d020] to-[#e0a060]" />
      <div className="p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-yellow">
          Gold Prize Grid
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
          <p className="font-display text-5xl leading-[0.9] text-white sm:text-6xl">
            {total}
          </p>
          <p className="pb-1 text-sm text-white/60">
            in on-court prize money — paid across all five pro divisions and
            every podium finish.
          </p>
        </div>

        <details className="group mt-6">
          <summary
            className="inline-flex cursor-pointer list-none items-center gap-2 border border-white/20 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-[var(--gg-accent)] hover:text-ppa-yellow"
            style={{ ["--gg-accent" as string]: accent }}
          >
            <span className="group-open:hidden">See the Full Grid</span>
            <span className="hidden group-open:inline">Hide the Grid</span>
            <span className="transition-transform group-open:rotate-180">↓</span>
          </summary>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="py-2 pr-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                    Division
                  </th>
                  {FINISHES.map((f) => (
                    <th
                      key={f.label}
                      className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/45"
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIVISIONS.map((d) => (
                  <tr key={d} className="border-b border-white/8">
                    <td className="py-3 pr-4 font-display text-sm uppercase text-white">
                      {d}
                    </td>
                    {FINISHES.map((f) => (
                      <td
                        key={f.label}
                        className={`px-3 py-3 text-center text-xl ${f.tone}`}
                      >
                        {f.medal}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-white/40">
            Gold, silver, and bronze paid to every division podium. The Gold
            Prize Grid is on-court prize money only — separate from the
            season&apos;s appearance fees.
          </p>
        </details>
      </div>
    </div>
  );
}
