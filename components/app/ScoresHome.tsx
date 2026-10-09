"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import type { ScoresEvent } from "@/lib/app-scores";
import type { TickerMatch, TickerResult } from "@/lib/ticker-api";
import { MatchCard, MatchCardSkeleton } from "@/components/live/MatchCard";
import { PBTV_WATCH_URL, useLiveTicker } from "@/components/live/use-live-ticker";
import { MobileBracket } from "@/components/app/MobileBracket";
import { useFollows } from "@/components/app/follows";

/**
 * The app's first screen: scores, then brackets. Bryce, 10/8 — "more like
 * ESPN… scores and brackets first", schedule and events one level deeper.
 *
 * One set of division chips drives both views, so "Mixed" on Scores is still
 * "Mixed" when you flip to Bracket. Scores read the live ticker (the same feed
 * as the bottom score bar, so the two cannot disagree); Bracket reads the draw.
 */
const DIVISIONS = [
  { name: "Women's Doubles", short: "WD" },
  { name: "Men's Doubles", short: "MD" },
  { name: "Mixed Doubles", short: "Mixed" },
  { name: "Women's Singles", short: "WS" },
  { name: "Men's Singles", short: "MS" },
] as const;

const key = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");

/** Accent- and punctuation-blind name key, so "Jade Kawamoto" in the ticker
 *  finds the follow saved from her profile. The ticker carries names, not
 *  slugs, so a follow is matched by the name stored beside its slug. */
const nameKey = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

function dateRange(start: string, end: string): string {
  const f = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", opts);
  return `${f(start, { month: "short", day: "numeric" })} – ${f(end, { month: "short", day: "numeric" })}`;
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
        {title}
        {count !== undefined && <span className="text-ppa-navy/35">{count}</span>}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function ScoresHome({ event, initialTicker }: { event: ScoresEvent | null; initialTicker?: TickerResult }) {
  const { ordered: matches, loaded } = useLiveTicker({ initialData: initialTicker });
  const [division, setDivision] = useState<string | null>(null);
  const [view, setView] = useState<"scores" | "bracket">("scores");
  const { follows } = useFollows();

  const shown = useMemo(() => {
    const ms = division ? matches.filter((m) => key(m.division) === key(division)) : matches;
    // The pros this fan follows come first, pulled out of the status lists so
    // a match never shows twice. Finals sink to the end of their section.
    const followed = new Set(follows.map((f) => nameKey(f.name)));
    const isMine = (m: TickerMatch) => m.teams.some((t) => t.players.some((p) => followed.has(nameKey(p.name))));
    const mine = ms.filter(isMine);
    const rest = ms.filter((m) => !isMine(m));
    // `ordered` is already sorted by the hook; this only splits it by status.
    const by = (s: TickerMatch["status"]) => rest.filter((m) => m.status === s);
    const rank = { live: 0, upnext: 1, final: 2 } as const;
    mine.sort((a, b) => rank[a.status] - rank[b.status]);
    return { mine, live: by("live"), next: by("upnext"), final: by("final") };
  }, [matches, division, follows]);

  const liveCount = (name: string) =>
    matches.filter((m) => m.status === "live" && key(m.division) === key(name)).length;

  if (!event) {
    return (
      <div className="px-4 pt-10 text-center text-ppa-navy/60">
        No tournament scores to show yet. <Link href="/events/" className="font-bold text-ppa-blue">See the schedule</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md bg-white pb-10">
      {/* Event header — what is on, one tap to watch, one tap to event info. */}
      <header className="bg-ppa-navy px-4 pb-4 pt-5 text-white">
        <div className="flex items-center gap-3">
          {event.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt="" className="size-11 shrink-0 rounded-lg bg-white object-contain p-1" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {event.live ? (
                <span className="flex items-center gap-1 rounded-full bg-ppa-live px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
                </span>
              ) : (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]">
                  Final
                </span>
              )}
              <span className="truncate text-[11px] font-semibold text-white/60">
                {dateRange(event.startDate, event.endDate)} · {event.city}, {event.state}
              </span>
            </div>
            <h1 className="mt-1 truncate font-display text-[20px] font-bold uppercase leading-tight">{event.name}</h1>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {event.live && (
            <a
              href={PBTV_WATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-ppa-yellow px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy"
            >
              <Play className="size-3.5 fill-current" aria-hidden /> Watch
            </a>
          )}
          <Link
            href={event.live ? `${event.href}/today` : event.href}
            className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85"
          >
            Event info
          </Link>
        </div>
      </header>

      {/* Scores | Bracket, then the division chips both views share. */}
      <div className="sticky top-0 z-10 border-b border-ppa-line bg-white/95 px-4 pb-2.5 pt-3 backdrop-blur">
        <div className="grid grid-cols-2 rounded-full bg-ppa-paper p-0.5">
          {(["scores", "bracket"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full py-2 text-[12px] font-bold uppercase tracking-[0.12em] ${
                view === v ? "bg-ppa-navy text-white" : "text-ppa-navy/55"
              }`}
            >
              {v === "scores" ? "Scores" : "Bracket"}
            </button>
          ))}
        </div>
        <div className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
          {view === "scores" && (
            <Chip active={division === null} onClick={() => setDivision(null)} label="All" />
          )}
          {DIVISIONS.map((d) => (
            <Chip
              key={d.name}
              active={view === "bracket" ? key(division ?? DIVISIONS[0].name) === key(d.name) : division === d.name}
              onClick={() => setDivision(d.name)}
              label={d.short}
              live={liveCount(d.name) > 0}
            />
          ))}
        </div>
      </div>

      <div className="px-4">
        {view === "bracket" ? (
          <div className="mt-4">
            <MobileBracket eventId={event.eventId} division={division ?? DIVISIONS[0].name} />
          </div>
        ) : !loaded ? (
          <Section title="On court">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </Section>
        ) : shown.mine.length + shown.live.length + shown.next.length + shown.final.length === 0 ? (
          <div className="mt-6 rounded-xl border border-ppa-line bg-ppa-paper px-6 py-8 text-center">
            <p className="text-[14px] text-ppa-navy/65">
              {event.live ? "Nothing on court in this division right now." : "No live matches — the draw has every result."}
            </p>
            <button
              type="button"
              onClick={() => setView("bracket")}
              className="mt-3 text-[12px] font-bold uppercase tracking-[0.12em] text-ppa-blue"
            >
              Open the bracket →
            </button>
          </div>
        ) : (
          <>
            {shown.mine.length > 0 ? (
              <Section title="Your players" count={shown.mine.length}>
                {shown.mine.map((m) => <MatchCard key={m.id} m={m} />)}
              </Section>
            ) : (
              follows.length === 0 && (
                <Link
                  href="/rankings/app/"
                  className="mt-5 flex items-center justify-between rounded-xl bg-ppa-paper px-4 py-3 text-[13px] text-ppa-navy/70"
                >
                  <span>Follow your players to see their matches first.</span>
                  <span className="shrink-0 pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-blue">Find →</span>
                </Link>
              )
            )}
            {shown.live.length > 0 && (
              <Section title="Live now" count={shown.live.length}>
                {shown.live.map((m) => <MatchCard key={m.id} m={m} />)}
              </Section>
            )}
            {shown.next.length > 0 && (
              <Section title="Up next" count={shown.next.length}>
                {shown.next.map((m) => <MatchCard key={m.id} m={m} />)}
              </Section>
            )}
            {shown.final.length > 0 && (
              <Section title="Final" count={shown.final.length}>
                {shown.final.map((m) => <MatchCard key={m.id} m={m} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, live }: { label: string; active: boolean; onClick: () => void; live?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] ${
        active ? "bg-ppa-blue text-white" : "border border-ppa-line text-ppa-navy/65"
      }`}
    >
      {live && <span className={`size-1.5 rounded-full ${active ? "bg-white" : "bg-ppa-live"}`} />}
      {label}
    </button>
  );
}
