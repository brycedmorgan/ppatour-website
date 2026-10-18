/**
 * Confirmed points level (125 or 250) for each U.S. PPA Challenger, by year.
 *
 * ⚠ SOURCE: the "2027 Challenger Master" sheet (Challenger ops — Brooke Ansley /
 * Tanner Groff), column "POINT LEVEL", sent by Bryce 10/18:
 * docs.google.com/spreadsheets/d/1ysaRaFiizHknfIZQoTxFVjd1z8HqbudoHhCK9Sak_J8
 * Copy the sheet; never infer a level from courts, city or last year.
 *
 * ⚠ KEYED BY YEAR ON PURPOSE. Curated matching in lib/events-api.ts is by a
 * year-free slug, so a 2027 stop silently inherits the 2026 record of the same
 * name — 2027 Seattle would have read 2026 Seattle's 250 (the sheet says 125).
 * This table wins over that and over the feed.
 *
 * Key: `${year}/${kebab(event name)}`. Stops still missing from the PT feed
 * (Houston, Black Desert, Wilson, Macon, Seattle, Newport Beach, Punta Gorda,
 * Charlotte; Oklahoma City is unnamed) are listed so they light up when posted.
 */
const LEVELS: Record<string, 125 | 250> = {
  "2027/jacksonville-ppa-challenger": 125,
  "2027/gilbert-ppa-challenger": 125,
  "2027/peachtree-corners-ppa-challenger": 250,
  "2027/houston-ppa-challenger": 125,
  "2027/auburn-opelika-ppa-challenger": 250,
  "2027/black-desert-ppa-challenger": 125,
  "2027/wilson-ppa-challenger": 125,
  "2027/fort-collins-ppa-challenger": 125,
  "2027/chicago-ppa-challenger": 125,
  "2027/sacramento-ppa-challenger": 125,
  "2027/minneapolis-ppa-challenger": 125,
  "2027/macon-ppa-challenger": 250,
  "2027/seattle-ppa-challenger": 125,
  "2027/newport-beach-ppa-challenger": 250,
  "2027/richmond-ppa-challenger": 125,
  "2027/punta-gorda-ppa-challenger": 250,
  "2027/charlotte-ppa-challenger": 125,
  "2027/harbour-island-ppa-challenger": 125,
};

export function challengerLevel(year: string, nameSlug: string): number | undefined {
  return LEVELS[`${year}/${nameSlug}`];
}
