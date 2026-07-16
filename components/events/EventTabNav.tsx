"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Tab = { id: string; label: string };

/**
 * Event page floating nav. At the top of the page the first slot is the
 * Overview tab; once the visitor scrolls past the hero it becomes the event's
 * own name (and mark, when the event has one) — the bar reads as THIS
 * event's menu, in the event's brand color.
 */
export function EventTabNav({
  tabs,
  eventName,
  icon,
}: {
  tabs: Tab[];
  eventName: string;
  icon?: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rest = tabs.filter((t) => t.id !== "overview");

  return (
    <nav className="sticky top-16 z-40 border-b border-ppa-line bg-ppa-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
    </nav>
  );
}
