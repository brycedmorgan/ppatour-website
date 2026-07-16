"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Event Concierge — rule-based Q&A chat for event pages. Answers come from
 * the event's own structured data (tickets, schedule, travel, watch,
 * registration), so responses are instant, free, and can't hallucinate.
 * Phase 2 swaps the matcher for a Claude-backed API route on the same facts.
 */

export type ConciergeFacts = {
  shortName: string;
  city: string;
  state: string;
  venue: string;
  dates: string;
  gates: string;
  ticketFrom: number;
  ticketsUrl: string;
  registerUrl: string;
  parking?: string;
  airport?: string;
  hotels: string[];
  dining: string[];
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
    answer: (f) => ({
      text: `Tickets start at $${f.ticketFrom} for a grounds pass (all outer courts, all day). Reserved Championship Court seating and Championship Sunday run higher — grab them early, finals sessions go first.`,
      href: f.ticketsUrl,
      hrefLabel: "Buy tickets",
    }),
  },
  {
    test: /schedule|time|when|gate|start|first serve|hours|session/i,
    answer: (f) => ({
      text: `${f.shortName} runs ${f.dates}. Gates open ${f.gates} — about an hour before first serve each day. Finals move to a late-morning start for the broadcast window. The full order of play is on this page under "Order of Play."`,
    }),
  },
  {
    test: /park|shuttle|drive|car\b/i,
    answer: (f) => ({
      text: f.parking ?? `Parking details for ${f.venue} are published event week — on-site lots open with the gates, with ADA and drop-off at the main gate.`,
    }),
  },
  {
    test: /hotel|stay|sleep|lodging|airbnb/i,
    answer: (f) => ({
      text: f.hotels.length
        ? `Closest picks: ${f.hotels.join(" · ")}. The full where-to-stay list (plus restaurants and things to do) is in "Plan Your Trip" on this page.`
        : `The where-to-stay guide is in "Plan Your Trip" on this page.`,
    }),
  },
  {
    test: /eat|food|restaurant|dinner|drink|bar\b/i,
    answer: (f) => ({
      text: f.dining.length
        ? `On the grounds, Vendor Village has a full food row. Off-site: ${f.dining.join(" · ")} — more in "Plan Your Trip."`
        : `Vendor Village has a full food row on the grounds; city picks are in "Plan Your Trip."`,
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
      text: `${f.venue}, ${f.city}${f.state ? `, ${f.state}` : ""}.${f.airport ? ` Closest airport: ${f.airport}.` : ""} There's a tap-to-open map in "Plan Your Trip."`,
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
      text: `Defending champions and the players to watch are listed under "Players" on this page — and "What's at Stake" covers the points and purse on the line at ${f.shortName}.`,
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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

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
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-40 flex h-11 items-center gap-2 bg-ppa-navy px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_32px_-8px_rgba(7,34,58,0.5)] transition hover:bg-ppa-blue active:scale-[0.97]"
      >
        <span
          aria-hidden
          className={`inline-block transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          {open ? "+" : "💬"}
        </span>
        {open ? "Close" : "Ask about this event"}
      </button>

      {/* Panel */}
      <div
        className={`fixed bottom-[8.25rem] right-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden border border-ppa-line bg-white shadow-[0_24px_56px_-12px_rgba(7,34,58,0.45)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-3 opacity-0"
        }`}
      >
        <div className="bg-ppa-navy px-4 py-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-sky">
            Event Concierge
          </p>
          <p className="font-display text-sm uppercase leading-tight">
            {facts.shortName}
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-72 min-h-40 flex-col gap-2.5 overflow-y-auto bg-ppa-paper px-3 py-3"
        >
          {msgs.length === 0 && (
            <p className="text-xs leading-relaxed text-ppa-navy/55">
              Hi! Ask me anything about {facts.shortName} — tickets, schedule,
              parking, where to stay, how to watch, or playing in the amateur
              draw.
            </p>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed motion-safe:animate-fade ${
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
    </>
  );
}
