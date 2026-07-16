/**
 * Live score ticker adapter — Pickleball.com Partner API.
 *
 *   GET {base}/v2/data/homepage_ticker_activity  → which partners are live
 *   GET {base}/v2/data/homepage_score_ticker     → the live/upcoming matches
 *   header  PB-API-TOKEN: <token>
 *
 * Both are authorized for our token. The score endpoint only serves the
 * current window (live / upcoming / just-finished) and filters by `partner`
 * (+ bracket_level_ids + a ±1-day window) — it ignores tournament UUIDs.
 *
 * Server-only (reads the token). Never throws — returns an empty result on any
 * problem. Map each raw match into the shape the ticker card renders.
 */

export type TickerPlayer = { name: string; headshot: string | null };
export type TickerTeam = { players: TickerPlayer[]; games: (number | null)[] };
export type TickerMatch = {
  id: string;
  round: string;
  status: "live" | "final" | "upnext";
  court: string;
  time?: string;
  /** Index (0-2) of the in-progress game when live. */
  liveGame?: number;
  /** Live stream URL for this match, when the feed provides one. */
  watchUrl?: string;
  teams: [TickerTeam, TickerTeam];
};
export type TickerTournament = { title: string; logo: string | null };
export type TickerResult = {
  matches: TickerMatch[];
  tournament: TickerTournament | null;
  partner: string;
};

/** Raw match fields (camelCase) we rely on from homepage_score_ticker. */
type ApiMatch = {
  matchUuid: string;
  matchStatus: number; // 1 upcoming · 2 live · 4 final
  roundText?: string;
  courtTitle?: string;
  winner?: number;
  localDateMatchPlannedStart?: string;
  timezoneAbbreviation?: string;
  tournamentTitle?: string;
  tournamentLogo?: string;
  gameOneStatus?: string;
  gameTwoStatus?: string;
  gameThreeStatus?: string;
  teamOneGameOneScore?: number;
  teamOneGameTwoScore?: number;
  teamOneGameThreeScore?: number;
  teamTwoGameOneScore?: number;
  teamTwoGameTwoScore?: number;
  teamTwoGameThreeScore?: number;
  teamOnePlayerOneName?: string;
  teamOnePlayerOneFirstName?: string;
  teamOnePlayerOneLastName?: string;
  teamOnePlayerOnePicture?: string;
  teamOnePlayerTwoName?: string;
  teamOnePlayerTwoFirstName?: string;
  teamOnePlayerTwoLastName?: string;
  teamOnePlayerTwoPicture?: string;
  teamTwoPlayerOneName?: string;
  teamTwoPlayerOneFirstName?: string;
  teamTwoPlayerOneLastName?: string;
  teamTwoPlayerOnePicture?: string;
  teamTwoPlayerTwoName?: string;
  teamTwoPlayerTwoFirstName?: string;
  teamTwoPlayerTwoLastName?: string;
  teamTwoPlayerTwoPicture?: string;
  streamingServices?: { liveUrl?: string; archivedUrl?: string }[];
};

function config() {
  // The ticker runs against the dev instance (separate token + URL). Falls back
  // to the production creds if the dev vars aren't set yet.
  const token = process.env.PB_API_DEV_TOKEN || process.env.PB_API_TOKEN;
  const base = (
    process.env.PB_API_DEV_URL ||
    process.env.PB_API_BASE_URL ||
    "https://api.pickleball.com"
  ).replace(/\/$/, "");
  return { token, base };
}

function shortName(first?: string, last?: string, full?: string): string {
  if (first && last) return `${first.charAt(0)}. ${last}`;
  return (full || last || first || "").trim();
}

/** "7:00 AM AEST" from an ISO string — parsed off the string to avoid TZ drift. */
function formatTime(iso?: string, tz?: string): string | undefined {
  if (!iso) return undefined;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return undefined;
  let h = Number.parseInt(m[1], 10);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}${tz ? ` ${tz}` : ""}`;
}

function mapMatch(m: ApiMatch): TickerMatch {
  const status: TickerMatch["status"] =
    m.matchStatus === 2 ? "live" : m.matchStatus === 4 ? "final" : "upnext";

  const gs = [m.gameOneStatus, m.gameTwoStatus, m.gameThreeStatus];
  const t1 = [m.teamOneGameOneScore, m.teamOneGameTwoScore, m.teamOneGameThreeScore];
  const t2 = [m.teamTwoGameOneScore, m.teamTwoGameTwoScore, m.teamTwoGameThreeScore];
  // Per-game status (verified on the dev feed): "0" not started, "1" in
  // progress (the live game), anything else (e.g. "7") completed. Upcoming
  // matches show em dashes regardless.
  const upcoming = status === "upnext";
  const notPlayed = (st?: string) => upcoming || st == null || st === "" || st === "0";
  const games1 = gs.map((st, i) => (notPlayed(st) ? null : t1[i] ?? 0));
  const games2 = gs.map((st, i) => (notPlayed(st) ? null : t2[i] ?? 0));

  let liveGame: number | undefined;
  if (status === "live") {
    const idx = gs.findIndex((st) => st === "1");
    if (idx >= 0) liveGame = idx;
  }

  const p1: TickerPlayer[] = [];
  if (m.teamOnePlayerOneLastName || m.teamOnePlayerOneName)
    p1.push({
      name: shortName(m.teamOnePlayerOneFirstName, m.teamOnePlayerOneLastName, m.teamOnePlayerOneName),
      headshot: m.teamOnePlayerOnePicture || null,
    });
  if (m.teamOnePlayerTwoLastName || m.teamOnePlayerTwoName)
    p1.push({
      name: shortName(m.teamOnePlayerTwoFirstName, m.teamOnePlayerTwoLastName, m.teamOnePlayerTwoName),
      headshot: m.teamOnePlayerTwoPicture || null,
    });

  const p2: TickerPlayer[] = [];
  if (m.teamTwoPlayerOneLastName || m.teamTwoPlayerOneName)
    p2.push({
      name: shortName(m.teamTwoPlayerOneFirstName, m.teamTwoPlayerOneLastName, m.teamTwoPlayerOneName),
      headshot: m.teamTwoPlayerOnePicture || null,
    });
  if (m.teamTwoPlayerTwoLastName || m.teamTwoPlayerTwoName)
    p2.push({
      name: shortName(m.teamTwoPlayerTwoFirstName, m.teamTwoPlayerTwoLastName, m.teamTwoPlayerTwoName),
      headshot: m.teamTwoPlayerTwoPicture || null,
    });

  // Stream link: live_url while playing, archived_url once the match is done.
  const svc = m.streamingServices?.find((s) => s.liveUrl || s.archivedUrl);
  const watchUrl = (status === "final" ? svc?.archivedUrl : svc?.liveUrl) || undefined;

  return {
    id: m.matchUuid,
    round: m.roundText || "",
    status,
    court: m.courtTitle || "",
    time: status === "upnext" ? formatTime(m.localDateMatchPlannedStart, m.timezoneAbbreviation) : undefined,
    liveGame,
    watchUrl,
    teams: [
      { players: p1, games: games1 },
      { players: p2, games: games2 },
    ],
  };
}

/** First partner with active matches (auto-pick when none is specified). */
async function pickActivePartner(token: string, base: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      partners: "PPA,PPA Australia,PPA Asia",
      bracket_level_ids: "2",
      use_camel_case: "true",
    });
    const res = await fetch(`${base}/v2/data/homepage_ticker_activity?${params}`, {
      headers: { "PB-API-TOKEN": token },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      activeTickers?: { partnersFlag: string; hasActiveMatches: boolean }[];
    };
    return json.activeTickers?.find((t) => t.hasActiveMatches)?.partnersFlag ?? null;
  } catch {
    return null;
  }
}

export async function fetchLiveTicker(partnerArg?: string): Promise<TickerResult> {
  const { token, base } = config();
  const empty: TickerResult = { matches: [], tournament: null, partner: partnerArg ?? "" };
  if (!token) return empty;

  try {
    let partner = partnerArg || process.env.PB_TICKER_PARTNER || "";
    if (!partner) partner = (await pickActivePartner(token, base)) || "PPA";

    const now = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      start_date: String(now - 86400),
      end_date: String(now + 86400),
      partner,
      bracket_level_ids: "2",
      page_size: "20",
      current_page: "1",
      use_camel_case: "true",
    });
    const res = await fetch(`${base}/v2/data/homepage_score_ticker?${params}`, {
      headers: { "PB-API-TOKEN": token },
      cache: "no-store",
    });
    if (!res.ok) return { ...empty, partner };

    const json = (await res.json()) as { results?: { results?: ApiMatch[] } };
    const rows = json.results?.results ?? [];
    const matches = rows.map(mapMatch);
    const first = rows[0];
    const tournament: TickerTournament | null = first
      ? { title: first.tournamentTitle || "", logo: first.tournamentLogo || null }
      : null;

    return { matches, tournament, partner };
  } catch {
    return empty;
  }
}
