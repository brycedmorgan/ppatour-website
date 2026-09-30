"use client";

import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import {
  liveWatchUrl,
  PBTV_STREAM_URL,
  useLiveTicker,
  useTourIsLive,
} from "@/components/live/use-live-ticker";
import { deviceTodayIso, liveEventStatus, type LiveStatus } from "@/lib/live-status";
import type { PlayDay } from "@/lib/order-of-play";

/**
 * The live-event status line and badge — "Matches in progress" only while a
 * match is genuinely on court, otherwise the next true thing: first serve, up
 * next, play resumes. The words come from lib/live-status; this reads the feed
 * and the device's day and hands them over.
 *
 * ⚠ BEFORE MOUNT IT RENDERS THE NEUTRAL STATE, NEVER THE LIVE ONE. The server
 * cannot see the device's clock or the feed's latest answer, so the prerendered
 * HTML says "Tournament Week" and the client corrects it on hydration. Claiming
 * "in progress" from the server and retracting it a beat later is the exact
 * failure this component exists to stop.
 */

const NEUTRAL: LiveStatus = {
  kind: "unknown",
  label: "Tournament week",
  badge: "Tournament Week",
  matchLive: false,
};

const subscribeNever = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function useLiveEventStatus(days: PlayDay[]): LiveStatus {
  const mounted = useMounted();
  const { ordered, feedOk } = useLiveTicker();
  const { now, simulating } = useTourIsLive();
  if (!mounted) return NEUTRAL;
  return liveEventStatus({
    // /live can shift the clock; the feed cannot. Under a simulated clock the
    // copy runs off the schedule alone so the two never disagree on one screen.
    matches: simulating ? [] : ordered,
    feedOk: simulating ? false : feedOk,
    days,
    todayIso: deviceTodayIso(now),
    now,
  });
}

function StatusText({ days }: { days: PlayDay[] }) {
  return <>{useLiveEventStatus(days).label}</>;
}

/** The status line, e.g. "First serve 2:00 PM". */
export function LiveEventStatusText({ days }: { days: PlayDay[] }) {
  return (
    <Suspense fallback={NEUTRAL.label}>
      <StatusText days={days} />
    </Suspense>
  );
}

function Badge({ days, className }: { days: PlayDay[]; className?: string }) {
  const s = useLiveEventStatus(days);
  return <BadgeView status={s} className={className} />;
}

function BadgeView({ status, className = "" }: { status: LiveStatus; className?: string }) {
  return status.matchLive ? (
    <span className={`flex items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-white ${className}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      {status.badge}
    </span>
  ) : (
    <span className={`bg-ppa-blue px-2 py-0.5 text-white ${className}`}>{status.badge}</span>
  );
}

/** "Live Now" (pulsing, red) while a match is on; "Tournament Week" otherwise. */
export function LiveEventBadge({ days, className }: { days: PlayDay[]; className?: string }) {
  return (
    <Suspense fallback={<BadgeView status={NEUTRAL} className={className} />}>
      <Badge days={days} className={className} />
    </Suspense>
  );
}

function Kicker({ days, dark }: { days: PlayDay[]; dark: boolean }) {
  const s = useLiveEventStatus(days);
  return <KickerView status={s} dark={dark} />;
}

function KickerView({ status, dark }: { status: LiveStatus; dark: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`h-2 w-2 rounded-full ${status.matchLive ? "animate-pulse bg-ppa-live" : "bg-ppa-yellow"}`}
      />
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? "text-white/55" : "text-ppa-navy/55"}`}
      >
        {status.matchLive ? "Live Now" : status.label}
      </p>
    </div>
  );
}

function DayWatch({
  days,
  className,
  doneClassName,
  children,
  doneChildren,
  dayLabel,
}: DayWatchProps) {
  const s = useLiveEventStatus(days);
  const { ordered } = useLiveTicker();
  const { now } = useTourIsLive();
  const mounted = useMounted();
  const done = s.kind === "done-today" || s.kind === "done";
  // Read on the device, after mount — the prerendered HTML can't know the day.
  const dayActive = mounted && !!dayLabel && deviceTodayIso(now) === dayLabel.iso;
  const label = dayActive ? dayLabel.children : children;
  return (
    <a
      href={done ? PBTV_STREAM_URL : (dayActive && dayLabel.href) || liveWatchUrl(ordered)}
      target="_blank"
      rel="noopener noreferrer"
      className={done ? (doneClassName ?? className) : className}
    >
      {done ? doneChildren : label}
    </a>
  );
}

type DayWatchProps = {
  days: PlayDay[];
  className?: string;
  doneClassName?: string;
  children: ReactNode;
  doneChildren: ReactNode;
  /**
   * A one-day replacement for `children` (the pre-done state), shown only when
   * the device's date is `iso`, optionally with its own link. It expires on
   * its own the next day.
   */
  dayLabel?: { iso: string; children: ReactNode; href?: string };
};

/**
 * The event-day watch button (Wesley, 9/28): "Watch Live" for the whole playing
 * day — before first serve, between matches, while a match is on — pointing at
 * the first match's stream or PickleballTV. Once the day's matches are all done
 * it becomes `doneChildren`, linking to the PickleballTV stream by default.
 */
export function DayWatchButton(props: DayWatchProps) {
  return (
    <Suspense
      fallback={
        <a href={PBTV_STREAM_URL} target="_blank" rel="noopener noreferrer" className={props.className}>
          {props.children}
        </a>
      }
    >
      <DayWatch {...props} />
    </Suspense>
  );
}

/**
 * A section kicker for the live scores band: "Live Now" with a pulsing dot
 * while a match is on, otherwise the status line with a still one.
 */
export function LiveEventKicker({ days, dark = true }: { days: PlayDay[]; dark?: boolean }) {
  return (
    <Suspense fallback={<KickerView status={NEUTRAL} dark={dark} />}>
      <Kicker days={days} dark={dark} />
    </Suspense>
  );
}
