"use client";

/**
 * Hotel "Book the Group Rate" link that also fires a fire-and-forget click
 * beacon to Jackalope's counter (Travel → All Hotels shows demand per hotel).
 * sendBeacon never blocks the navigation; failures are silent.
 */
export function BookGroupRateLink({
  href,
  eventSlug,
}: {
  href: string;
  eventSlug: string;
}) {
  function track() {
    try {
      const url = `https://jackalopehq.vercel.app/api/public/hotel-click?url=${encodeURIComponent(
        href,
      )}&event=${encodeURIComponent(eventSlug)}`;
      navigator.sendBeacon?.(url);
    } catch {
      /* analytics must never break the click */
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      className="group/book mt-2 inline-flex items-center gap-1.5 bg-ppa-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--event-accent)] active:scale-[0.98]"
    >
      Book the Group Rate
      <span
        aria-hidden
        className="transition-transform duration-300 group-hover/book:translate-x-0.5"
      >
        ↗
      </span>
    </a>
  );
}
