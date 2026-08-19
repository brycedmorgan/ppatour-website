"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProDay } from "@/lib/event-schedule";
import type { ScoreMatch, ScoresResult } from "@/lib/scores-api";

/**
 * The live half of "Today at the event": which day it is, and what is on which
 * court right now.
 *
 * ⚠ "TODAY" IS DECIDED ON THE DEVICE, NOT THE SERVER. The tour runs from Cary
 * to Las Vegas and the venue's date is what a person standing in it cares
 * about. A server rendering in UTC calls Championship Sunday "Monday" from
 * 8pm Pacific, and this page is prerendered besides. The phone in the fan's
 * pocket is already in the venue's timezone — so it answers.
 *
 * That means the day highlight only appears after hydration. It renders the
 * first day as a neutral fallback, never a wrong one.
 */
const POLL_MS = 30_000;

/** "Aug 31" in the device's own timezone, matching ProDay.date. */
function todayLabel(): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date());
}

function courtRank(court: string): number {
  if (/champ/i.test(court)) return 0;
  if (/grandstand/i.test(court)) return 1;
  const n = Number(court.replace(/\D+/g, ""));
  return Number.isFinite(n) && n > 0 ? 10 + n : 99;
}

export function TodayPanel({
  proDays,
  eventUuid,
}: {
  proDays: ProDay[];
  /** Tournament UUID for the scores feed; absent means no live half. */
  eventUuid?: string;
}) {
  const [today, setToday] = useState<string | null>(null);
  const [matches, setMatches] = useState<ScoreMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setToday(todayLabel()), []);

  useEffect(() => {
    if (!eventUuid) return;
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/scores?event=${encodeURIComponent(eventUuid)}`);
        if (!res.ok) return;
        const data = (await res.json()) as ScoresResult;
        if (active) setMatches(data.matches ?? []);
      } catch {
        /* keep last-known */
      } finally {
        if (active) setLoaded(true);
      }
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [eventUuid]);

  const day = useMemo(() => {
    if (!today) return null;
    return proDays.find((d) => d.date === today) ?? null;
  }, [proDays, today]);

  /** One row per court with a match in progress, marquee courts first. */
  const live = useMemo(() => {
    return matches
      .filter((m) => m.status === "live")
      .sort((a, b) => courtRank(a.court) - courtRank(b.court));
  }, [matches]);

  return (
    <div className="space-y-8">
      {/* Right now */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
          On court right now
        </h2>
        {live.length > 0 ? (
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {live.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="w-28 shrink-0 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-yellow">
                  {m.court || "Court TBD"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold uppercase tracking-[0.04em] text-white">
                    {m.teams[0].players.join(" / ")} vs {m.teams[1].players.join(" / ")}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-white/45">
                    {[m.division, m.roundLabel].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-white/50">
            {!eventUuid
              ? "Live courts appear here once the tournament feed is live."
              : loaded
                ? "Nothing in progress right now."
                : "Checking the courts…"}
          </p>
        )}
      </section>

      {/* Today's play */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
          {day ? `Today · ${day.dow} ${day.date}` : "The week"}
        </h2>
        {day ? (
          <div className="mt-3 border border-white/10 bg-white/5 p-4">
            <p className="font-display text-xl uppercase leading-tight text-white">{day.label}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                  Gates
                </dt>
                <dd className="mt-0.5 font-bold text-white">{day.gates}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                  First serve
                </dt>
                <dd className="mt-0.5 font-bold text-white">{day.firstServe}</dd>
              </div>
            </dl>
            {day.amateur && day.amateur.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs text-white/55">
                {day.amateur.map((a) => (
                  <li key={a.label}>
                    · {a.label}
                    {a.detail ? ` — ${a.detail}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {proDays.map((d) => (
              <li key={d.date} className="flex items-baseline gap-3 py-2.5">
                <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">
                  {d.dow} {d.date}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">{d.label}</span>
                <span className="shrink-0 text-[11px] text-white/45">{d.firstServe}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
