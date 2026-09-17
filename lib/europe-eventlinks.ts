/**
 * Per-stop links for the PPA Tour Europe credential QR code.
 *
 * WHY THIS FILE EXISTS: the Europe team prints a QR code on every credential
 * (Payton Pemberton, #ppa-tour-europe, 2026-09-17). A printed code is fixed
 * forever, so it points at ONE page we control — /europe/eventlinks — and the
 * links behind that page change per stop. This file is the "behind".
 *
 * The page lists every Europe stop from the live feed on its own; nothing here
 * is needed for a stop to appear. This file only ADDS links to a stop, keyed by
 * the feed's `slug`. A stop with no entry shows its event page and map only.
 *
 * ⚠ Only links someone on the Europe team actually gave us go in here. Never
 * guess a brackets URL or a rulebook URL; an empty section beats a wrong link
 * on a credential. Ask in #ppa-tour-europe.
 */
export type EventLink = {
  label: string;
  href: string;
  /** One line under the label, optional. */
  note?: string;
};

/** Keyed by the feed slug (the same slug in the /events/<slug> URL). */
export const EUROPE_EVENT_LINKS: Record<string, EventLink[]> = {
  // "ppa-barcelona-open-2026": [
  //   { label: "Brackets", href: "https://…", note: "Live draws and results" },
  //   { label: "Rulebook", href: "https://…" },
  // ],
};

/**
 * Links that hold for every stop. Same rule: nothing here is guessed. These are
 * sections of /europe, which exist today.
 */
export const EUROPE_GENERAL_LINKS: EventLink[] = [
  { label: "PPA Tour Europe", href: "/europe", note: "Home" },
  { label: "Schedule", href: "/europe#schedule", note: "Every Europe stop" },
  { label: "The Pros", href: "/europe#pros", note: "Signed PPA Tour Europe players" },
  { label: "Entry & rules", href: "/europe#rules", note: "How Europe events differ from the US tour" },
  { label: "Contact the Europe team", href: "/europe#contact" },
];
