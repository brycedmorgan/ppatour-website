"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import type { PlayerProfile, PlayerRun, PlayerStep } from "@/lib/player-event";
import type { TickerResult } from "@/lib/ticker-api";
import { playerHref } from "@/lib/app-player";
import { normalizeScoreName } from "@/lib/score-names";
import { MatchCard } from "@/components/live/MatchCard";
import { useLiveTicker } from "@/components/live/use-live-ticker";
import { FollowButton } from "@/components/app/FollowButton";

/**
 * One pro, ESPN-style (Bryce, 10/9: "click one player, see all their scores,
 * profiles, etc."). Header: photo, world ranking, follow, full profile. Then
 * what is on court now, then their path through every draw at this event,
 * round by round, with every partner and opponent tappable to their own
 * screen — so a fan can walk the event player to player.
 *
 * Live matches come from the ticker (polled, same feed as Scores); the draw
 * path is server-rendered and refreshed every minute while the event is on.
 */
const REFRESH_MS = 60000;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function Names({ list, eventId }: { list: string[]; eventId: string }) {
  return (
    <>
      {list.map((n, i) => (
        <Fragment key={n + i}>
          {i > 0 && " / "}
          <Link href={playerHref(n, eventId)} className="font-semibold text-ppa-navy underline-offset-2 active:underline">
            {n}
          </Link>
        </Fragment>
      ))}
    </>
  );
}

function Step({ s, eventId }: { s: PlayerStep; eventId: string }) {
  // The feed sends 0–0 for a game nobody played (a 2–0 match's third game).
  const score = s.games[0]
    .map((g, i) => [g, s.games[1][i] ?? 0] as const)
    .filter(([a, b]) => a > 0 || b > 0)
    .map(([a, b]) => `${a}–${b}`)
    .join(", ");
  const badge =
    s.status === "live"
      ? { text: "Live", cls: "bg-ppa-live text-white" }
      : s.won === true
        ? { text: "W", cls: "bg-ppa-win text-ppa-navy" }
        : s.won === false
          ? { text: "L", cls: "bg-ppa-navy/10 text-ppa-navy/55" }
          : { text: "Next", cls: "bg-ppa-blue/10 text-ppa-blue" };
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="w-14 shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ppa-navy/45">
        {s.round}
      </span>
      <span className="min-w-0 flex-1 text-[13px] text-ppa-navy/70">
        <span className="text-ppa-navy/45">vs </span>
        {s.opponents.length ? <Names list={s.opponents} eventId={eventId} /> : <span className="italic">TBD</span>}
        <span className="block text-[12px] tabular-nums text-ppa-navy/55">
          {s.outcome === "walkover"
            ? s.won
              ? "Walkover"
              : "Withdrew"
            : score || [s.court, s.time].filter(Boolean).join(" · ") || " "}
        </span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${badge.cls}`}>
        {badge.text}
      </span>
    </li>
  );
}

function Run({ run, eventId }: { run: PlayerRun; eventId: string }) {
  const partners = [...new Set(run.sections.flatMap((s) => s.steps.flatMap((st) => st.partners)))];
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-ppa-line">
      <div className="flex items-center justify-between gap-2 bg-ppa-paper px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold uppercase tracking-[0.1em] text-ppa-navy">{run.division}</p>
          {partners.length > 0 && (
            <p className="truncate text-[12px] text-ppa-navy/55">
              with <Names list={partners} eventId={eventId} />
            </p>
          )}
        </div>
        {run.summary && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
              run.medal === "gold" ? "bg-ppa-yellow text-ppa-navy" : "bg-white text-ppa-navy/70"
            }`}
          >
            {run.summary}
          </span>
        )}
      </div>
      {run.sections.map((sec, i) => (
        <div key={i} className="px-3">
          {sec.label && (
            <p className="pt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">{sec.label}</p>
          )}
          <ul className="divide-y divide-ppa-line">
            {sec.steps.map((s) => (
              <Step key={s.id} s={s} eventId={eventId} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function PlayerScreen({
  profile,
  runs,
  eventId,
  eventName,
  live,
  initialTicker,
}: {
  profile: PlayerProfile;
  runs: PlayerRun[];
  eventId: string;
  eventName: string;
  live: boolean;
  initialTicker?: TickerResult;
}) {
  const router = useRouter();
  const { ordered } = useLiveTicker({ enabled: live, initialData: initialTicker });
  const key = normalizeScoreName(profile.name);

  // Re-pull the draw path while the event is on; the ticker polls itself.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [live, router]);

  const onCourt = useMemo(
    () =>
      ordered.filter(
        (m) =>
          m.status !== "final" && m.teams.some((t) => t.players.some((p) => normalizeScoreName(p.fullName ?? p.name) === key)),
      ),
    [ordered, key],
  );
  // The feed's photo when the boards had none (or the name was ambiguous there,
  // in which case this is still THIS match's player, not a guess).
  const tickerShot = useMemo(() => {
    for (const m of ordered)
      for (const t of m.teams) for (const p of t.players) if (normalizeScoreName(p.fullName ?? p.name) === key && p.headshot) return p.headshot;
    return null;
  }, [ordered, key]);
  const headshot = profile.headshot ?? tickerShot;
  const toPlayer = (name: string) => playerHref(name, eventId);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white pb-10">
      <header className="bg-ppa-navy px-4 pb-5 pt-3 text-white">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/scores/"))}
          className="-ml-1.5 flex items-center gap-0.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white/70"
        >
          <ChevronLeft className="size-4" aria-hidden /> Back
        </button>
        <div className="mt-3 flex items-center gap-4">
          <span className="relative size-20 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-white/20">
            {headshot ? (
              // Plain img — feed photos come from varied hosts (same as MatchCard).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={headshot} alt="" className="size-20 object-cover object-top" />
            ) : (
              <span className="flex size-20 items-center justify-center font-display text-2xl text-white/60">
                {initials(profile.name)}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold uppercase leading-tight">{profile.name}</h1>
            {profile.rank ? (
              <p className="mt-0.5 text-[12px] font-semibold text-white/65">
                World No. {profile.rank.isTied ? `T${profile.rank.rank}` : profile.rank.rank} · {profile.rank.board} ·{" "}
                {profile.rank.points.toLocaleString(undefined, { maximumFractionDigits: 0 })} pts
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] font-semibold text-white/50">Not in the world top rankings</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile.profileSlug && <FollowButton slug={profile.profileSlug} name={profile.name} />}
          {profile.profileSlug && (
            <Link
              href={`/athletes/${profile.profileSlug}/`}
              className="mt-4 inline-flex h-10 items-center px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 ring-1 ring-inset ring-white/25"
            >
              Full profile
            </Link>
          )}
        </div>
      </header>

      <div className="px-4">
        {onCourt.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">On court</h2>
            <div className="space-y-3">
              {onCourt.map((m) => (
                <MatchCard key={m.id} m={m} playerHref={toPlayer} />
              ))}
            </div>
          </section>
        )}

        <h2 className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
          {eventName ? `At ${eventName}` : "This event"}
        </h2>
        {runs.length > 0 ? (
          runs.map((r) => <Run key={r.division} run={r} eventId={eventId} />)
        ) : (
          <p className="mt-3 rounded-xl border border-ppa-line bg-ppa-paper px-5 py-6 text-center text-[14px] text-ppa-navy/60">
            {profile.name} isn&rsquo;t in a draw at this event.
          </p>
        )}
      </div>
    </div>
  );
}
