"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/vacations/track";

/**
 * Records one `view` per Vacations page in Jackalope, where it joins the paid
 * half of the funnel in `stripe_charges`. Mounted in the /vacations layout —
 * NOT the root layout — so the tour's own traffic never lands in Lainey's trip
 * numbers. Also fires on client-side navigations (/vacations → /register),
 * which is where the interesting drop-off is.
 */
export function VacationsTrack({ destinations = {} }: { destinations?: Record<string, string> }) {
  const pathname = usePathname();
  // Coming Soon trips from Jackalope have no TripConfig, so the layout passes
  // their funnel names; without this their views would count as Turks.
  const trip = destinations[(pathname ?? "").replace(/\/+$/, "")];

  useEffect(() => {
    track("view", trip ? { trip } : {});
  }, [pathname, trip]);

  return null;
}
