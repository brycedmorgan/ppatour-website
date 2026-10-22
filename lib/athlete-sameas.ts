/**
 * Knowledge-graph identities for the pros who have one — Wikipedia article +
 * Wikidata item — merged into each athlete page's Person `sameAs` alongside
 * the socials from Pro Player Central.
 *
 * WHY: Google reconciles a Person across the web on `sameAs`. Our athlete pages
 * sit behind pickleball.com and Wikipedia for our own players' names (docs/SEO.md
 * §2); telling Google "this page is about the entity you already know as
 * Q106812168" is the cheapest, strongest signal we can send.
 *
 * ⚠ VERIFIED ENTRIES ONLY (checked against the Wikidata API 2026-10-18). Most
 * pros do NOT have their own article — "Tyson McGuffin", "Federico Staksrud",
 * "Anna Bright", "JW Johnson", "Collin Johns", "Christian Alshon" … all
 * redirect to "List of professional pickleball players" (Q128799819), and a
 * list page is not the person, so they are deliberately absent. "Hunter Johnson"
 * and "Matt Wright" resolve to disambiguation pages — also absent. Add a row
 * only after confirming the item's description names a pickleball (or former
 * tennis) player, never from a name match alone.
 */
export const ATHLETE_SAME_AS: Record<string, readonly string[]> = {
  "ben-johns": [
    "https://en.wikipedia.org/wiki/Ben_Johns",
    "https://www.wikidata.org/wiki/Q106812168",
  ],
  "anna-leigh-waters": [
    "https://en.wikipedia.org/wiki/Anna_Leigh_Waters",
    "https://www.wikidata.org/wiki/Q114772513",
  ],
  "catherine-parenteau": [
    "https://en.wikipedia.org/wiki/Catherine_Parenteau",
    "https://www.wikidata.org/wiki/Q121450283",
  ],
  "jack-sock": ["https://en.wikipedia.org/wiki/Jack_Sock", "https://www.wikidata.org/wiki/Q54663"],
  "jay-devilliers": [
    "https://en.wikipedia.org/wiki/Jay_Devilliers",
    "https://www.wikidata.org/wiki/Q121363834",
  ],
  // Former ATP player; the article is about him (Romanian tennis player, now pickleball).
  "andrei-daescu": [
    "https://en.wikipedia.org/wiki/Andrei_D%C4%83escu",
    "https://www.wikidata.org/wiki/Q4755779",
  ],
  "genie-bouchard": [
    "https://en.wikipedia.org/wiki/Eugenie_Bouchard",
    "https://www.wikidata.org/wiki/Q439032",
  ],
  "zane-navratil": [
    "https://en.wikipedia.org/wiki/Zane_Navratil",
    "https://www.wikidata.org/wiki/Q107127594",
  ],
  "simone-jardim": [
    "https://en.wikipedia.org/wiki/Simone_Jardim",
    "https://www.wikidata.org/wiki/Q108659142",
  ],
  // Former WTA player; same person.
  "salome-devidze": [
    "https://en.wikipedia.org/wiki/Salome_Devidze",
    "https://www.wikidata.org/wiki/Q16206875",
  ],
};

export function athleteSameAs(slug: string): string[] {
  return [...(ATHLETE_SAME_AS[slug] ?? [])];
}
