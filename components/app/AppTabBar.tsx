"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, PlayCircle, Radio, Star, Trophy } from "lucide-react";

/**
 * The app's primary navigation, pinned to the bottom edge and shown only inside
 * an installed window (see `AppChrome`).
 *
 * ⚠ SCORES FIRST, AND THERE IS NO "HOME" TAB (Bryce, 10/8). The old Home tab
 * was the marketing homepage and the old Live tab was /live — the homepage
 * rehearsal harness, which renders the same homepage — so two of five tabs
 * showed one page and the app read as a website wrapper. ESPN's order instead:
 * scores (with brackets) up front, rankings next, schedule and events one tab
 * deeper, then watch and the pros you follow. The event-day screen
 * (`/today`) is reached from the Scores header and the event pages.
 */
const TABS = [
  {
    href: "/scores/",
    label: "Scores",
    icon: Radio,
    match: (p: string) => p === "/" || p.startsWith("/scores") || p.startsWith("/live"),
  },
  {
    // The app's own board (components/app/AppRankings), not the /rankings
    // marketing page; its "Full rankings" link still reaches that page.
    href: "/rankings/app/",
    label: "Rankings",
    icon: Trophy,
    match: (p: string) => p.startsWith("/rankings") || p.startsWith("/leaderboards"),
  },
  {
    href: "/events/",
    label: "Events",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/events"),
  },
  { href: "/watch/", label: "Watch", icon: PlayCircle, match: (p: string) => p.startsWith("/watch") },
  { href: "/following/", label: "You", icon: Star, match: (p: string) => p.startsWith("/following") },
] as const;

export function AppTabBar() {
  const pathname = usePathname() || "/";
  const tabs = TABS;

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
