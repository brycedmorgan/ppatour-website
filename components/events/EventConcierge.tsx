"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Event Concierge — rule-based Q&A chat for event pages. Answers come from
 * the event's own structured data (tickets, schedule, travel, watch,
 * registration), so responses are instant, free, and can't hallucinate.
 * Phase 2 swaps the matcher for a Claude-backed API route on the same facts.
 */

export type ConciergeFacts = {
  /** Full event name, title sponsor included — see Tournament.name. */
  name: string;
  city: string;
  state: string;
  venue: string;
  dates: string;
  gates: string;
  /**
   * Null when tickets aren't on sale (unlisted on Tixr, or held back by hand —
   * see TICKETS_HIDDEN). The concierge must not quote a price or hand out a
   * ticket link in that state: it was answering "Tickets start at $39" off the
   * tier-table fallback for events whose own page said "Tickets Coming Soon".
   */
  ticketFrom: number | null;
  ticketsUrl: string | null;
  registerUrl: string;
  /**
   * Always supplied — `parkingText(slug)` returns the event team's finalized
   * details or the approved holding line, so the concierge never has to invent
   * a parking answer. Required (not optional) so it can't silently go missing.
   * May carry newlines (labelled blocks + an address); the bubble renders them.
   */
  parking: string;
  /**
   * The event's Tixr page, where a premium parking pass is bought. Null when
   * tickets aren't on sale — same rule as `ticketsUrl` above, so the concierge
   * can't hand out a Tixr link for a stop we're not selling. Carries its own UTM
   * content so a parking click doesn't report as a ticket click.
   */
  parkingPassUrl: string | null;
  airport?: string;
  hotels: string[];
  dining: string[];
  /**
   * Is the "Plan Your Trip" section actually on the page right now?
   *
   * ⚠ The travel section disappears at first serve (Connor, 9/1), and four
   * answers below used to end with `... in "Plan Your Trip" on this page`.
   * Sending a fan looking for a section that isn't there is worse than a
   * shorter answer, so the pointer is appended only when the section exists.
   * The hotel and restaurant NAMES still come through either way — those are
   * useful to somebody who is already in town.
   */
  hasTripGuide: boolean;
  watch: string;
};

type Msg = {
  role: "user" | "bot";
  text: string;
  href?: string;
  hrefLabel?: string;
};

type Intent = {
  test: RegExp;
  answer: (f: ConciergeFacts) => Omit<Msg, "role">;
};

const INTENTS: Intent[] = [
  {
    test: /ticket|price|cost|how much|buy|seat/i,
    answer: (f) =>
      f.ticketFrom == null || !f.ticketsUrl
        ? {
            text: `Tickets for ${f.name} aren't on sale yet — we haven't announced pricing for this stop. Keep an eye on this page and we'll post them as soon as they're live.`,
          }
        : {
            text: `Tickets start at $${f.ticketFrom} for a grounds pass (all outer courts, all day). Reserved Championship Court seating and Championship Sunday run higher — grab them early, finals sessions go first.`,
            href: f.ticketsUrl,
            hrefLabel: "Buy tickets",
          },
  },
  {
    test: /schedule|time|when|gate|start|first serve|hours|session/i,
    answer: (f) => ({
      text: `${f.name} runs ${f.dates}. Gates open ${f.gates} — about an hour before first serve each day. Finals move to a late-morning start for the broadcast window. The full order of play is on this page under "Order of Play."`,
    }),
  },
  {
    test: /park|shuttle|drive|car\b/i,
    answer: (f) => ({
      text: f.parking,
      // Only when the copy actually mentions a pass to buy — most stops' parking
      // answer is the holding line, and a Tixr button under that would imply a
      // pass exists.
      ...(f.parkingPassUrl && /premium parking/i.test(f.parking)
        ? { href: f.parkingPassUrl, hrefLabel: "Premium parking on Tixr" }
        : {}),
    }),
  },
  {
    test: /hotel|stay|sleep|lodging|airbnb/i,
    answer: (f) => ({
      text: f.hotels.length
        ? `Closest picks: ${f.hotels.join(" · ")}.${f.hasTripGuide ? ` The full where-to-stay list (plus restaurants and things to do) is in "Plan Your Trip" on this page.` : ""}`
        : f.hasTripGuide
          ? `The where-to-stay guide is in "Plan Your Trip" on this page.`
          : `We don't have a hotel list for this stop.`,
    }),
  },
  {
    test: /eat|food|restaurant|dinner|drink|bar\b/i,
    answer: (f) => ({
      text: f.dining.length
        ? `On the grounds, Vendor Village has a full food row. Off-site: ${f.dining.join(" · ")}${f.hasTripGuide ? ` — more in "Plan Your Trip."` : "."}`
        : f.hasTripGuide
          ? `Vendor Village has a full food row on the grounds; city picks are in "Plan Your Trip."`
          : `Vendor Village has a full food row on the grounds.`,
    }),
  },
  {
    test: /watch|stream|tv|channel|broadcast|youtube|home/i,
    answer: (f) => ({
      text: f.watch,
    }),
  },
  {
    test: /play|register|amateur|bracket|compete|sign ?up|division/i,
    answer: (f) => ({
      text: `Yes — every PPA stop has an amateur draw on the same courts as the pros. Brackets run by skill and age, from $89 per division. Registration is on pickleballtournaments.com.`,
      href: f.registerUrl,
      hrefLabel: "Register to play",
    }),
  },
  {
    test: /fly|airport|plane|get there|directions|address|where is|located/i,
    answer: (f) => ({
      text: `${f.venue}, ${f.city}${f.state ? `, ${f.state}` : ""}.${f.airport ? ` Closest airport: ${f.airport}.` : ""}${f.hasTripGuide ? ` There's a tap-to-open map in "Plan Your Trip."` : ` There's a tap-to-open map under "Venue Guide."`}`,
    }),
  },
  {
    test: /kid|child|family|stroller/i,
    answer: () => ({
      text: `Very family-friendly — kids' tickets are discounted at most sessions, strollers are fine on the grounds, and the vendor village runs demos all day. Junior clinics often run event week (see "Get Involved" on this page).`,
    }),
  },
  {
    test: /rain|weather|hot|heat/i,
    answer: () => ({
      text: `Play continues through heat with shaded seating and water refill stations; rain pauses matches and sessions extend or shift — tickets stay valid for your session that day. Check @ppatour on X for live weather updates during the event.`,
    }),
  },
  {
    test: /bag|chair|bring|cooler|camera|policy/i,
    answer: () => ({
      text: `Small bags are fine (they're checked at the gate); no coolers or outside alcohol. Personal cameras are welcome — no tripods on the seating lines. Full policy comes with your ticket email.`,
    }),
  },
  {
    test: /defend|champion|who won|stake|points/i,
    answer: (f) => ({
      text: `Defending champions and the players to watch are listed under "Players" on this page — and "What's at Stake" covers the points and purse on the line at ${f.name}.`,
    }),
  },
];

const CHIPS = [
  "Tickets?",
  "Schedule & gates",
  "Parking",
  "Where to stay",
  "How to watch",
  "Can I play in it?",
];

export function EventConcierge({ facts }: { facts: ConciergeFacts }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  /**
   * Dismissal (Wesley, 8/4: it "needs to have a close button and close if the
   * user clicks outside of its container"). Three ways out, all only wired up
   * while the panel is open so a closed widget costs the page nothing:
   * the × in the panel header, a click anywhere outside, and Escape.
   *
   * ⚠ `pointerdown`, not `click`. A click fires on release, so dragging a text
   * selection that happens to end outside the panel would dismiss it, and on
   * touch the delay is noticeable. Pointerdown also beats the launcher's own
   * click — hence the ref check covering the WHOLE widget, launcher included,
   * without which tapping the launcher to close would fire this first, close the
   * panel, and then the launcher's toggle would immediately reopen it.
   */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Send focus back where it came from, or it lands on <body>.
      launcherRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    const intent = INTENTS.find((i) => i.test.test(question));
    const reply: Msg = intent
      ? { role: "bot", ...intent.answer(facts) }
      : {
          role: "bot",
          text: `Good question — I don't have that one yet. The PPA events team can help directly, or check the full guide sections on this page.`,
          href: "/about/contact",
          hrefLabel: "Contact the events team",
        };
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    window.setTimeout(() => setMsgs((m) => [...m, reply]), 450);
  }

  return (
    /**
     * ⚠ IT RIDES THE BOTTOM CHROME RATHER THAN CLEARING ITS WORST CASE (Wesley,
     * 8/4: the launcher "needs to stay at the bottom of the page and then slide
     * up when that bottom CTA with tickets pops up").
     *
     * `bottom` sits just above the cookie banner — that one is either there or
     * not, it doesn't animate. The buy bar DOES: it slides in past 480px of
     * scroll and back out above it, so reserving its height in `bottom` left the
     * launcher hovering a bar's height above nothing for the whole first screen.
     * Instead the widget is translated up by `--buy-bar-visible-h`, which
     * StickyBuyBar publishes as 0px or the bar's height, and the transform is
     * transitioned on the bar's own curve and duration so the two move together.
     *
     * ⚠ Transform, not an animated `bottom`. `bottom` animates off the main
     * thread's layout path; a transform is composited, and this rides a scroll
     * handler on the page whose LCP two sessions were spent protecting.
     *
     * This replaced a hard-coded `bottom-20`, which measured a 16px overlap with
     * the buy bar at 390px — the bug that started this.
     */
    <div
      ref={rootRef}
      style={{
        bottom: "calc(var(--cookie-banner-h, 0px) + 1rem)",
        transform: "translateY(calc(-1 * var(--buy-bar-visible-h, 0px)))",
      }}
      className="fixed right-4 z-40 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
    >
      {/* Launcher */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_32px_-8px_rgba(7,34,58,0.5)] transition hover:bg-ppa-blue-deep active:scale-[0.97]"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          {open ? "+" : "💬"}
        </span>
        {open ? "Close" : "Ask about this event"}
      </button>

      {/* Panel — absolute so a closed panel never pushes the launcher around. */}
      <div
        className={`absolute bottom-[calc(100%+0.75rem)] right-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden border border-ppa-line bg-white shadow-[0_24px_56px_-12px_rgba(7,34,58,0.45)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-3 opacity-0"
        }`}
      >
        <div className="bg-ppa-navy px-4 py-3 text-white">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-sky">
                Event Concierge
              </p>
              <p className="font-display text-sm uppercase leading-tight">
                {facts.name}
              </p>
            </div>
            {/* The conventional affordance. Click-outside and Escape also close
                it, but neither is discoverable and neither exists on a phone,
                where "outside" is whatever page content the panel is covering. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close the event concierge"
              className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center text-lg leading-none text-white/60 transition-colors hover:text-white"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-72 min-h-40 flex-col gap-2.5 overflow-y-auto bg-ppa-paper px-3 py-3"
        >
          {msgs.length === 0 && (
            <p className="text-xs leading-relaxed text-ppa-navy/55">
              Hi! Ask me anything about {facts.name} — tickets, schedule,
              parking, where to stay, how to watch, or playing in the amateur
              draw.
            </p>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              // whitespace-pre-line: the parking answer is the event team's
              // multi-block copy (headings + an address) — without this it
              // collapses into one run-on line.
              className={`max-w-[85%] whitespace-pre-line px-3 py-2 text-xs leading-relaxed motion-safe:animate-fade ${
                m.role === "user"
                  ? "self-end bg-ppa-blue text-white"
                  : "self-start border border-ppa-line bg-white text-ppa-navy"
              }`}
            >
              {m.text}
              {m.href && (
                <a
                  href={m.href}
                  target={m.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    m.href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  className="mt-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue hover:text-ppa-blue-deep"
                >
                  {m.hrefLabel} →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-ppa-line bg-white px-3 py-2.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ask(c)}
              className="border border-ppa-line px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy/60 transition-colors hover:border-ppa-blue hover:text-ppa-blue"
            >
              {c}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex border-t border-ppa-line"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question…"
            aria-label="Ask a question about this event"
            className="min-w-0 flex-1 px-3 py-2.5 text-base text-ppa-navy outline-none placeholder:text-ppa-navy/35 sm:text-sm"
          />
          <button
            type="submit"
            className="bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
