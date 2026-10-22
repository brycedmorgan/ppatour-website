import { EUROPE_SOCIALS } from "@/lib/europe-socials";

/**
 * The three @ppatoureurope accounts as WHITE icon buttons (Payton + Albert,
 * #ppa-tour-europe 10/2: "make the social media icons white", top right of the
 * main menu). Monochrome on purpose: no brand colours, no Instagram gradient.
 */
export function EuropeSocialLinks({ size = "md" }: { size?: "xs" | "sm" | "md" }) {
  // "xs" is the header: 28px targets on phones, 32px from sm up, so the bar fits 360px.
  const box = size === "xs" ? "size-7 sm:size-8" : size === "sm" ? "size-8" : "size-10";
  const icon = size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex items-center sm:gap-1">
      {EUROPE_SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`PPA Tour Europe on ${s.name}`}
          className={`flex ${box} items-center justify-center text-white transition-opacity hover:opacity-70`}
        >
          <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden>
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
