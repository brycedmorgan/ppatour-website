/**
 * `{year}/{slug}` of this year's stop -> `tournament_uuid` of the prior-year
 * event that is the same annual stop. Shared by gen-defending-champions.mjs
 * (golds) and gen-watch-angles.mjs (runners-up).
 *
 * Keyed on year+slug because that is the pair the event page routes on (a
 * curated record wins there, and curated records carry no `tournament_uuid`).
 *
 * Confirmed by Bryce/Wesley 2026-07-29 against the `ppa_tournaments` feed.
 * Working rule: **same tier (open/cup/slam) + same venue or city = the same
 * annual stop.** Titles drift as sponsors change — never match on title.
 *
 * Deliberately absent, so they keep the "no titles to defend" copy: Veolia
 * Pickleball National Championships · Greater Zion Cup · Veolia Arizona Open ·
 * Newport Beach Open · Veolia Chicago Cup · Veolia Malibu Cup.
 */
export const PRIOR_YEAR = {
  // <- 2025 Masters (Mission Hills, Rancho Mirage)
  "2026/carvana-ppa-masters-powered-by-invited": "2a35d3a1-bb1a-474b-9986-897a09de73b1",
  // <- 2024 Lakeville MN (Lifetime Lakeville). Tier reads slam-vs-open, but
  // Wesley confirmed it's the same stop returning.
  "2026/indoor-national-championships": "cfc270b2-59e0-4b68-ae6f-9504e63c89e7",
  // <- 2025 Veolia Cape Coral Open (venue moved within Cape Coral)
  "2026/zimmer-biomet-cape-coral-open": "923b6d24-15ac-4ed0-860b-f83b52863e3e",
  // <- 2025 Carvana Mesa Cup (Arizona Athletic Grounds)
  "2026/carvana-mesa-cup": "c19054b4-056e-474a-993c-46091b3f397e",
  // <- 2025 CIBC Texas Open (McKinney)
  "2026/veolia-texas-open": "3e4dfb79-372b-4e49-805e-aff3ebdb469f",
  // <- 2025 Pickleball Central Sacramento Vintage Open (Life Time Arden)
  "2026/sacramento-open": "64bbc71e-f0e2-425a-97f5-4a45ac47ee3e",
  // <- 2025 Veolia Atlanta Pickleball Championships
  "2026/veolia-atlanta-pickleball-championships": "9c61faee-196b-4c55-9ba0-e99b641f93bf",
  // <- 2024 CIBC The Finals (no 2025 Finals was held). "Only for now" per
  // Wesley — revisit if a 2025 predecessor is designated.
  "2026/ppa-finals": "2e5f903e-93e3-4463-a85c-c08ef65b62dd",
  // <- 2024 Guaranteed Rate Las Vegas Open (Darling Tennis Center). The Vegas
  // *Cup* lineage (2024 LV Pickleball Cup -> 2025 Rate Vegas Cup) is a SEPARATE
  // event — do not link it here.
  "2026/rate-las-vegas-open": "068f6d56-97d9-42c9-87f5-54c2e7d3040f",
  // <- 2025 Fasenra Virginia Beach Cup. Same venue and October slot, re-tiered
  // Cup -> Open; Wesley confirmed it's one lineage.
  "2026/virginia-beach-open": "2b3050b3-8f87-45b5-bf44-0f056c1bd305",
  // <- 2025 Pickleball World Championships (Brookhaven CC, Farmers Branch)
  "2026/pickleball-world-championships": "f02fa839-68e0-46d5-8b93-dc266f201a4e",
  // <- 2025 Daytona Beach Open (Pictona at Holly Hill)
  "2026/florida-open": "1259f4ea-2fc6-40d2-b172-c89bd3e5caae",
};
