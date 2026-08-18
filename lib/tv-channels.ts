import type { TvWindow } from "./tv-schedule";

/**
 * How a broadcast channel is presented, in ONE place — `TvGuide` (/watch) and
 * the filterable list (/watch/tv) both read it.
 *
 * ⚠ THIS EXISTS BECAUSE BOTH COMPONENTS USED TO HARDCODE THE LABEL. /watch/tv
 * rendered `channel === "Tennis Channel" ? "Tennis Channel" : "PickleballTV"`,
 * so the FOX windows added by the 8/13 sheet would have published under
 * PickleballTV's name — a broadcast window attributed to the wrong network.
 * Add a channel to `TvWindow["channel"]` and TypeScript requires a label here.
 */
export const CHANNEL_LABEL: Record<TvWindow["channel"], string> = {
  PBTV: "PickleballTV",
  "Tennis Channel": "Tennis Channel",
  // FS1/FS2 are the on-air network names; "FOX Sports 1" is not how these
  // windows are billed on the schedule sheet or on air.
  FS1: "FS1",
  FS2: "FS2",
};

export function channelLabel(channel: TvWindow["channel"]): string {
  return CHANNEL_LABEL[channel] ?? channel;
}

/** FOX splits its windows across FS1 and FS2, so they group under one filter. */
export function isFoxChannel(channel: TvWindow["channel"]): boolean {
  return channel === "FS1" || channel === "FS2";
}

export type ChannelFilter = "all" | "PBTV" | "Tennis Channel" | "FOX";

/**
 * ⚠ EVERY CHANNEL MUST BE REACHABLE BY SOME FILTER. A window no filter can
 * match is invisible to anyone who touches the controls — the same bug the
 * /events points filter had when the sub-1,000 stops had no reachable option.
 */
export function matchesFilter(
  channel: TvWindow["channel"],
  filter: ChannelFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "FOX") return isFoxChannel(channel);
  return channel === filter;
}
