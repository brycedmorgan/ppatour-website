import {
  LEVEL_LABEL,
  type GridCell,
  type TicketGrid as TicketGridData,
} from "@/lib/ticket-grid-view";
import { withUtm } from "@/lib/utm";

/**
 * Day-by-day ticket pricing grid.
 *
 * Rows are the days Tixr actually sells, columns are access levels, and every
 * price is a real open tier from the listing that sells it — a single-day row
 * links to that day's own Tixr listing, not the parent, so a fan who wants
 * Sunday lands on Sunday.
 *
 * An empty cell renders a dash. There is no interpolation anywhere: if Tixr has
 * no open courtside tier on Wednesday, Wednesday's courtside cell is blank
 * rather than filled from a neighbouring day.
 *
 * Layout: a real table from `sm` up. Below that a table would either overflow or
 * crush to unreadable columns, so each day becomes its own card with the levels
 * listed inside it — same data, same order, no horizontal scrolling.
 */
export function TicketGrid({
  grid,
  campaign,
  accent = true,
}: {
  grid: TicketGridData;
  /**
   * UTM campaign — the event's canonical `MMYY-PPA-CITY-ST-USA` code, so grid
   * clicks are attributable to the event in Jackalope. Was the slug, which
   * Jackalope's join cannot resolve. See lib/event-code.ts.
   */
  campaign: string;
  /** Use the event's brand accent for prices; false keeps it navy. */
  accent?: boolean;
}) {
  const priceClass = accent ? "text-[var(--event-accent)]" : "text-ppa-navy";

  const buyHref = (cell: GridCell, content: string) =>
    withUtm(cell.url, { campaign, content });

  return (
    <div className="mt-6">
      {/* ── Desktop / tablet: the grid proper ───────────────────────────── */}
      <div className="hidden overflow-hidden border border-ppa-line sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ppa-line bg-white">
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Day
              </th>
              {grid.levels.map((l) => (
                <th
                  key={l}
                  className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45"
                >
                  {LEVEL_LABEL[l]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.days.map((day) => (
              <tr key={day.date} className="border-b border-ppa-line bg-white last:border-b-0">
                <td className="px-4 py-3 align-top">
                  <span className="block font-display text-base uppercase leading-none text-ppa-navy">
                    {day.weekday} {day.dayLabel}
                  </span>
                  {day.round && (
                    <span className="mt-1 block text-[11px] uppercase tracking-wide text-ppa-navy/40">
                      {day.round}
                    </span>
                  )}
                </td>
                {grid.levels.map((l) => {
                  const cell = day.cells[l];
                  return (
                    <td key={l} className="px-3 py-3 text-right align-top">
                      {cell ? (
                        <a
                          href={buyHref(cell, `ticket-grid-${day.date}-${l}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${cell.tierName}${
                            cell.allIn ? ` — $${cell.allIn} with fees` : ""
                          }`}
                          className="group inline-flex flex-col items-end"
                        >
                          <span
                            className={`font-display text-lg leading-none ${priceClass} transition-opacity group-hover:opacity-70`}
                          >
                            ${cell.from}
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-blue opacity-0 transition-opacity group-hover:opacity-100">
                            Buy →
                          </span>
                        </a>
                      ) : (
                        <span className="text-ppa-navy/25" aria-label="Not available">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: one card per day ────────────────────────────────────── */}
      <div className="grid gap-3 sm:hidden">
        {grid.days.map((day) => (
          <div key={day.date} className="border border-ppa-line bg-white p-4">
            <p className="font-display text-base uppercase leading-none text-ppa-navy">
              {day.weekday} {day.dayLabel}
            </p>
            {day.round && (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ppa-navy/40">
                {day.round}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-1.5">
              {grid.levels.map((l) => {
                const cell = day.cells[l];
                if (!cell) return null;
                return (
                  <a
                    key={l}
                    href={buyHref(cell, `ticket-grid-${day.date}-${l}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-baseline justify-between border-t border-ppa-line/70 pt-1.5 first:border-t-0 first:pt-0"
                  >
                    <span className="text-xs uppercase tracking-wide text-ppa-navy/55">
                      {LEVEL_LABEL[l]}
                    </span>
                    <span className={`font-display text-base leading-none ${priceClass}`}>
                      ${cell.from}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Multi-day and all-week passes ───────────────────────────────── */}
      {grid.multiDay.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Multi-Day &amp; All-Week
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grid.multiDay.map((pass) => (
              <a
                key={pass.name}
                href={withUtm(pass.url, {
                  campaign,
                  content: `ticket-grid-multiday-${pass.level}`,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline justify-between border border-ppa-line bg-ppa-paper p-4 transition-colors hover:border-ppa-navy/30"
              >
                <span className="pr-3 text-sm text-ppa-navy">{pass.name}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">
                    From
                  </span>
                  <span className={`font-display text-lg leading-none ${priceClass}`}>
                    ${pass.from}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-ppa-navy/40">
        Prices are the cheapest open ticket per day from Tixr, before fees. A dash
        means that option isn&rsquo;t on sale for that day. Single-day links open that
        day&rsquo;s own listing.
      </p>
    </div>
  );
}
