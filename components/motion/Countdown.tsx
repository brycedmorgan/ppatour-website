"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to first serve. Server-renders the static fallback
 * ("48 Days Out") to avoid hydration drift, then ticks D : H : M : S on
 * the client every second.
 */
export function Countdown({
  targetIso,
  fallback,
}: {
  targetIso: string;
  fallback: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1_000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);

  if (now === null) return <>{fallback}</>;

  const target = new Date(`${targetIso}T00:00:00`).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);

  return (
    <span className="tabular-nums">
      {days}D : {hours}H : {mins}M : {secs}S
    </span>
  );
}
