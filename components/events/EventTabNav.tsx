"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the site chrome while the event bar owns the top edge; always clean
  // up on unmount so other routes get their header back.
  useEffect(() => {
    const root = document.documentElement;
    if (scrolled) root.setAttribute("data-event-nav-scrolled", "");
    else root.removeAttribute("data-event-nav-scrolled");
    return () => root.removeAttribute("data-event-nav-scrolled");
  }, [scrolled]);

  const rest = tabs.filter((t) => t.id !== "overview");

  return (
    <nav
      className={`sticky z-40 border-b border-ppa-line bg-ppa-paper/95 backdrop-blur transition-[top] duration-300 ease-out ${
        scrolled ? "top-0" : "top-16"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            className="shrink-0 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/55 transition-colors hover:text-[var(--event-accent,#228be6)]"
          >
            Overview
          </a>
        )}
        {rest.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className="shrink-0 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/55 transition-colors hover:text-[var(--event-accent,#228be6)]"
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
