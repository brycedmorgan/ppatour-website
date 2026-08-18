import Link from "next/link";
import { tvSchedule, type TvEvent, type TvWindow } from "@/lib/tv-schedule";
import { channelLabel } from "@/lib/tv-channels";

/**
 * The TV guide — one block per upcoming event, day by day, channel by channel.
 *
 * Bryce 7/28: the next events must show WHERE to watch them, and the section
 * has to "look very full and robust." So every event leads with its channel
 * lineup, then the full day grid underneath. `limit` trims it for /watch;
 * /watch/tv keeps its own filterable client list for the whole season.
 */

type Channel = TvWindow["channel"];

/**
 * Badge colours, and there are TWO maps because the same badge renders on both
 * grounds: the "Watch on" chips sit on the navy event header, the per-row badges
 * sit on white. A navy FOX badge is invisible on the header, a white one is
 * invisible on the rows — so neither map can serve both.
 */
const CHANNEL_BADGE: Record<Channel, string> = {
  "Tennis Channel": "bg-ppa-yellow text-ppa-navy",
  PBTV: "bg-ppa-blue text-white",
  FS1: "bg-ppa-navy text-white",
  FS2: "bg-ppa-navy/75 text-white",
};

const CHANNEL_CHIP: Record<Channel, string> = {
  "Tennis Channel": "bg-ppa-yellow text-ppa-navy",
  PBTV: "bg-ppa-blue text-white",
  FS1: "bg-white text-ppa-navy",
  FS2: "bg-white/85 text-ppa-navy",
};

/** Streaming first, then TV in the order a viewer would scan for it. */
const CHANNEL_ORDER: Channel[] = ["PBTV", "Tennis Channel", "FS1", "FS2"];

/** Distinct channels carrying an event, in a fixed order. */
function channelsFor(event: TvEvent): Channel[] {
  const seen = new Set<Channel>();
  for (const day of event.days) {
    for (const w of day.windows) seen.add(w.channel);
  }
  return CHANNEL_ORDER.filter((c) => seen.has(c));
}

/** Total scheduled hours can't be derived from the free-text windows, so the
 *  robustness comes from day + round + window coverage instead. */
function upcoming(todayIso: string): TvEvent[] {
  return tvSchedule
    .filter((e) => e.endIso >= todayIso)
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
}

export function TvGuide({ limit }: { limit?: number }) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const events = upcoming(today).slice(0, limit ?? undefined);

  if (!events.length) {
    return (
      <p className="border border-ppa-line bg-white p-5 text-sm text-ppa-navy/55">
        The next season&apos;s broadcast windows post here as soon as they are
        confirmed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {events.map((e) => {
        const channels = channelsFor(e);
        return (
          <section key={e.name} data-reveal className="border border-ppa-line bg-white">
            {/* Event header — name, where, and the channels carrying it. */}
            <div className="border-b border-ppa-line bg-ppa-navy px-4 py-3.5 text-white">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    e.league === "MLP" ? "bg-ppa-yellow text-ppa-navy" : "bg-ppa-blue"
                  }`}
                >
                  {e.league}
                </span>
                {e.slug ? (
                  <Link
                    href={`/events/${e.startIso.slice(0, 4)}/${e.slug}`}
                    className="font-display text-lg uppercase leading-tight hover:text-ppa-sky"
                  >
                    {e.name} →
                  </Link>
                ) : (
                  <span className="font-display text-lg uppercase leading-tight">
                    {e.name}
                  </span>
                )}
                <span className="text-xs text-white/55">{e.location}</span>
                {e.tier && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-yellow">
                    {e.tier} pts
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Watch on
                </span>
                {channels.map((c) => (
                  <span
                    key={c}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      CHANNEL_CHIP[c] ?? "bg-white/15 text-white"
                    }`}
                  >
                    {channelLabel(c)}
                  </span>
                ))}
              </div>
            </div>

            {/* Day grid */}
            <div className="hidden grid-cols-[7rem_1fr_10rem] gap-3 border-b border-ppa-line bg-ppa-paper px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid">
              <span>Date</span>
              <span>Round</span>
              <span>Channel</span>
            </div>
            {e.days.map((d) =>
              d.windows.map((w, i) => (
                <div
                  key={`${d.date}-${w.channel}-${w.round}`}
                  className="grid gap-1 border-b border-ppa-line/60 px-4 py-2.5 last:border-b-0 sm:grid-cols-[7rem_1fr_10rem] sm:items-center sm:gap-3"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-ppa-navy">
                    {i === 0 ? `${d.dow} ${d.date}` : ""}
                  </span>
                  <span className="text-sm text-ppa-navy/70">
                    {w.round}
                    <span className="ml-2 text-xs tabular-nums text-ppa-navy/45">
                      {w.window}
                    </span>
                    {/* Tape windows are replays — don't let one read as live. */}
                    {w.tape && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
                        Replay
                      </span>
                    )}
                  </span>
                  <span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        CHANNEL_BADGE[w.channel] ?? "bg-ppa-navy text-white"
                      }`}
                    >
                      {channelLabel(w.channel)}
                    </span>
                  </span>
                </div>
              )),
            )}
          </section>
        );
      })}
    </div>
  );
}
