import { useId } from "react";
import { EUROPE_SOCIALS } from "@/lib/europe-socials";

/** The three @ppatoureurope accounts as icon buttons. Same treatment as the global footer's. */
export function EuropeSocialLinks({ tone = "dark" }: { tone?: "dark" | "light" }) {
  // Renders twice on /europe (hero + footer), so the gradient id must be per instance.
  const igId = `eu-ig-${useId().replace(/:/g, "")}`;
  const box =
    tone === "dark"
      ? "border-white/15 hover:border-white/40 hover:bg-white/10"
      : "border-ppa-line bg-white hover:border-ppa-navy/40";
  return (
    <div className="flex gap-2">
      {/* Instagram's mark is a gradient, not a flat color. */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <linearGradient id={igId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD521" />
          <stop offset="35%" stopColor="#F50000" />
          <stop offset="70%" stopColor="#B900B4" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </svg>
      {EUROPE_SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`PPA Tour Europe on ${s.name}`}
          className={`flex size-10 items-center justify-center border transition-colors ${box}`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill={s.color === "url(#eu-ig-gradient)" ? `url(#${igId})` : s.color} aria-hidden>
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
