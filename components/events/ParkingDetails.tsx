import type { ParkingSection } from "@/lib/event-guides";

/**
 * Renders `parkingFor(slug)` — the event team's finalized parking blocks, or the
 * approved holding line.
 *
 * ⚠ SHARED BY THE EVENT PAGE AND `NationalsLive` ON PURPOSE. Those two render
 * the same six Know-Before-You-Go rows and the same Plan-Your-Trip cards from
 * separate files and have drifted apart repeatedly; parking is operational copy
 * where a drift means one of the two pages sends people to the wrong lot. Both
 * spots on both pages go through here.
 *
 * `whitespace-pre-line` is load-bearing: the off-site address is a single body
 * entry with newlines, so that the submitted text stays verbatim rather than
 * being re-punctuated into a sentence for the layout.
 */
export function ParkingDetails({
  sections,
  className,
}: {
  sections: ParkingSection[];
  className?: string;
}) {
  // The holding line (and any single unlabelled block) is one paragraph — no
  // headings, no section spacing, so it reads exactly as it did before.
  const bare = sections.length === 1 && !sections[0].heading;

  return (
    <div className={className}>
      {sections.map((s, i) => (
        <div key={s.heading ?? i} className={i > 0 ? "mt-4" : undefined}>
          {s.heading && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
              {s.heading}
            </p>
          )}
          {s.body.map((p, j) => (
            <p
              key={j}
              className={`whitespace-pre-line ${
                bare && j === 0 ? "" : s.heading && j === 0 ? "mt-1.5" : "mt-2"
              }`}
            >
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
