import { EUROPE_SOCIALS } from "@/lib/europe-socials";

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
  { label: "Gallery", href: "/europe#gallery", note: "Photos from every stop" },
  { label: "Contact the Europe team", href: "/europe#contact" },
];

/** The tour's own socials, for the "Follow" block on /eventlinks. */
export const EUROPE_SOCIAL_LINKS: EventLink[] = EUROPE_SOCIALS.map((s) => ({
  label: s.name,
  href: s.href,
  note: s.name === "YouTube" ? `${s.handle} · live streams of the feature courts` : s.handle,
}));

/**
 * Feed stops the Europe team says are NOT confirmed and must not be shown
 * anywhere on the Europe site. Payton, #ppa-tour-europe 10/1: "We shouldn't
 * have anything online for Brescia right now because this event is not
 * confirmed." Remove a slug the day they confirm it.
 */
const EUROPE_UNCONFIRMED = /brescia/i;

/** Matched on name + city, not slug: the feed's titles drift (see Barcelona's alias in events-api). */
export function isUnconfirmedEuropeStop(t: { name: string; city: string; slug: string }): boolean {
  return EUROPE_UNCONFIRMED.test(`${t.name} ${t.city} ${t.slug}`);
}

/**
 * The Europe team's own forms (Typeform, owned by them so they can edit without
 * a deploy). Catie, #ppa-tour-europe 10/1. ⚠ Typeform is a stopgap: Bryce, 10/1,
 * "we should get away from Typeform eventually" — the plan is to move these
 * onto the site's own forms (InquiryForm → europe@ppatour.com). The pro-player
 * survey link was not sent; add it when it is.
 */
export const EUROPE_FORM_LINKS: EventLink[] = [
  { label: "Media credentials", href: "https://ppatour.typeform.com/europe", note: "Apply for press access at a PPA Tour Europe stop" },
  { label: "Referee interest", href: "https://ppatour.typeform.com/referee", note: "Officiate at PPA Tour Europe events" },
];
