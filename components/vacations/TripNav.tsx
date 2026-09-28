"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tripsByDate, tripStatus, tripStatusLabel } from "@/lib/vacations/trips";

/**
 * Sticky trip sub-nav under the site header on every Vacations page.
 *
 * Bryce (9/22): the top of /vacations "just shows the Turks and Caicos thing"
 * and you had to scroll to the calendar at the bottom to learn Punta Cana or
 * Cancún exist. This puts every trip — name, dates, status — one line under
 * the header, with the page you're on highlighted. Reads lib/vacations/trips.ts
 * like the header and calendar do, so a new trip card shows up here for free.
 *
 * `top-16`: the site chrome (`TopBar.tsx`, sticky z-50) collapses to the 64px
 * Header once the page scrolls, so this bar parks directly under it. z-40
 * keeps it beneath the chrome and the mega panels.
 *
 * Hidden on /register and /success: those are the checkout funnel, and a menu
 * of other trips there is a distraction from finishing the one in hand.
 */
export function TripNav() {
  const pathname = usePathname() ?? "";
  if (pathname.includes("/vacations/register") || pathname.includes("/vacations/success")) {
    return null;
  }
  const trips = tripsByDate();
  const norm = (p: string) => p.replace(/\/+$/, "");
  const current = norm(pathname);

  return (
    <nav
      aria-label="Pickleball Vacations trips"
      className="sticky top-16 z-40 border-b border-white/10 bg-ppa-navy-deep text-white"
    >
      <div className="mx-auto flex w-full max-w-6xl items-stretch gap-2 px-4">
        <span className="hidden shrink-0 items-center pr-4 text-[10px] font-bold uppercase tracking-[0.2em] text-vac-teal-pale sm:flex">
          Pickleball Vacations
        </span>
        <ul className="-mx-1 flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trips.map((t) => {
            const active = norm(t.href) === current;
            const status = tripStatus(t);
            const past = status === "completed";
            return (
              <li key={t.slug} className="shrink-0">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col justify-center border-b-2 px-3 py-2.5 transition-colors sm:px-4 ${
                    active
                      ? "border-vac-teal text-white"
                      : "border-transparent text-white/60 hover:text-white"
                  } ${past && !active ? "opacity-70" : ""}`}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.12em]">
                    {t.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-white/55">
                    {t.datesLabel}
                    <span
                      className={`px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] ${
                        status === "open"
                          ? "bg-vac-teal text-ppa-navy"
                          : "bg-white/15 text-white/80"
                      }`}
                    >
                      {tripStatusLabel(t)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
