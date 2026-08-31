"use client";

import { useEffect, useState } from "react";

/**
 * Collapses its child once the visitor starts scrolling — used to retire the
 * next-event ticker so the header (and event tab bars) reclaim the space.
 */
export function HideOnScroll({
  children,
  keep = false,
}: {
  children: React.ReactNode;
  /**
   * Never collapse. Used while a tour stop is being played.
   *
   * ⚠ THE COLLAPSE RULE WAS WRITTEN FOR A DIFFERENT BAR. Bryce, 7/28: the
   * sub-bar goes as soon as you start scrolling — correct for "Next Event ·
   * Aug 31 · Event Details", which you read once and never need again. It is
   * exactly wrong for a live score: on the opening morning of Nationals the bar
   * carried "LIVE · SC4 · M. Hoover vs D. Nguyen · 5–6" and then clipped itself
   * to 0px after FORTY PIXELS of scroll, which is why the ticker looked like it
   * was never appearing at all. Measured: 36px at scrollY 0, 0px at 500.
   */
  keep?: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // `keep` short-circuits before any listener is attached, so nothing can set
    // hidden while it is on — no setState in the effect body, which the lint
    // rule rightly refuses.
    if (keep) return;
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [keep]);

  return (
    <div
      className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
        hidden && !keep ? "max-h-0" : "max-h-9"
      }`}
    >
      {children}
    </div>
  );
}
