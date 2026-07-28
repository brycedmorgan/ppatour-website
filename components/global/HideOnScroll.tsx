"use client";

import { useEffect, useState } from "react";

/**
 * Collapses its child once the visitor starts scrolling — used to retire the
 * next-event ticker so the header (and event tab bars) reclaim the space.
 */
export function HideOnScroll({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Bryce 7/28: the sub-bar goes as soon as you start scrolling — past the
    // hero fold only the main floating header should remain.
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
        hidden ? "max-h-0" : "max-h-9"
      }`}
    >
      {children}
    </div>
  );
}
