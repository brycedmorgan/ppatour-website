"use client";

/**
 * Pro ↔ Challenger Showdown — which field the scores and bracket below show.
 *
 * Only rendered where the tournament hosts the PPA Challenger Showdown (Worlds;
 * the caller decides from `showdownDaysFor`). Both fields come from the same
 * /api/scores and /api/brackets responses, so switching costs no request.
 */
export type DrawField = "pro" | "showdown";

export function DrawToggle({
  value,
  onChange,
  light = false,
}: {
  value: DrawField;
  onChange: (v: DrawField) => void;
  light?: boolean;
}) {
  const options: { v: DrawField; label: string }[] = [
    { v: "pro", label: "Pro" },
    { v: "showdown", label: "Challenger Showdown" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Which draw"
      className={`inline-flex rounded-md border p-0.5 ${light ? "border-ppa-line" : "border-white/15"}`}
    >
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
            value === o.v
              ? light
                ? "bg-ppa-navy text-white"
                : "bg-white text-ppa-navy"
              : light
                ? "text-ppa-navy/55 hover:text-ppa-navy"
                : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
