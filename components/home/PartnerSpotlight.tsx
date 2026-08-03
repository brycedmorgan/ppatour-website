"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { logoPartnersInTierOrder } from "@/lib/home-content";

/**
 * Auto-rotating partner highlight. Cycles through every tour partner with
 * their official logo, role, and a short note. Dots are clickable. Fade
 * animation respects prefers-reduced-motion (utility disabled in CSS).
 */
/**
 * A partner needs a mark AND something written about them to hold a slide.
 *
 * This module is editorial — the note is the slide. The nine partners added
 * from the 8/3 logo drop have artwork but no confirmed designation or copy, so
 * featuring them here would rotate a logo over an empty half. They appear on
 * the partner wall (where a logo-only card is the intended treatment) and join
 * the rotation on their own the moment a note is written for them.
 */
const logoPartners = logoPartnersInTierOrder.filter((p) => p.note);

export function PartnerSpotlight() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((v) => (v + 1) % logoPartners.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  const p = logoPartners[active];

  return (
    <div className="relative isolate overflow-hidden border border-ppa-line bg-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-ppa-blue" />
      <div
        key={active}
        className="grid animate-fade gap-6 p-6 motion-reduce:animate-none sm:p-8 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:items-center"
      >
        {/* Logo block */}
        <div className="flex h-24 items-center justify-start sm:h-28">
          <Image
            src={p.logo!}
            alt={p.name}
            width={p.logoWidth!}
            height={p.logoHeight!}
            sizes="320px"
            priority
            className="max-h-full w-auto max-w-[260px] object-contain object-left sm:max-w-[320px]"
          />
        </div>

        {/* Editorial block — the logo carries the name (Bryce, 7/28), so only
            the designation and the note are typed out. */}
        <div>
          {p.role && !p.hideRole && (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-blue">
              {p.role}
            </p>
          )}
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
            {p.note}
          </p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex shrink-0 gap-1.5 border-t border-ppa-line bg-ppa-paper px-6 py-3 sm:px-8">
        {logoPartners.map((d, i) => (
          <button
            key={d.name}
            type="button"
            aria-label={`Show ${d.name}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`h-1.5 transition-all duration-300 ${
              i === active
                ? "w-8 bg-ppa-blue"
                : "w-3 bg-ppa-navy/15 hover:bg-ppa-navy/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
