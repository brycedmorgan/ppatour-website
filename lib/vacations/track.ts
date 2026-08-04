import { trip } from "./content";

/**
 * Funnel beacons into Jackalope (`/api/public/vac-event`), where the paid half
 * of the funnel already lives in `stripe_charges`. Sending visits to the same
 * database is what turns "10 rooms sold" into "10 rooms from N visitors", which
 * is the number that says whether the trip needs more traffic or better copy.
 * It powers the Vacations module Lainey reads, so it survived the move onto
 * ppatour.com even though this site has its own GA4 — the two answer different
 * questions and only this one joins to Stripe.
 *
 * Fire-and-forget by design: every failure path is swallowed. Analytics must
 * never block a booking or surface an error to a guest.
 */
const ENDPOINT =
  process.env.NEXT_PUBLIC_JACKALOPE_EVENTS_URL ??
  // Canonical Jackalope host. ziffpickle.com 308s here, and sendBeacon does
  // not follow redirects — point at the final URL or the beacon is dropped.
  "https://pickleball.usejackalope.com/api/public/vac-event";

export type VacEvent = "view" | "checkout_start" | "checkout_blocked";

/** Random per-tab id so one visitor reading three pages isn't three people. */
function sessionId(): string {
  try {
    const KEY = "pbv_sid";
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

export function track(event: VacEvent, extra: { occupancy?: string } = {}) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    event,
    trip: trip.destination,
    path: window.location.pathname,
    referrer: document.referrer || null,
    sid: sessionId(),
    ...extra,
  });

  try {
    // sendBeacon survives the page unloading — which is exactly what happens
    // on checkout_start, since the very next thing we do is redirect to Stripe.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([payload], { type: "application/json" })
      );
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics never breaks the page */
  }
}
