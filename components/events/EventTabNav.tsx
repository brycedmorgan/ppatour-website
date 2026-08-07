"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Tab = { id: string; label: string };

/**
 * Event page floating nav. At the top of the page the first slot is the
 * Overview tab; once the visitor scrolls past the hero it becomes the event's
 * own name (and mark, when the event has one) — the bar reads as THIS
 * event's menu, in the event's brand color.
 *
 * Scroll behavior (Connor, 7/20): once the visitor is into the page, the
 * SITE chrome (ticker + top nav) slides away and THIS bar — with its Buy
 * Tickets CTA — owns the top edge all the way down. Implemented by stamping
 * `data-event-nav-scrolled` on <html>; globals.css translates `.site-chrome`
 * out, and the bar's own `top` collapses 4rem → 0.
 *
 * The bar also tracks WHICH section you are in and marks that tab (Wesley,
 * 8/4). It follows you down nine sections, and without this it was a row of
 * identical links that never told you where you were — which is most of what a
 * sticky nav is for on a phone, where only three or four tabs are on screen at
 * once and the rest are off to the right.
 */
export function EventTabNav({
  tabs,
  eventName,
  icon,
  ticketsUrl,
  ticketPriceFrom,
}: {
  tabs: Tab[];
  eventName: string;
  icon?: string;
  /** Buy Tickets CTA (UTM-tagged) pinned to the right edge of the bar. */
  ticketsUrl?: string;
  ticketPriceFrom?: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  // Whether the rail is scrolled hard against each end — drives both the edge
  // fade and which arrow is on screen. Two booleans rather than one object so
  // React can bail out of the re-render; this is set from a scroll listener.
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  // Is there enough hidden to be worth an arrow at all? A rail that overruns by
  // a few pixels of fractional layout would otherwise offer a control that
  // scrolls almost nothing and then vanishes, which reads as a glitch.
  const [scrollable, setScrollable] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /**
   * One scroll listener drives both the collapse and the active section,
   * coalesced into a rAF: this runs on every scroll event on the page whose LCP
   * two previous sessions were spent protecting, so it must not do layout work
   * per event.
   *
   * The active section is the LAST one whose top has passed under the bar — not
   * the one most in view. That is what matches the visitor's sense of "where am
   * I": a heading that has just slid under the sticky bar is the section you are
   * reading, even when the next one is already creeping up from the bottom.
   */
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setScrolled(window.scrollY > 420);

      const bar = navRef.current;
      // A little below the bar's own bottom edge, so a heading counts as
      // "reached" the moment it tucks behind it rather than a beat later.
      const line = (bar?.getBoundingClientRect().bottom ?? 64) + 8;
      let current = "";
      for (const tab of tabs) {
        const el = document.getElementById(tab.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = tab.id;
        else break;
      }
      // Past the end of the document the last section is the answer even if its
      // top never crossed the line (a short final section can't scroll that far).
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        const last = tabs.at(-1);
        if (last && document.getElementById(last.id)) current = last.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tabs]);

  // Hide the site chrome while the event bar owns the top edge; always clean
  // up on unmount so other routes get their header back.
  useEffect(() => {
    const root = document.documentElement;
    if (scrolled) root.setAttribute("data-event-nav-scrolled", "");
    else root.removeAttribute("data-event-nav-scrolled");
    return () => root.removeAttribute("data-event-nav-scrolled");
  }, [scrolled]);

  /**
   * Keep the marked tab on screen inside the horizontal rail. At 390px only
   * three or four of the nine tabs fit, so marking one the visitor can't see is
   * no better than marking none.
   *
   * ⚠ `scrollLeft` on the rail, NOT `scrollIntoView`. That would also scroll the
   * nearest scrollable ANCESTOR — the page — and fight the scroll position the
   * visitor is actually setting.
   */
  useEffect(() => {
    const rail = scrollerRef.current;
    if (!rail || !active) return;
    const el = rail.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!el) return;
    const target = el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2;
    const max = rail.scrollWidth - rail.clientWidth;
    const next = Math.max(0, Math.min(target, max));
    if (Math.abs(next - rail.scrollLeft) > 4) {
      rail.scrollTo({ left: next, behavior: "smooth" });
    }
  }, [active]);

  /**
   * Track how far the rail is scrolled, so the fade and the arrows only appear
   * on the side that actually has hidden tabs.
   *
   * ⚠ THE RAIL OVERFLOWS ON DESKTOP, NOT JUST ON A PHONE, AND IT MORE THAN
   * DOUBLES ONCE YOU SCROLL. Measured at 1440: 1,150px of tabs in a 921px rail
   * (229px hidden), and once the first slot swaps "Overview" for the event's
   * full name + mark — 391px for the National Championships — it is 1,442px in
   * the same 921px, i.e. **521px hidden**, precisely when this bar is the only
   * nav on screen because the site chrome has slid away. A phone swipes; a
   * mouse has no horizontal wheel, so before this the last tabs (Sponsors,
   * Tickets) were unreachable unless you happened to scroll far enough down the
   * page for the active-tab centering below to drag them into view.
   *
   * `scrolled` is a dependency because that name swap changes `scrollWidth`
   * without changing the rail's own box, so the ResizeObserver never fires for it.
   */
  useEffect(() => {
    const rail = scrollerRef.current;
    if (!rail) return;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      // 1px of slack: fractional layout widths mean scrollLeft rarely lands
      // exactly on 0 or on max, and a permanently-lit arrow that does nothing
      // is worse than no arrow.
      setAtStart(rail.scrollLeft <= 1);
      setAtEnd(rail.scrollLeft >= max - 1);
      setScrollable(max > 24);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [tabs, scrolled]);

  /** Arrow click: about two-thirds of a screenful, so a tab is never skipped. */
  function nudge(dir: 1 | -1) {
    const rail = scrollerRef.current;
    if (!rail) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: dir * rail.clientWidth * 0.66,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  // Fade the tabs out over the last 2.5rem of whichever edge has more behind
  // it. This is the half that fixes "I didn't know there was more" — the rail
  // hides its scrollbar, so without it a cut-off tab just looks like the end.
  const fade = `linear-gradient(to right, ${
    atStart ? "black 0" : "transparent 0, black 2.5rem"
  }, ${atEnd ? "black 100%" : "black calc(100% - 2.5rem), transparent 100%"})`;

  /**
   * Pointer-only affordance, so `aria-hidden` + untabbable ON PURPOSE: Tab
   * already reaches every link in the rail and the browser scrolls each one
   * into view as it focuses, so exposing these would add two dead stops in the
   * middle of the nav that do nothing a keyboard user needs.
   */
  const arrowClass =
    "absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-ppa-paper text-sm text-ppa-navy shadow-[0_2px_10px_rgba(7,34,58,0.22)] ring-1 ring-ppa-line transition hover:bg-white hover:text-[var(--event-accent,#228be6)] active:scale-95 lg:flex";

  const rest = tabs.filter((t) => t.id !== "overview");

  const tabClass = (id: string) =>
    `shrink-0 border-b-2 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
      active === id
        ? "border-[var(--event-accent,#228be6)] text-[var(--event-accent,#228be6)]"
        : "border-transparent text-ppa-navy/55 hover:text-[var(--event-accent,#228be6)]"
    }`;

  return (
    <nav
      ref={navRef}
      className={`sticky z-40 border-b border-ppa-line bg-ppa-paper/95 backdrop-blur transition-[top] duration-300 ease-out ${
        scrolled ? "top-0" : "top-16"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4">
        <div className="relative flex min-w-0 flex-1 items-center">
        <div
          ref={scrollerRef}
          style={{ maskImage: fade, WebkitMaskImage: fade }}
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {scrolled ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-2 py-2 pr-4 text-left motion-safe:animate-fade"
            aria-label={`${eventName} — back to top`}
          >
            {icon && (
              <Image
                src={icon}
                alt=""
                width={20}
                height={54}
                className="h-7 w-auto"
              />
            )}
            <span className="font-display text-sm uppercase leading-none text-[var(--event-primary,#0c2b44)]">
              {eventName}
            </span>
          </button>
        ) : (
          <a
            href="#overview"
            data-tab="overview"
            aria-current={active === "overview" ? "true" : undefined}
            className={tabClass("overview")}
          >
            Overview
          </a>
        )}
        {rest.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            data-tab={tab.id}
            aria-current={active === tab.id ? "true" : undefined}
            className={tabClass(tab.id)}
          >
            {tab.label}
          </a>
        ))}
        </div>

        {/* Rendered only when there is something to reach, so the arrow is
            never a control that does nothing. */}
        {scrollable && !atStart && (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(-1)}
            className={`${arrowClass} left-0`}
          >
            ←
          </button>
        )}
        {scrollable && !atEnd && (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => nudge(1)}
            className={`${arrowClass} right-0`}
          >
            →
          </button>
        )}
        </div>
        {ticketsUrl && (
          <a
            href={ticketsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 shrink-0 items-center bg-[var(--event-accent,#228be6)] px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:brightness-90 active:scale-[0.98] sm:inline-flex"
          >
            Buy Tickets{typeof ticketPriceFrom === "number" ? ` — From $${ticketPriceFrom}` : ""}
          </a>
        )}
      </div>
    </nav>
  );
}
