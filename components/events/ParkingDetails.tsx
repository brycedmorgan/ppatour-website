import Image from "next/image";

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
 *
 * A section may also carry the event team's own parking map (`image`), rendered
 * under that section's paragraphs — Cary's copy says "refer to the attached
 * map", so the map has to sit with the words that point at it.
 */
export function ParkingDetails({
  sections,
  ticketsUrl,
  tone = "light",
  className,
}: {
  sections: ParkingSection[];
  /**
   * The event's Tixr page (UTM-tagged by the caller), used to linkify a
   * section's `ticketLinkText` — that is where a premium parking pass is bought.
   * **Null when tickets aren't on sale**, and then the words stay plain text:
   * linking would hand out a Tixr URL for a stop we're deliberately not selling
   * (see TICKETS_HIDDEN). Absent/null is always the safe value.
   */
  ticketsUrl?: string | null;
  /**
   * Which ground this is rendering on. The section headings ("General Parking",
   * "Premium Parking", …) are the one thing here with its own colour rather than
   * the inherited body colour, so they need telling.
   *
   * ⚠ `"dark"` EXISTS BECAUSE THE HEADINGS WERE INVISIBLE ON THE ON-SITE SCREEN.
   * `/events/<year>/<slug>/today` is white-on-navy; the light heading tint is
   * navy-on-navy there, so all four of Cary's headings read as blank gaps on the
   * page someone opens standing in the parking lot. Default stays light — the
   * event page and NationalsLive are unchanged.
   */
  tone?: "light" | "dark";
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
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                tone === "dark" ? "text-white/45" : "text-ppa-navy/50"
              }`}
            >
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
              {renderBody(p, ticketsUrl ? s.ticketLinkText : undefined, ticketsUrl)}
            </p>
          ))}
          {/* The event team's parking map.
              ⚠ `sizes` is measured, not guessed: this renders in the
              Know-Before-You-Go accordion (543px at 1440) and the narrower
              Plan-Your-Trip card (510px), both inside a max-w-6xl page — a
              100vw hint would have the browser pick a candidate 4× wider than
              any surface draws.
              ⚠ NO BORDER, matching the venue grounds map on the same page: this
              component also renders on the dark on-site "Today" screen, and a
              frame tinted for one of those two reads as a mistake on the other. */}
          {s.image && (
            <Image
              src={s.image.src}
              alt={s.image.alt}
              width={s.image.width}
              height={s.image.height}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="mt-3 h-auto w-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Wraps the FIRST occurrence of `linkText` in a link and leaves the rest of the
 * paragraph alone. First-occurrence-only for the same reason article body
 * linkification is (8/5 pt. 12): the word recurs across the block and a link on
 * every mention reads as a wall of blue. A `linkText` the paragraph doesn't
 * contain is simply not linked — never an error, never injected copy.
 */
function renderBody(
  text: string,
  linkText: string | undefined,
  href: string | null | undefined,
) {
  if (!linkText || !href) return text;
  const at = text.indexOf(linkText);
  if (at === -1) return text;

  return (
    <>
      {text.slice(0, at)}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-ppa-blue underline decoration-ppa-blue/30 underline-offset-2 hover:text-ppa-blue-deep hover:decoration-ppa-blue"
      >
        {linkText}
      </a>
      {text.slice(at + linkText.length)}
    </>
  );
}
