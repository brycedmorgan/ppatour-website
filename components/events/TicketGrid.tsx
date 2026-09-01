import {
  LEVEL_LABEL,
  type GridDay,
  type TicketGrid as TicketGridData,
} from "@/lib/ticket-grid-view";
import { withUtm } from "@/lib/utm";

/**
 * The event page's ticket block — the days this stop sells, each one a door
 * into Tixr, plus its multi-day passes.
 *
 * ⚠ THIS WAS A PRICE MATRIX UNTIL 9/1 AND CONNOR CUT IT. Rows were days,
 * columns were access levels, and every cell printed a from-price:
 *
 *     DAY            GROUNDS   COURTSIDE   VIP
 *     TUE SEP 15       $25         —        —
 *     WED SEP 16       $25         —        —
 *     THU SEP 17       $25        $40      $300
 *
 * Connor, 9/1, on that table: "This whole thing is just why? It's not doing us
 * anything. Not impressive. That part should just take us over to Tixr."
 * Eighteen cells, most of them the same $25 or a dash, doing the work of one
 * button — and the price it printed is the cheapest OPEN tier before fees, so
 * it is also the number most likely to disagree with what Tixr charges by the
 * time somebody reads it.
 *
 * What survives is the part that a button can't do: this stop's days, the round
 * each one holds, and a link that lands a fan who wants Sunday on SUNDAY's own
 * Tixr listing rather than the parent event page. Prices now live in one place
 * — Tixr — plus the "from $X" on the hero and the sticky bar.
 *
 * The multi-day passes keep their prices ("that one's fine"): three cards, three
 * genuinely different products, and the all-week number is the one a travelling
 * fan is actually shopping.
 *
 * Layout: day rows are a single responsive grid, so nothing needs a table or a
 * separate mobile rendering.
 */
export function TicketGrid({
  grid,
  campaign,
  eventTicketsUrl,
  accent = true,
}: {
  grid: TicketGridData;
  /**
   * UTM campaign — the event's canonical `MMYY-PPA-CITY-ST-USA` code, so ticket
   * clicks are attributable to the event in Jackalope. Was the slug, which
   * Jackalope's join cannot resolve. See lib/event-code.ts.
   */
  campaign: string;
  /**
   * The stop's own Tixr page — the destination for the primary button, i.e. the
   * fan who hasn't picked a day yet. Optional: when it's absent (tickets not on
   * sale) the button is omitted rather than pointed at a guess.
   */
  eventTicketsUrl?: string | null;
  /** Use the event's brand accent for prices; false keeps it navy. */
  accent?: boolean;
}) {
  const priceClass = accent ? "text-[var(--event-accent)]" : "text-ppa-navy";

  /**
   * One day → one Tixr listing. A day can sell several access levels off the
   * SAME listing, so the link is the first cell's URL in column order; Tixr's
   * page then shows every tier for that day. (Before this, three cells on a row
   * carried three links that were the same URL.)
   */
  const dayHref = (day: GridDay): string | null => {
    for (const level of grid.levels) {
      const cell = day.cells[level];
      if (cell) return withUtm(cell.url, { campaign, content: `ticket-day-${day.date}` });
    }
    return null;
  };

  /** The access levels this day actually sells — named, not priced. */
  const dayLevels = (day: GridDay) =>
    grid.levels.filter((l) => day.cells[l]).map((l) => LEVEL_LABEL[l]);

  return (
    <div className="mt-6">
      {/* ── Pick a day ──────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grid.days.map((day) => {
          const href = dayHref(day);
          const levels = dayLevels(day);
          const inner = (
            <>
              <div>
                <p className="font-display text-base uppercase leading-none text-ppa-navy">
                  {day.weekday} {day.dayLabel}
                </p>
                {day.round && (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-ppa-navy/40">
                    {day.round}
                  </p>
                )}
                {levels.length > 0 && (
                  <p className="mt-2 text-[11px] leading-relaxed text-ppa-navy/50">
                    {levels.join(" · ")}
                  </p>
                )}
              </div>
              {href && (
                <span
                  className={`mt-4 inline-flex items-center text-[10px] font-bold uppercase tracking-[0.14em] ${
                    accent ? "text-[var(--event-accent)]" : "text-ppa-blue"
                  }`}
                >
                  Tickets ↗
                </span>
              )}
            </>
          );
          // A day with no open listing is still printed — it is part of the
          // event — but it is not a link to nowhere.
          return href ? (
            <a
              key={day.date}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between border border-ppa-line bg-white p-4 transition-colors hover:border-ppa-navy/30 hover:bg-ppa-paper"
            >
              {inner}
            </a>
          ) : (
            <div
              key={day.date}
              className="flex flex-col justify-between border border-ppa-line bg-white p-4"
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* ── The primary door, for a fan who hasn't picked a day ──────────── */}
      {eventTicketsUrl && (
        <a
          href={withUtm(eventTicketsUrl, { campaign, content: "event-tickets-all" })}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center justify-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
        >
          See All Tickets on Tixr ↗
        </a>
      )}

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
        Every day links to its own Tixr listing, where that day&rsquo;s tiers and
        current prices live. Pass prices are the cheapest open tier, before fees.
      </p>
    </div>
  );
}
