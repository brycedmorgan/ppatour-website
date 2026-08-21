import { getBroadcast, type BroadcastSlot } from "@/lib/broadcast";
import { matchdayPrimary } from "@/lib/matchday";

/**
 * The "how to watch" cards on an event page, derived from THAT event's own
 * broadcast windows.
 *
 * ⚠ THIS WAS A MODULE-LEVEL CONSTANT — the same three cards on all 20 event
 * pages — and it published a false claim. The Veolia Arizona Open carries
 * PBTV and FOX only, with ZERO Tennis Channel windows, yet its page ran a
 * Tennis Channel card reading "Featured rounds and Championship Sunday on
 * national television", while its actual FS1 Championship Sunday window sat in
 * the table below with no card at all. Telling someone the wrong network is the
 * one mistake the page whose only job is "where to watch" cannot make.
 *
 * Cards now come from `lib/broadcast.ts`, the transcription of the broadcast
 * sheet, so a network appears on an event page if and only if it carries a
 * window there.
 */

export type WatchCard = {
  name: string;
  logo?: string;
  note: string;
  detail: string;
  href?: string;
};

const PBTV_URL =
  "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=event&utm_content=event-watch-pbtv";

/**
 * How each platform in the sheet is presented.
 *
 * ⚠ FS1 AND FS2 SHARE ONE CARD. FOX splits a single event's coverage across
 * both networks — Arizona runs FS2 Friday and Saturday, FS1 on Championship
 * Sunday — so two cards would read as two broadcasters. The card names the
 * channels in its note instead, which is also how the schedule sheet bills them.
 *
 * ⚠ AND THE FOX MARK IS THE PARENT BRAND, NOT AN FS1 LOGO. There is no FS1 or
 * FS2 mark in public/ppa/networks/. Using the FOX mark and spelling out the
 * channel is accurate; inventing a wordmark for a network we don't have art for
 * is not. Ask the broadcast team for FS1/FS2 marks and this gets sharper.
 */
const GROUP: Record<string, string> = {
  PBTV: "PBTV",
  "Tennis Channel": "Tennis Channel",
  FS1: "FOX Sports",
  FS2: "FOX Sports",
  CBS: "CBS",
  FOX: "FOX",
};

const PRESENTATION: Record<string, { name: string; logo?: string; detail: string; href?: string }> = {
  PBTV: {
    name: "PickleballTV",
    logo: "/ppa/networks/pbtv.png",
    detail: "Stream on PBTV",
    href: PBTV_URL,
  },
  "Tennis Channel": {
    // PNG, not SVG — next/image 400s on SVG through the optimizer, which left
    // this card broken once already.
    name: "Tennis Channel",
    logo: "/ppa/networks/tennis-channel.png",
    detail: "Check local listings",
  },
  "FOX Sports": {
    name: "FOX Sports",
    logo: "/ppa/networks/fox.png",
    detail: "Check local listings",
  },
  CBS: { name: "CBS", logo: "/ppa/networks/cbs.svg", detail: "Check local listings" },
  FOX: { name: "FOX", logo: "/ppa/networks/fox.png", detail: "Check local listings" },
};

const MATCHDAY: WatchCard = {
  name: "MATCHDAY App",
  logo: "/ppa/networks/matchday.png",
  note: "Live scores, brackets, order of play, and match alerts.",
  detail: "iOS · Android",
  href: matchdayPrimary("event-watch-matchday"),
};

/** "Thursday" → "Thu". Anything unrecognised is left as written. */
function shortDay(day: string): string {
  const d = day.trim();
  return /^(mon|tue|wed|thu|fri|sat|sun)/i.test(d) ? d.slice(0, 3) : d;
}

/** The days a group is on air, in sheet order, de-duplicated. */
function daysOf(slots: BroadcastSlot[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of slots) {
    const d = shortDay(s.day);
    if (d && !seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
  }
  return out;
}

/** "FS2 Fri, Sat · FS1 Sun" — which FOX network is on which day. */
function foxNote(slots: BroadcastSlot[]): string {
  const byChannel = new Map<string, string[]>();
  for (const s of slots) {
    const days = byChannel.get(s.platform) ?? [];
    const d = shortDay(s.day);
    if (!days.includes(d)) days.push(d);
    byChannel.set(s.platform, days);
  }
  return [...byChannel.entries()].map(([ch, days]) => `${ch} ${days.join(", ")}`).join(" · ");
}

function noteFor(group: string, slots: BroadcastSlot[]): string {
  const days = daysOf(slots);
  if (group === "PBTV") {
    // PBTV carries every round; the day count is the honest way to say so.
    return days.length > 1
      ? `Every court, every match — live all ${days.length} days.`
      : "Every court, every match — the home of live PPA streaming.";
  }
  if (group === "FOX Sports") return `National TV coverage — ${foxNote(slots)}.`;
  const tape = slots.some((s) => s.type === "TAPE");
  return `National TV coverage — ${days.join(", ")}${tape ? " (includes a replay window)" : ""}.`;
}

/**
 * Cards for one event, in a fixed reading order: the stream first, then the TV
 * networks in the order the sheet first uses them, then the app.
 *
 * ⚠ AN EVENT WITH NO SHEET DATA GETS THE APP ONLY. Five main-tour stops have no
 * broadcast rows yet (PPA Open, Cincinnati, PPA Finals and two 2027 editions),
 * and for those we do not know the plan — not even whether PBTV carries them.
 * Naming a network there would be the same invention this function exists to
 * delete. MATCHDAY is safe because it is the tour's own app, not a broadcast
 * window: it carries scores and order of play for every event.
 */
export function watchCardsFor(slug: string): WatchCard[] {
  const slots = getBroadcast(slug);
  if (slots.length === 0) return [MATCHDAY];

  const byGroup = new Map<string, BroadcastSlot[]>();
  for (const s of slots) {
    const group = GROUP[s.platform] ?? s.platform;
    byGroup.set(group, [...(byGroup.get(group) ?? []), s]);
    // A simulcast names its partner in `secondary` and nowhere else — Chicago's
    // Tennis Channel rows carry "PBTV" there. Without this a network that only
    // ever appears as the secondary would have no card.
    if (s.secondary) {
      const sec = GROUP[s.secondary] ?? s.secondary;
      if (!byGroup.has(sec)) byGroup.set(sec, []);
      byGroup.set(sec, [...(byGroup.get(sec) ?? []), { ...s, platform: s.secondary }]);
    }
  }

  const ordered = [...byGroup.keys()].sort((a, b) => {
    if (a === "PBTV") return -1;
    if (b === "PBTV") return 1;
    return 0;
  });

  const cards: WatchCard[] = [];
  for (const group of ordered) {
    const presentation = PRESENTATION[group];
    const groupSlots = byGroup.get(group) ?? [];
    cards.push({
      // An unknown platform still gets a card, named as the sheet names it —
      // better a bare name than dropping a broadcaster off the page.
      name: presentation?.name ?? group,
      logo: presentation?.logo,
      note: noteFor(group, groupSlots),
      detail: presentation?.detail ?? "Check local listings",
      href: presentation?.href,
    });
  }
  cards.push(MATCHDAY);
  return cards;
}

/**
 * Which channels carry each DAY of an event, keyed by weekday name
 * ("Thursday" → "FS2 · PBTV").
 *
 * ⚠ THE SCHEDULE TEMPLATE USED TO INVENT THIS, and it was the same false claim
 * the cards carried. `buildSchedule` hardcoded `live = "FOX · PBTV"` on
 * Championship Sunday and `"Tennis Channel · PBTV"` on the semis and quarters
 * for EVERY event, so the Veolia Arizona Open — which has no Tennis Channel
 * window at all — printed "Tennis Channel · PBTV" four times in its Order of
 * Play and again in its Watch table, beside a card set that correctly said FOX.
 * One page, two answers, and the invented one was louder.
 *
 * An event with no sheet rows returns an empty map, so its days simply carry no
 * channel — the honest state for a broadcast plan that has not been announced.
 */
export function channelsByDay(slug: string): Map<string, string> {
  const byDay = new Map<string, string[]>();
  for (const s of getBroadcast(slug)) {
    const names = byDay.get(s.day) ?? [];
    for (const n of [s.platform, s.secondary]) {
      if (!n) continue;
      // The sheet writes the stream as "PBTV"; the page has always shown it
      // under that short name, so it is left as written.
      if (!names.includes(n)) names.push(n);
    }
    byDay.set(s.day, names);
  }
  /**
   * Keyed by BOTH "Thursday" and "Thu". The templated schedule computes a full
   * weekday from the date; the hand-authored overrides in lib/event-schedule.ts
   * store a short `dow`. One map serves both rather than each caller
   * normalising — and a caller that normalises differently is how these two
   * surfaces drifted apart in the first place.
   */
  const out = new Map<string, string>();
  for (const [day, names] of byDay) {
    const label = names.join(" · ");
    out.set(day, label);
    out.set(day.slice(0, 3), label);
  }
  return out;
}

/** "2026-09-20" → "Sunday", so a schedule day can find its broadcast row. */
export function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()];
}
