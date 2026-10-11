"use client";

import Link from "next/link";
import { Fragment } from "react";
import type { HistoryEvent, HistoryMatch } from "@/lib/player-history";
import { playerHref } from "@/lib/app-player";
import { useAppMode } from "@/components/app/use-app-mode";
import { BoxScore, finishChipClass, type Tone } from "@/components/athletes/BoxScore";
import { usePlayerHistory } from "@/components/athletes/use-player-history";

/**
 * Recent tour stops and recent matches for one pro — on the athlete profile
 * (a full navy band, `variant="profile"`) and the app player screen (compact
 * and light, `variant="app"`). lib/player-history; Bryce, 10/11.
 *
 * Bryce, 10/11 (pt. 2): the first cut "didn't follow the CSS of anything
 * else". The profile band now uses the page's own grammar — 11px eyebrow,
 * font-display heading, square cards, a top colour bar like By the Numbers —
 * with tournaments as a swipeable rail (event logo + finish per division) and
 * matches as box scores grouped by event.
 *
 * Loaded after the page from /api/player-history (shared with the Latest
 * Result card through usePlayerHistory — one request), not rendered with it:
 * the profiles are force-static and build ~1,100 at a time. Renders nothing
 * until there is something to show.
 *
 * In the app every partner and opponent opens their own player screen. On the
 * website the names are text: that screen is an app screen.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y && m && d ? `${MONTHS[m - 1]} ${d}` : "";
}
export function dateRange(start: string, end: string): string {
  return start.slice(0, 7) === end.slice(0, 7) ? `${day(start)}–${Number(end.slice(8, 10))}` : `${day(start)} – ${day(end)}`;
}

export function EventLogo({ e, size = 40 }: { e: Pick<HistoryEvent, "logoUrl" | "name">; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden bg-white p-1"
      style={{ width: size, height: size }}
    >
      {e.logoUrl ? (
        // Event logos come from the PB CDN at varied sizes — plain img, contained.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.logoUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="font-display text-[11px] uppercase text-ppa-navy/50">PPA</span>
      )}
    </span>
  );
}

function Partners({ list, link }: { list: string[]; link: boolean }) {
  return (
    <>
      {list.map((n, i) => (
        <Fragment key={n + i}>
          {i > 0 && " / "}
          {link ? (
            <Link href={playerHref(n)} className="underline-offset-2 active:underline">
              {n}
            </Link>
          ) : (
            n
          )}
        </Fragment>
      ))}
    </>
  );
}

function TournamentCard({ e, tone, link }: { e: HistoryEvent; tone: Tone; link: boolean }) {
  const dark = tone === "dark";
  const top = Math.min(...e.divisions.map((d) => d.place ?? 9));
  const titleCls = `line-clamp-2 text-[13px] font-bold leading-snug ${dark ? "text-white" : "text-ppa-navy"}`;
  return (
    <li
      className={`flex w-[16.5rem] shrink-0 snap-start flex-col ${
        dark ? "border border-white/10 bg-white/[0.04]" : "border border-ppa-line bg-white"
      }`}
    >
      {/* Top bar = how far they went, in tour colours (By the Numbers' card bar). */}
      <div className={`h-1.5 ${top === 1 ? "bg-ppa-yellow" : top <= 3 ? "bg-ppa-blue" : dark ? "bg-white/10" : "bg-ppa-line"}`} />
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <EventLogo e={e} />
        <div className="min-w-0">
          {e.href ? (
            <Link href={e.href} className={`${titleCls} hover:underline`}>
              {e.name}
            </Link>
          ) : (
            <span className={titleCls}>{e.name}</span>
          )}
          <p className={`mt-0.5 text-[11px] font-semibold ${dark ? "text-white/45" : "text-ppa-navy/45"}`}>
            {dateRange(e.startDate, e.endDate)}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex-1 space-y-2 px-4 pb-4">
        {e.divisions.map((d) => (
          <li key={d.division} className="flex items-start justify-between gap-2">
            <span className={`min-w-0 text-[12px] leading-snug ${dark ? "text-white/70" : "text-ppa-navy/65"}`}>
              <span className={`block font-semibold ${dark ? "text-white" : "text-ppa-navy"}`}>{d.division}</span>
              {d.partners.length > 0 && (
                <span className="block truncate">
                  w/ <Partners list={d.partners} link={link} />
                </span>
              )}
            </span>
            {d.finish && (
              <span
                className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${finishChipClass(d.place, tone)}`}
              >
                {d.finish}
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

/** Matches grouped by event, in history order (newest stop, deepest round first). */
function byEvent(matches: HistoryMatch[]): { eventId: string; eventName: string; matches: HistoryMatch[] }[] {
  const groups: { eventId: string; eventName: string; matches: HistoryMatch[] }[] = [];
  for (const m of matches) {
    const g = groups[groups.length - 1];
    if (g && g.eventId === m.eventId) g.matches.push(m);
    else groups.push({ eventId: m.eventId, eventName: m.eventName, matches: [m] });
  }
  return groups;
}

export function RecentResults({
  name,
  excludeEventId,
  variant = "app",
}: {
  name: string;
  /** The event the screen already shows in full (the app's "At …" block). */
  excludeEventId?: string;
  variant?: "profile" | "app";
}) {
  const isApp = useAppMode();
  const data = usePlayerHistory(name, excludeEventId);
  if (!data) return null;

  const tone: Tone = variant === "profile" ? "dark" : "light";
  const dark = tone === "dark";
  const eyebrow = `text-[11px] font-bold uppercase tracking-[0.18em] ${dark ? "text-white/55" : "text-ppa-navy/50"}`;

  const body = (
    <>
      {data.events.length > 0 && (
        <div className={variant === "profile" ? "mt-8" : "mt-6"}>
          <p className={eyebrow}>Tournaments</p>
          {/* A swipeable rail — the newest stop first, the next one peeking. */}
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {data.events.map((e) => (
              <TournamentCard key={e.eventId} e={e} tone={tone} link={isApp} />
            ))}
          </ul>
        </div>
      )}

      {data.matches.length > 0 && (
        <div className="mt-8">
          <p className={eyebrow}>Matches</p>
          {byEvent(data.matches).map((g) => (
            <div key={g.eventId} className="mt-4">
              <p className={`text-[12px] font-bold uppercase tracking-[0.1em] ${dark ? "text-white/80" : "text-ppa-navy/70"}`}>
                {g.eventName}
              </p>
              <div className={`mt-2 grid gap-2.5 ${variant === "profile" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                {g.matches.map((m) => (
                  <BoxScore key={`${m.eventId}-${m.id}`} m={m} subject={name} tone={tone} link={isApp} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (variant === "app") return <div className="pb-2">{body}</div>;

  return (
    <section id="recent-results" className="scroll-mt-24 bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className={eyebrow}>On Tour</p>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">Recent Results</h2>
        {body}
      </div>
    </section>
  );
}
