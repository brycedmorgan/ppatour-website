"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAppMode } from "@/components/app/use-app-mode";
import { nextStopSnapshot, type NextStopState } from "@/lib/next-stop";
import { eventHref, formatDateRange, getMainTourEvents } from "@/lib/placeholder-data";
import { TICKET_LINK_REL, withUtm } from "@/lib/utm";

const neverChanges = () => () => {};

const BUTTON =
  "group flex h-11 shrink-0 items-center justify-center gap-1.5 bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ppa-blue-deep active:scale-[0.98]";

/**
 * A ticket path inside the content of the pages search visitors land on.
 *
 * ⚠ IT NAMES THE TOUR'S NEXT STOP, NEVER THE PLAYER'S. On an athlete page it must
 * not suggest that player is in the field: no player-to-event feed exists yet
 * (docs/DATA-ASKS.md §5).
 *
 * ⚠ `initial` comes from the server and is used for hydration only. The cached
 * page may be a day old, so the browser then swaps in the current stop without a
 * hydration mismatch.
 */
export function NextStopCta({ initial, placement }: { initial: string; placement: string }) {
  const snapshot = useSyncExternalStore(neverChanges, () => nextStopSnapshot(), () => initial);
  // The installed app follows the tour and does not sell tickets (StickyBuyBar).
  const isApp = useAppMode();

  const [state, slug] = snapshot.split("|") as [NextStopState, string];
  const t = getMainTourEvents().find((e) => e.slug === slug);
  if (!t || state === "none" || isApp) return null;

  const onSale = Boolean(t.ticketsOnSale) && t.ticketNote !== "free";
  const label =
    t.ticketNote === "no-price" ? "Buy Tickets" : `Buy Tickets — From $${t.ticketPriceFrom}`;

  return (
    <section aria-label="Next tour stop" className="border-t-2 border-ppa-blue bg-ppa-navy-deep text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-sky">
            {state === "live" ? "On Tour Now" : "Next on Tour"}
          </p>
          <h2 className="mt-1.5 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            <Link href={eventHref(t)} className="transition-colors hover:text-ppa-sky">
              {t.name}
            </Link>
          </h2>
          <p className="mt-1.5 text-sm text-white/65">
            {formatDateRange(t.startDate, t.endDate)} · {t.city}, {t.state} · Watch the pros in person
          </p>
        </div>
        {onSale ? (
          <a
            href={withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: placement })}
            target="_blank"
            rel={TICKET_LINK_REL}
            className={BUTTON}
          >
            {label}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </a>
        ) : (
          <Link href={eventHref(t)} className={BUTTON}>
            Event Details
          </Link>
        )}
      </div>
    </section>
  );
}
