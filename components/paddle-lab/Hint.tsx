import { Info } from "lucide-react";

/**
 * A one-line explanation behind an info glyph. CSS-only (hover + focus), so it
 * works inside server-rendered tables and needs no portal. Keyboard users tab
 * to the button and the tip shows on focus.
 */
export function Hint({ label, text, align = "center" }: { label: string; text: string; align?: "center" | "left" }) {
  const pos = align === "left" ? "left-0" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center text-ppa-navy/40 hover:text-ppa-blue focus:text-ppa-blue focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-30 mb-2 w-56 ${pos} bg-ppa-navy p-2.5 text-left text-[11px] font-medium normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}
