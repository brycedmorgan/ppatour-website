"use client";

import { useState, useSyncExternalStore } from "react";
import { KIND_LABEL, type StageDay, type StageKind } from "@/lib/event-stage";

/**
 * Day-by-day festival-stage lineup, as accordions, with the day that is
 * actually happening called out.
 *
 * ⚠ "TODAY" IS DECIDED ON THE DEVICE, NOT THE SERVER, and that is the whole
 * reason this is a client component. The event page is prerendered and the
 * tour runs Cary to Las Vegas — a server in UTC calls Championship Sunday
 * "Monday" from 8pm Pacific. The phone at the venue is already in the venue's
 * timezone, so it is the only clock worth asking. Same ruling as the /today
 * route (8/19).
 *
 * ⚠ IT RENDERS CORRECTLY BEFORE IT KNOWS. `activeIso` starts null on both the
 * server and the client's first paint, so the markup matches and there is no
 * hydration mismatch: pre-hydration you get the plain schedule with day one
 * open, which is never a WRONG day — just an un-highlighted one. The highlight
 * appears a frame later. Do not seed this from `new Date()` at module scope.
 *
 * Still native `<details>`, so the full schedule is in the HTML for crawlers
 * and for JS-off visitors even when collapsed.
 */

/** Chip tint per kind. Muted on purpose — the programme is the content here,
    and eight saturated chips per day would out-shout it. */
const KIND_CLASS: Record<StageKind, string> = {
  music: "bg-ppa-blue/10 text-ppa-blue-deep",
  interview: "bg-ppa-navy/8 text-ppa-navy/70",
  autographs: "bg-ppa-yellow/25 text-ppa-navy",
  activity: "bg-ppa-navy/8 text-ppa-navy/70",
  wellness: "bg-ppa-navy/8 text-ppa-navy/70",
  watch: "bg-ppa-navy/8 text-ppa-navy/70",
};

/** Local calendar date as yyyy-mm-dd. Built from the parts, never from
    toISOString(), which converts to UTC and lands on the wrong day at night. */
function localIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * ⚠ `useSyncExternalStore`, NOT `useState` + `useEffect`. Setting state inside
 * an effect to learn the date is the "cascading renders" pattern this repo
 * already carries as lint errors elsewhere, and it is avoidable here: the
 * server snapshot is null and the client snapshot is the device's date, which
 * is exactly what this hook is for. Same fix CookieBanner took (7/14).
 *
 * Never subscribes: the date does not change while someone reads a page, and a
 * tab left open across midnight showing yesterday's highlight is a smaller
 * problem than a timer on every event page.
 */
const subscribeNever = () => () => {};
const noDateOnServer = () => null;

export function StageSchedule({ days }: { days: StageDay[] }) {
  const activeIso = useSyncExternalStore(
    subscribeNever,
    () => localIso(new Date()),
    noDateOnServer,
  );

  /**
   * Which day is open is DERIVED, not stored — today when the schedule covers
   * it, otherwise day one. Storing it would mean correcting it from an effect
   * once the date arrives, which is the thing above. `override` is written
   * only by a real click, so the moment someone opens a day themselves the
   * component stops choosing for them.
   */
  const activeIndex = days.findIndex((d) => d.iso === activeIso);
  const [override, setOverride] = useState<Set<number> | null>(null);
  const open = override ?? new Set([activeIndex >= 0 ? activeIndex : 0]);

  return (
    <div className="mt-6 flex flex-col gap-px border border-ppa-line bg-ppa-line">
      {days.map((day, i) => {
        const isActive = activeIso !== null && day.iso === activeIso;
        return (
          <details
            key={day.date}
            className="group bg-white"
            open={open.has(i)}
            onToggle={(e) => {
              const isOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOverride((prev) => {
                const next = new Set(prev ?? open);
                if (isOpen) next.add(i);
                else next.delete(i);
                return next;
              });
            }}
          >
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors [&::-webkit-details-marker]:hidden ${
                isActive ? "bg-ppa-navy text-white" : "bg-ppa-paper hover:bg-ppa-line/50"
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span
                  className={`font-display text-sm uppercase tracking-[0.06em] ${
                    isActive ? "text-white" : "text-ppa-navy"
                  }`}
                >
                  {day.dow}
                </span>
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                    isActive ? "text-ppa-yellow" : "text-[var(--event-accent)]"
                  }`}
                >
                  {day.date}
                </span>
                {/* The accent bar alone reads as "selected"; the word is what
                    makes it mean "happening now". */}
                {isActive && (
                  <span className="bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ppa-navy">
                    Today
                  </span>
                )}
              </span>
              <span className="flex items-center gap-3">
                {/* A collapsed day should still say something — otherwise the
                    accordion hides the fact that Wednesday is the busy one. */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                    isActive ? "text-white/70" : "text-ppa-navy/40"
                  }`}
                >
                  {day.slots.length} {day.slots.length === 1 ? "session" : "sessions"}
                </span>
                <span
                  aria-hidden
                  className={`text-xs transition-transform duration-300 group-open:rotate-180 ${
                    isActive ? "text-white/60" : "text-ppa-navy/40"
                  }`}
                >
                  ▾
                </span>
              </span>
            </summary>

            <ul className="border-t border-ppa-line">
              {day.slots.map((slot, s) => (
                <li
                  key={`${slot.time}-${s}`}
                  className="flex flex-col gap-x-4 gap-y-1 border-b border-ppa-line/60 px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline"
                >
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums text-ppa-navy/50 sm:w-44">
                    {slot.time}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold leading-snug text-ppa-navy">
                        {slot.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${KIND_CLASS[slot.kind]}`}
                      >
                        {KIND_LABEL[slot.kind]}
                      </span>
                    </span>
                    {slot.detail && (
                      <span className="mt-0.5 block text-xs leading-snug text-ppa-navy/55">
                        {slot.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
