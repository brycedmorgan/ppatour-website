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
        <div
          ref={scrollerRef}
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
