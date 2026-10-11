"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import type { HistoryMatch, PlayerHistory } from "@/lib/player-history";
import { playerHref } from "@/lib/app-player";
import { useAppMode } from "@/components/app/use-app-mode";

/**
 * Recent tour stops and recent matches for one pro — on the app player screen
 * and the athlete profile (lib/player-history; Bryce, 10/11).
 *
 * Loaded after the page from /api/player-history, not rendered with it: the
 * profiles are force-static and build ~1,100 at a time (see that route). It
 * renders nothing until there is something to show, so a pro with no recent
 * main-draw results gets no empty section.
 *
 * In the app every partner and opponent opens their own player screen, the
 * same walk-the-event behaviour as the draw path above it. On the website the
 * names are text: that screen is an app screen.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function day(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y && m && d ? `${MONTHS[m - 1]} ${d}` : "";
}
function range(start: string, end: string): string {
  return start.slice(0, 7) === end.slice(0, 7) ? `${day(start)}–${Number(end.slice(8, 10))}` : `${day(start)} – ${day(end)}`;
}

const MEDAL: Record<string, string> = {
  gold: "bg-ppa-yellow text-ppa-navy",
  silver: "bg-ppa-navy/10 text-ppa-navy",
  bronze: "bg-ppa-navy/10 text-ppa-navy",
};

function Names({ list, link }: { list: string[]; link: boolean }) {
  return (
    <>
      {list.map((n, i) => (
        <Fragment key={n + i}>
          {i > 0 && " / "}
          {link ? (
            <Link href={playerHref(n)} className="font-semibold text-ppa-navy underline-offset-2 active:underline">
              {n}
            </Link>
          ) : (
            <span className="font-semibold text-ppa-navy">{n}</span>
          )}
        </Fragment>
      ))}
    </>
  );
}

function score(m: HistoryMatch): string {
  if (m.outcome === "walkover") return "W/O";
  // The feed sends 0–0 for a game nobody played (a 2–0 match's third game).
  return m.games[0]
    .map((g, i) => [g, m.games[1][i] ?? 0] as const)
    .filter(([a, b]) => a > 0 || b > 0)
    .map(([a, b]) => `${a}–${b}`)
    .join(", ");
}

export function RecentResults({
  name,
  excludeEventId,
  className = "",
}: {
  name: string;
  /** The event the screen already shows in full (the app's "At …" block). */
  excludeEventId?: string;
  className?: string;
}) {
  const isApp = useAppMode();
  const [data, setData] = useState<PlayerHistory | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/player-history/?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PlayerHistory | null) => {
        if (!alive || !d || !Array.isArray(d.events)) return;
        setData({
          events: d.events.filter((e) => e.eventId !== excludeEventId),
          matches: d.matches.filter((m) => m.eventId !== excludeEventId),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name, excludeEventId]);

  if (!data || (data.events.length === 0 && data.matches.length === 0)) return null;
  const h2 = "mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50";

  return (
    <div className={className}>
      {data.events.length > 0 && (
        <section className="mt-6">
          <h2 className={h2}>Recent tournaments</h2>
          <ul className="divide-y divide-ppa-line overflow-hidden rounded-xl border border-ppa-line bg-white">
            {data.events.map((e) => (
              <li key={e.eventId} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  {e.href ? (
                    <Link href={e.href} className="min-w-0 truncate text-[14px] font-bold text-ppa-navy">
                      {e.name}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate text-[14px] font-bold text-ppa-navy">{e.name}</span>
                  )}
                  <span className="shrink-0 text-[11px] font-semibold text-ppa-navy/45">{range(e.startDate, e.endDate)}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {e.divisions.map((d) => (
                    <li key={d.division} className="flex items-center justify-between gap-3 text-[12px] text-ppa-navy/65">
                      <span className="min-w-0">
                        {d.division}
                        {d.partners.length > 0 && (
                          <>
                            {" · w/ "}
                            <Names list={d.partners} link={isApp} />
                          </>
                        )}
                      </span>
                      {d.finish && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                            d.medal ? MEDAL[d.medal] : "text-ppa-navy/55"
                          }`}
                        >
                          {d.finish}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.matches.length > 0 && (
        <section className="mt-6">
          <h2 className={h2}>Recent matches</h2>
          <ul className="divide-y divide-ppa-line overflow-hidden rounded-xl border border-ppa-line bg-white">
            {data.matches.map((m) => (
              <li key={`${m.eventId}-${m.id}`} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    m.won === true ? "bg-ppa-blue text-white" : m.won === false ? "bg-ppa-navy/10 text-ppa-navy/60" : "bg-ppa-paper text-ppa-navy/40"
                  }`}
                >
                  {m.won === true ? "W" : m.won === false ? "L" : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ppa-navy/45">
                    {m.round} · {m.division}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ppa-navy/70">
                    {m.partners.length > 0 && (
                      <>
                        w/ <Names list={m.partners} link={isApp} />{" "}
                      </>
                    )}
                    vs <Names list={m.opponents} link={isApp} />
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-ppa-navy/45">
                    {m.eventName}
                  </p>
                </div>
                <span className="shrink-0 pt-4 text-[12px] font-bold tabular-nums text-ppa-navy">{score(m)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
