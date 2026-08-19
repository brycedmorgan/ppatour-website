"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MapPin, Radio, Star, Trophy } from "lucide-react";
import { eventHref, getNextTournament } from "@/lib/placeholder-data";

/**
 * The app's primary navigation, pinned to the bottom edge and shown only inside
 * an installed window (see `AppChrome`).
 *
 * Bryce's three asks plus a home and a you: scores, then standings and
 * schedule, then the event you are standing at, then the pros you follow. The
 * Event tab points at the next tour stop until the on-site experience exists —
 * a tab that leads somewhere real beats a tab that leads to "coming soon".
 */
const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/live/", label: "Live", icon: Radio, match: (p: string) => p.startsWith("/live") },
  {
    href: "/rankings/",
    label: "Rankings",
    icon: Trophy,
    match: (p: string) => p.startsWith("/rankings") || p.startsWith("/leaderboards"),
  },
  {
    href: "/events/",
    label: "Schedule",
    icon: CalendarDays,
    match: (p: string) => p === "/events/" || p === "/events",
  },
] as const;

export function AppTabBar() {
  const pathname = usePathname() || "/";
  const next = getNextTournament();
  const eventTab = {
    // Straight to the on-site screen — courts, today's play, gates, parking.
    // The app's Event tab is for someone who is at the tournament, or about to
    // be; the marketing page is one tap back from there.
    href: `${eventHref(next)}/today`,
    label: "Event",
    icon: MapPin,
    match: (p: string) => p.startsWith("/events/") && p !== "/events/",
  };
  const youTab = {
    href: "/following/",
    label: "You",
    icon: Star,
    match: (p: string) => p.startsWith("/following"),
  };
  const tabs = [...TABS, eventTab, youTab];

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ppa-navy-deep/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.label} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[3.25rem] flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-ppa-yellow" : "text-white/55 active:text-white"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
