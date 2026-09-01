/**
 * Name normalization for the scores board — CLIENT-SAFE.
 *
 * ⚠ Split out from lib/score-headshots.ts on purpose, and the reason is the
 * same one that put lib/ticket-grid-view.ts beside lib/ticket-grid.ts: that
 * module imports `getFullRankings`, which reads `PB_API_TOKEN` and pulls the
 * whole ranking-board adapter with it. `ScoresBoard` is a client component and
 * needs exactly this one function, so importing it from there would ship the
 * server module into the browser bundle.
 *
 * Rule: client components import from here; the server map builder imports this
 * too, so both sides normalize identically and a lookup can never miss because
 * two copies of the regex drifted.
 */
export function normalizeScoreName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
