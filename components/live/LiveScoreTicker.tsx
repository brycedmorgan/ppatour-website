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

/**
 * How many matchups the rail shows, by viewport (Wesley, 8/19):
 *
 *   < 778      1        778 – 1079   2        1080 – 1399   3        ≥ 1400   4
 *
 * ⚠ CSS, NOT A PROP, AND NOT A RESIZE LISTENER. This was `visibleCards?: 3 | 4`
 * — a fixed count each caller picked, so the /live header showed four cards
 * whether the viewport was 1600px or 800px, squeezing four unreadable slivers
 * onto a laptop. A JS breakpoint would also mean the first paint is wrong until
 * hydration measures the window. Media queries get it right on the server.
 *
 * ⚠ THE TOP TWO STEPS WERE EASED ON 9/1 (17% → 18%, 14% → 15.5%). Bryce, on a
 * 2000px display: "we have gone too far with the boxes". The clipped scores in
 * that screenshot were a separate bug — a missing `min-w-0` in MatchCard, fixed
 * there — but seven cards on a rail was past the point where a box score reads,
 * and 15.5% brings 2000px back to six.
 *
 * ⚠ AND THE WIDTHS INTENTIONALLY DON'T ADD UP TO 100%. Each leaves ~8–12% for a
 * sliver of the next card, which is the only thing telling a reader the rail
 * scrolls — same reason the homepage callout rail sits at 68vw (7/31 pt.5).
 */
const CARD_WIDTHS =
  "w-[86%] min-[778px]:w-[43%] min-[1080px]:w-[28%] min-[1400px]:w-[21%] min-[1700px]:w-[18%] min-[2000px]:w-[15.5%]";

/** Enough placeholders to fill the widest layout; the rest scroll off. */
const SKELETON_COUNT = 4;

export function LiveScoreTicker({
  showDate = true,
  logo,
  logoHref,
  transparent = false,
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
  const settled = matches !== undefined || self.loaded;
  const showCards = settled && ordered.length > 0;
  /**
   * ⚠ "NOTHING IS ON" IS NOT "STILL LOADING", AND THIS RAIL USED TO CONFLATE
   * THEM. `showCards` needs matches, so an empty window fell through to the
   * skeleton cards — four spinners, indefinitely. Measured: the rail settles at
   * 3s and then spins unchanged for as long as you watch it, which reads as a
   * feed that never loads rather than a tour that is not playing. It became the
   * normal state once the chrome was restricted to the main PPA tour (8/20),
   * because between PPA events there is nothing in the window at all.
   *
   * Skeletons are still right BEFORE the first fetch settles — that is real
   * loading. After it, say so.
   */
  const showEmpty = settled && ordered.length === 0;

  const cardW = `${CARD_WIDTHS} shrink-0`;

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
      {/* ⚠ The crest defaults to the LIVE tournament's own logo from the feed.
          TopBar used to hand this a hardcoded Veolia Atlanta crest and event
          link, so the broadcast header credited a finished April test event
          whatever was actually on. A caller can still override both. */}
      {showDate && <DateBadge logo={logo ?? self.tournament?.logo ?? undefined} logoHref={logoHref} />}

      {/* Match cards — see CARD_WIDTHS for how many show at each viewport.
          Arrow buttons scroll; native swipe still works on touch. */}
      <div className="relative min-w-0 flex-1">
        {showCards && !edges.start && <ArrowButton dir="left" onClick={() => scrollByDir(-1)} />}
        {showCards && !edges.end && <ArrowButton dir="right" onClick={() => scrollByDir(1)} />}
        <div
          ref={railRef}
          onScroll={onScroll}
          className="flex h-full items-stretch gap-2 overflow-x-auto py-2 pl-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {showCards &&
            ordered.map((m) => <MatchCard key={m.id} m={m} className={cardW} />)}
          {showEmpty && (
            <div className="flex flex-1 items-center px-3">
              <p className="text-[13px] text-white/55">
                No matches on court right now.
              </p>
            </div>
          )}
          {!settled &&
            // Genuinely loading — a spinner per card until the first fetch lands.
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <MatchCardSkeleton key={`sk-${i}`} className={cardW} />
            ))}
        </div>
      </div>
    </div>
  );
}
