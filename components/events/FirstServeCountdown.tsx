"use client";

import { useEffect, useState } from "react";

/**
 * Broadcast-style hero clock — "First Serve In" with days/hours/minutes/
 * seconds ticking live in the corner of the event hero. Renders nothing
 * until mounted (no hydration drift) and nothing once the event starts.
 */
export function FirstServeCountdown({ targetIso }: { targetIso: string }) {
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

  if (now === null) return null;

  const target = new Date(`${targetIso}T00:00:00`).getTime();
  const diff = target - now;
  if (diff <= 0) return null;

  const units = [
    { v: Math.floor(diff / 86_400_000), label: "Days" },
    { v: Math.floor((diff % 86_400_000) / 3_600_000), label: "Hrs" },
    { v: Math.floor((diff % 3_600_000) / 60_000), label: "Min" },
    { v: Math.floor((diff % 60_000) / 1_000), label: "Sec" },
  ];

  return (
    <div className="absolute bottom-8 right-4 hidden text-right motion-safe:animate-fade lg:block xl:right-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
        First Serve In
      </p>
      <div className="mt-1.5 flex items-start justify-end gap-2.5">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-start gap-2.5">
            <div>
              <p className="min-w-[2ch] font-display text-4xl leading-none text-white tabular-nums">
                {String(u.v).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                {u.label}
              </p>
            </div>
            {i < units.length - 1 && (
              <span
                aria-hidden
                className="font-display text-3xl leading-none text-[var(--event-accent,#228be6)]"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
