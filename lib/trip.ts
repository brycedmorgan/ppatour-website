/**
 * Trip Builder domain logic — the intent-first flow a fan walks to turn a tour
 * stop into a booked weekend: watch, play (camps or a tournament), and travel
 * (fly/drive, stay, eat, explore).
 *
 * ⚠ The tournament matching here is a stand-in. Age/skill → the right amateur
 * bracket is presented as guidance and the register link points at the real
 * registration on pickleballtournaments.com. When Jason/Caleb's PB Tournaments
 * API exposes per-event divisions we replace `recommendDivision` with a real
 * lookup and keep everything else — the flow, the checklist, the handoff.
 */

/** The event context the server hands the client wizard. Serializable only. */
export type TripEvent = {
  /** Tournament slug — the key the saved checklist persists under. */
  slug: string;
  name: string;
  city: string;
  state: string;
  venue: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  /** Closest airport IATA, from the event guide (e.g. "RDU"). */
  airport?: string;
  airportNote?: string;
  mapQuery: string;
  /** Attribution: already-UTM'd links so the wizard can hand off cleanly. */
  ticketsUrl: string | null;
  registerUrl: string;
  /** Curated trip content, reused from the event guide. */
  hotels: TripPlace[];
  dining: TripPlace[];
  doing: TripPlace[];
  /** Top pros a fan might come to watch, for the "who to watch" flow. */
  pros: TripPro[];
};

export type TripPlace = {
  name: string;
  tag: string;
  note: string;
  href?: string;
  brand?: string;
  rate?: string;
  cutoff?: string;
};

/** A pickable pro for the "who do you want to watch?" flow. */
export type TripPro = {
  /** Canonical slug — links to /athletes/{slug} and keys the selection. */
  slug: string;
  name: string;
  /** World Pickleball Ranking — the signal the day projection is built from. */
  rank: number;
  divisions: string[];
};

export type WatchProjection = {
  /** The day they're projected to still be playing (their deepest round). */
  day: string;
  round: string;
  confidence: "Very likely" | "Likely" | "Projected";
};

/**
 * Project which day you're most likely to catch a pro on court, from their WPR
 * rank and the standard PPA stop ladder (Tue R64 → Sun final; higher seeds get
 * byes and go deeper).
 *
 * ⚠ THIS IS A PROJECTION FROM CURRENT RANKING, NOT MEASURED HISTORY. It's
 * labeled as such everywhere it renders. The real version — true per-day odds
 * and participation trends (e.g. a semi-retired pro skipping weekends) — needs
 * each player's historical round-by-round results, which live in the PPA
 * results/scores history (Dylan's source / the PB Tournaments API), not on this
 * site yet. When that lands, replace this function; the UI stays.
 */
export function projectWatchDays(rank: number): WatchProjection {
  let round: string;
  let day: string;
  if (rank <= 2) {
    round = "Championship Sunday";
    day = "Sunday";
  } else if (rank <= 6) {
    round = "Semifinals";
    day = "Saturday";
  } else if (rank <= 12) {
    round = "Quarterfinals";
    day = "Friday";
  } else if (rank <= 24) {
    round = "Round of 16";
    day = "Thursday";
  } else if (rank <= 48) {
    round = "Round of 32";
    day = "Wednesday";
  } else {
    round = "Round of 64";
    day = "Tuesday";
  }
  const confidence = rank <= 2 ? "Very likely" : rank <= 12 ? "Likely" : "Projected";
  return { day, round, confidence };
}

export type Intent = "watch" | "play" | "both";
export type PlayStyle = "casual" | "compete";
export type Travel = "fly" | "drive";

/** Amateur brackets at PPA stops run by skill and age — these are the buckets. */
export const AGE_BRACKETS = [
  "19+",
  "35+",
  "50+",
  "60+",
  "70+",
] as const;
export type AgeBracket = (typeof AGE_BRACKETS)[number];

export const SKILL_LEVELS = [
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0+",
] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const FORMATS = ["Singles", "Doubles", "Mixed Doubles"] as const;
export type Format = (typeof FORMATS)[number];

export type DivisionPick = {
  label: string;
  /** One-line human explanation of the bracket. */
  blurb: string;
  /**
   * Honest scheduling guidance. ⚠ We do NOT know the exact day an amateur
   * division plays until the event team publishes the order of play (typically
   * after the registration deadline) — so this states the window and points at
   * the order of play rather than inventing a day. Wire the real per-division
   * day from the PB Tournaments API when it lands.
   */
  when: string;
};

/** One-line plain-English help for choosing a format (for newcomers). */
export const FORMAT_HELP: Record<Format, string> = {
  Singles: "Just you on the court, one-on-one.",
  Doubles: "You and a partner of the same gender.",
  "Mixed Doubles": "A two-player team, one man and one woman.",
};

/**
 * Turn skill + age + format into the amateur bracket to register for. Stand-in
 * until the real division list is available per event — deliberately simple and
 * transparent so nobody reads it as a guarantee.
 */
export function recommendDivision(
  skill: SkillLevel,
  age: AgeBracket,
  format: Format,
): DivisionPick {
  return {
    label: `${format} · ${skill} · ${age}`,
    blurb: `Play the ${skill} bracket in the ${age} age group. Brackets are set by skill and age, so you're matched with players at your level — divisions from $89.`,
    when: "Amateur divisions play across tournament week. Your exact day is posted in the order of play once registration closes.",
  };
}

/** Readiness checklist for someone competing in the amateur draw. */
export function competeChecklist(e: TripEvent): string[] {
  return [
    `Register your division on pickleballtournaments.com before the deadline`,
    `Confirm your DUPR / skill rating is current — it sets your bracket`,
    `Pack two paddles, court shoes, and plenty of water`,
    `Arrive the day before your first match to settle in near ${e.venue}`,
    `Check the order of play the night before — amateur times shift`,
  ];
}

/**
 * Casual play near a tour stop — camps, clinics, open play. Stand-in copy until
 * we wire the PPA-sanctioned camp/clinic finder; the register link already
 * points at the real sanctioned-event search.
 */
export function casualOptions(e: TripEvent): { title: string; note: string }[] {
  return [
    {
      title: "PPA Tour Camp",
      note: `Multi-day clinics run at select stops — check the ${e.city} event schedule for camp days.`,
    },
    {
      title: "Local clinics & open play",
      note: `Drop-in clinics and rec play at courts around ${e.city} — a great warm-up before the pros take the court.`,
    },
    {
      title: "Play the same courts",
      note: `Every PPA stop runs an amateur draw on the tournament courts — switch to "compete" if you want a bracket.`,
    },
  ];
}

/** Nights between start and end (inclusive of arrival), min 1. */
export function tripNights(startDate: string, endDate: string): number {
  const a = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

/* --------------------------------------------------------------- Plan assembly
 * The single source of truth for the trip's action list. Both the on-page
 * summary AND the emailed plan render from `assembleTrip`, so they can never
 * drift — the recurring failure mode in this repo is two surfaces building the
 * "same" thing from separate code.
 */

export type TripSelection = {
  intent: Intent | null;
  style: PlayStyle | null;
  skill: SkillLevel | null;
  age: AgeBracket | null;
  format: Format | null;
  from: string;
  travel: Travel | null;
  party: number;
  watchPros: string[];
};

export type PlanAction = {
  id: string;
  title: string;
  sub?: string;
  /** Small context line (scheduling, proximity) under the sub. */
  note?: string;
  /** Primary booking link (affiliate or partner), if any. */
  href?: string;
  cta?: string;
  /** Multiple links (used by "stay" — official block + affiliate search). */
  links?: { label: string; href: string; meta?: string }[];
};

export function assembleTrip(event: TripEvent, sel: TripSelection): PlanAction[] {
  const wantsWatch = sel.intent === "watch" || sel.intent === "both";
  const wantsPlay = sel.intent === "play" || sel.intent === "both";
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const dest = event.airport ?? event.city;
  const actions: PlanAction[] = [];

  if (wantsWatch && event.ticketsUrl) {
    actions.push({
      id: "tickets",
      title: "Get your tickets",
      sub: "Grounds pass gets you every outer court, all day. Championship seats go first.",
      href: event.ticketsUrl,
      cta: "Buy tickets",
    });
  }

  if (wantsPlay && sel.style === "compete" && sel.skill && sel.age && sel.format) {
    const rec = recommendDivision(sel.skill, sel.age, sel.format);
    actions.push({
      id: "register",
      title: "Enter your division",
      sub: rec.label,
      note: rec.when,
      href: event.registerUrl,
      cta: "Register",
    });
  }

  if (sel.travel === "fly") {
    // Informational only — no booking link (Travelpayouts removed). Ready for a
    // future direct-brand link (CJ / Engine) to slot back in as `href`/`cta`.
    actions.push({
      id: "travel",
      title: "Flying in",
      sub: `${sel.from ? `From ${sel.from} — f` : "F"}ly into ${dest}, ${dateRange}`,
      // Real proximity, straight from the event guide (e.g. "RDU · ~15 min to venue").
      note: event.airportNote,
    });
  } else if (sel.travel === "drive") {
    actions.push({
      id: "travel",
      title: "Map your drive",
      sub: `To ${event.venue}, ${event.city}`,
      href: `https://maps.google.com/maps?daddr=${encodeURIComponent(event.mapQuery)}${
        sel.from ? `&saddr=${encodeURIComponent(sel.from)}` : ""
      }`,
      cta: "Get directions",
    });
  }

  // Official group-rate hotels only — direct partner links, never affiliate.
  // When a stop has none, the "Where to Stay" full guide below the builder covers it.
  const officialHotels = event.hotels.filter((h) => h.href);
  if (officialHotels.length) {
    actions.push({
      id: "stay",
      title: "Book your hotel",
      sub: "Official hotels have a group rate — book direct.",
      links: officialHotels.map((h) => ({ label: h.name, href: h.href as string, meta: h.note })),
    });
  }

  for (const slug of sel.watchPros) {
    const pro = event.pros.find((p) => p.slug === slug);
    if (!pro) continue;
    const proj = projectWatchDays(pro.rank);
    actions.push({
      id: `watch-${slug}`,
      title: `Catch ${pro.name}`,
      note: `${proj.confidence} to play into ${proj.day} (${proj.round}) — projected from ranking`,
    });
  }

  return actions;
}

/** Build the shareable `?intent=…` query string for a selection (for emails/links). */
export function tripQueryString(sel: TripSelection): string {
  const p = new URLSearchParams();
  if (sel.intent) p.set("intent", sel.intent);
  if (sel.style) p.set("style", sel.style);
  if (sel.skill) p.set("skill", sel.skill);
  if (sel.age) p.set("age", sel.age);
  if (sel.format) p.set("fmt", sel.format);
  if (sel.from.trim()) p.set("from", sel.from.trim());
  if (sel.travel) p.set("travel", sel.travel);
  if (sel.party > 1) p.set("party", String(sel.party));
  if (sel.watchPros.length) p.set("pros", sel.watchPros.join(","));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** "Aug 31 – Sep 7, 2026" style, from two YYYY-MM-DD strings. */
export function formatDateRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(`${startDate.slice(0, 10)}T12:00:00Z`);
  const e = new Date(`${endDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const year = e.getUTCFullYear();
  const sStr = s.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  const eStr = e.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  return `${sStr} – ${eStr}, ${year}`;
}
