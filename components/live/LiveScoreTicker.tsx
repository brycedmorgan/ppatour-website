"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TickerMatch, TickerResult } from "@/lib/ticker-api";
import { useLiveTicker } from "@/components/live/use-live-ticker";
import { MatchCard, MatchCardSkeleton } from "@/components/live/MatchCard";

/**
 * Live broadcast score ticker for the /live header. Reads real match data from
 * the shared useLiveTicker hook (server proxy → Pickleball.com
 * homepage_score_ticker), polled every 15s. Override the partner with
 * ?partner=… (e.g. "PPA Australia", or the dev tournament's partner). Shows a
 * loading spinner when nothing is live. The sticky live banner (StickyBuyBar)
 * reads the same hook, so both surfaces stay in sync.
 */

/** Tournament logo (optional) + month + day badge. Lazy-computed;
 *  suppressHydrationWarning covers the rare midnight SSR/client boundary. */
function DateBadge({ logo, logoHref }: { logo?: string; logoHref?: string }) {
  const [date] = useState(() => {
    const d = new Date();
    return {
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(d.getDate()),
    };
  });
  const logoImg = logo && (
    <div className="relative h-32 w-full">
      <Image src={logo} alt="" fill sizes="224px" className="object-contain" />
    </div>
  );
  return (
    <div
      suppressHydrationWarning
      className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 border-r border-white/10 px-3 py-2 leading-none text-white"
    >
      {logo &&
        (logoHref ? (
          <Link href={logoHref} aria-label="Tournament page" className="w-full transition hover:opacity-80">
            {logoImg}
          </Link>
        ) : (
          logoImg
        ))}
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        {date.month}
      </span>
      <span className="font-display text-2xl leading-none">{date.day}</span>
    </div>
  );
}

function ArrowButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ppa-line bg-white text-ppa-navy shadow-md transition hover:bg-ppa-paper ${
        dir === "left" ? "left-1" : "right-1"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}

export function LiveScoreTicker({
  showDate = true,
  logo,
  logoHref,
  transparent = false,
  visibleCards = 4,
  initialData,
  matches,
}: {
  /** Month/day badge on the left (the /live broadcast header). */
  showDate?: boolean;
  /** Tournament logo shown above the date in the badge. */
  logo?: string;
  /** Link target for the logo (the tournament page). */
  logoHref?: string;
  /** Drop the navy backdrop so cards sit on the host section. */
  transparent?: boolean;
  /** How many full cards fit before the rail scrolls. */
  visibleCards?: 3 | 4;
  /** Server-prefetched matches so the first paint skips the fetch wait. */
  initialData?: TickerResult;
  /**
   * Controlled mode: render exactly these matches and don't poll. For a host
   * that already reads the ticker itself — /watch hides its whole Live Now band
   * when nothing is in progress (WatchLiveNow) — so the page keeps one poll and
   * the host's gate can never disagree with what the rail is showing.
   */
  matches?: TickerMatch[];
} = {}) {
  const self = useLiveTicker({ initialData, enabled: matches === undefined });
  const ordered = matches ?? self.ordered;
  // No live matches (still loading, or nothing live right now) → keep the
  // loading animation rather than showing fabricated placeholder cards.
  // Controlled mode has nothing to wait for.
  const showCards = (matches !== undefined || self.loaded) && ordered.length > 0;

  // Card width tuned so N cards show with a sliver of the next.
  const cardW = `${visibleCards === 3 ? "w-[31%]" : "w-[23%]"} shrink-0`;

  // Arrow-button scrolling (native swipe still works on touch).
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  function onScroll() {
    const el = railRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }
  function scrollByDir(dir: 1 | -1) {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // Recompute which arrows to show when the data or viewport changes.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
    const id = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", update);
    };
  }, [ordered, showCards]);

  return (
    <div className={`flex items-stretch ${transparent ? "" : "bg-ppa-navy"}`}>
      {showDate && <DateBadge logo={logo} logoHref={logoHref} />}

      {/* Match cards — width tuned so `visibleCards` show with a sliver of
          the next. Arrow buttons scroll; native swipe still works on touch. */}
      <div className="relative min-w-0 flex-1">
        {showCards && !edges.start && <ArrowButton dir="left" onClick={() => scrollByDir(-1)} />}
        {showCards && !edges.end && <ArrowButton dir="right" onClick={() => scrollByDir(1)} />}
        <div
          ref={railRef}
          onScroll={onScroll}
          className="flex h-full items-stretch gap-2 overflow-x-auto py-2 pl-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {showCards
            ? ordered.map((m) => <MatchCard key={m.id} m={m} className={cardW} />)
            : // Loading / no-live state — spinner in each card.
              Array.from({ length: visibleCards }).map((_, i) => (
                <MatchCardSkeleton key={`sk-${i}`} className={cardW} />
              ))}
        </div>
      </div>
    </div>
  );
}
