"use client";

import { useEffect, useState } from "react";
import { partners } from "@/lib/home-content";

/**
 * Auto-rotating partner highlight. Cycles through every tour partner,
 * pausing nothing — the static logo grid on ppatour.com becomes a live
 * spotlight. Dots are clickable; respects prefers-reduced-motion via the
 * .animate-fade class (disabled in globals.css).
 */
export function PartnerSpotlight() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((v) => (v + 1) % partners.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  const p = partners[active];

  return (
    <div className="relative isolate overflow-hidden border border-white/10 bg-ppa-navy">
      <div className="absolute inset-x-0 top-0 h-1 bg-ppa-blue" />
      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div key={active} className="animate-fade motion-reduce:animate-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-yellow">
            {p.role}
          </p>
          <p className="mt-2 font-display text-4xl uppercase leading-[0.95] text-white sm:text-6xl">
            {p.name}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            {p.note}
          </p>
        </div>

        <div className="flex shrink-0 gap-1.5">
          {partners.map((d, i) => (
            <button
              key={d.name}
              type="button"
              aria-label={`Show ${d.name}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`h-1.5 transition-all duration-300 ${
                i === active
                  ? "w-8 bg-ppa-blue"
                  : "w-3 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
