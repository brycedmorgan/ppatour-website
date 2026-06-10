"use client";

import { useEffect, useRef, useState } from "react";

type Card = {
  title: string;
  body: string;
  svg: React.ReactNode;
};

/* Brand-colored mini diagrams. Plain SVG so they're crisp at any size. */
const NAVY = "#0c2b44";
const BLUE = "#228be6";
const YELLOW = "#e7e700";
const SKY = "#4dc1ef";
const PAPER = "#f3f5f7";

function CourtSvg({ kitchen = false }: { kitchen?: boolean }) {
  // Pickleball court 20:44 → aspect 5:11 (vertical). Use horizontal layout 11:5.
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <rect x="10" y="10" width="200" height="80" fill="#ffffff" stroke={NAVY} strokeWidth="2" />
      {/* Net */}
      <line x1="110" y1="10" x2="110" y2="90" stroke={NAVY} strokeWidth="2.5" />
      <line x1="110" y1="10" x2="110" y2="90" stroke={NAVY} strokeWidth="1" strokeDasharray="2 2" />
      {/* Service center line */}
      <line x1="10" y1="50" x2="75" y2="50" stroke={NAVY} strokeWidth="1.5" />
      <line x1="145" y1="50" x2="210" y2="50" stroke={NAVY} strokeWidth="1.5" />
      {/* No-volley zones (kitchens) */}
      <rect x="75" y="10" width="35" height="80" fill={kitchen ? YELLOW : "#ffffff"} stroke={NAVY} strokeWidth="1.5" opacity={kitchen ? 0.55 : 1} />
      <rect x="110" y="10" width="35" height="80" fill={kitchen ? YELLOW : "#ffffff"} stroke={NAVY} strokeWidth="1.5" opacity={kitchen ? 0.55 : 1} />
    </svg>
  );
}

function NetSvg() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <line x1="10" y1="85" x2="210" y2="85" stroke={NAVY} strokeWidth="1.5" />
      {/* Posts */}
      <line x1="20" y1="40" x2="20" y2="85" stroke={NAVY} strokeWidth="3" />
      <line x1="200" y1="40" x2="200" y2="85" stroke={NAVY} strokeWidth="3" />
      {/* Net curve (slightly higher at posts) */}
      <path d="M 20 40 Q 110 52 200 40" stroke={NAVY} strokeWidth="2" fill="none" />
      <path d="M 20 50 L 200 50" stroke={NAVY} strokeWidth="0.5" strokeDasharray="2 3" />
      <path d="M 20 60 L 200 60" stroke={NAVY} strokeWidth="0.5" strokeDasharray="2 3" />
      <path d="M 20 70 L 200 70" stroke={NAVY} strokeWidth="0.5" strokeDasharray="2 3" />
      <path d="M 20 80 L 200 80" stroke={NAVY} strokeWidth="0.5" strokeDasharray="2 3" />
      {/* Labels */}
      <text x="14" y="35" fontFamily="sans-serif" fontSize="9" fontWeight="700" fill={BLUE}>
        36&quot;
      </text>
      <text x="100" y="60" fontFamily="sans-serif" fontSize="9" fontWeight="700" fill={BLUE}>
        34&quot;
      </text>
    </svg>
  );
}

function BounceSvg() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <line x1="10" y1="85" x2="210" y2="85" stroke={NAVY} strokeWidth="2" />
      <line x1="110" y1="85" x2="110" y2="20" stroke={NAVY} strokeWidth="2" />
      {/* First bounce */}
      <path d="M 30 30 Q 60 80 80 85" stroke={BLUE} strokeWidth="2" fill="none" strokeDasharray="3 3" />
      <circle cx="80" cy="85" r="4" fill={YELLOW} stroke={NAVY} strokeWidth="1" />
      <text x="35" y="22" fontFamily="sans-serif" fontSize="9" fontWeight="700" fill={BLUE}>
        1
      </text>
      {/* Second bounce */}
      <path d="M 130 35 Q 165 80 185 85" stroke={BLUE} strokeWidth="2" fill="none" strokeDasharray="3 3" />
      <circle cx="185" cy="85" r="4" fill={YELLOW} stroke={NAVY} strokeWidth="1" />
      <text x="135" y="27" fontFamily="sans-serif" fontSize="9" fontWeight="700" fill={BLUE}>
        2
      </text>
    </svg>
  );
}

function ScoreSvg() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <text x="110" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="64" fontWeight="900" fill={NAVY}>
        11
      </text>
      <text x="110" y="92" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fontWeight="700" letterSpacing="3" fill={BLUE}>
        WIN BY 2
      </text>
    </svg>
  );
}

function ServeSvg() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <rect x="10" y="10" width="200" height="80" fill="#ffffff" stroke={NAVY} strokeWidth="2" />
      <line x1="110" y1="10" x2="110" y2="90" stroke={NAVY} strokeWidth="2.5" />
      <line x1="10" y1="50" x2="75" y2="50" stroke={NAVY} strokeWidth="1" />
      <line x1="145" y1="50" x2="210" y2="50" stroke={NAVY} strokeWidth="1" />
      {/* Diagonal serve arrow */}
      <path
        d="M 40 70 Q 110 35 180 30"
        stroke={BLUE}
        strokeWidth="2.5"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={BLUE} />
        </marker>
      </defs>
      <circle cx="40" cy="70" r="4" fill={YELLOW} stroke={NAVY} strokeWidth="1" />
    </svg>
  );
}

function TrophySvg() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="220" height="100" fill={PAPER} />
      <text x="110" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="900" fill={NAVY}>
        BEST OF 3
      </text>
      <text x="110" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill={BLUE}>
        BEST OF 5 IN FINALS
      </text>
      <line x1="40" y1="82" x2="180" y2="82" stroke={SKY} strokeWidth="3" />
    </svg>
  );
}

const CARDS: Card[] = [
  {
    title: "The Court",
    body: "20 ft wide by 44 ft long — about a quarter the size of a tennis court. Same for singles or doubles.",
    svg: <CourtSvg />,
  },
  {
    title: "The Net",
    body: "36 inches tall at the sidelines, 34 inches in the middle — lower than tennis, higher than badminton.",
    svg: <NetSvg />,
  },
  {
    title: "The Two-Bounce Rule",
    body: "The first return after a serve must bounce on each side before anyone can volley. It keeps the rally honest.",
    svg: <BounceSvg />,
  },
  {
    title: "The Kitchen",
    body: "A 7-ft non-volley zone at each side of the net. You can't smash from inside it — the highlighted area.",
    svg: <CourtSvg kitchen />,
  },
  {
    title: "The Serve",
    body: "Underhand. Diagonal. The ball has to clear the kitchen and land in the opposite service box.",
    svg: <ServeSvg />,
  },
  {
    title: "Scoring",
    body: "Games to 11, win by 2. Only the serving side scores. Lose the rally on your serve — and you lose the serve.",
    svg: <ScoreSvg />,
  },
  {
    title: "Winning a Match",
    body: "Most pro matches are best-of-3 games. Finals at Slams and Worlds go best-of-5.",
    svg: <TrophySvg />,
  },
];

export function PickleballIn90() {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = el.scrollWidth / CARDS.length;
      setActive(Math.round(el.scrollLeft / cardWidth));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / CARDS.length;
    el.scrollBy({ left: cardWidth * dir, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Rail */}
      <div
        ref={railRef}
        className="flex snap-x snap-mandatory overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CARDS.map((c, i) => (
          <article
            key={c.title}
            className="flex w-full shrink-0 snap-center flex-col gap-4 pr-4 sm:w-[440px]"
          >
            <div className="relative flex aspect-[11/5] items-center justify-center overflow-hidden border border-ppa-line">
              {c.svg}
              <span className="absolute left-3 top-2 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy">
                {String(i + 1).padStart(2, "0")} / {CARDS.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                The Basics · {i + 1}
              </p>
              <h3 className="font-display text-2xl uppercase leading-[1.05] text-ppa-navy">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-ppa-navy/65">
                {c.body}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {CARDS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-ppa-blue" : "w-1.5 bg-ppa-navy/15"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="flex size-9 items-center justify-center border border-ppa-line bg-white text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="flex size-9 items-center justify-center border border-ppa-navy bg-ppa-navy text-white transition-colors hover:bg-ppa-blue"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
