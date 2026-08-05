/**
 * Post-import corrections to migrated WordPress article bodies.
 *
 * ⚠ THIS FILE EXISTS BECAUSE `import-wp-posts.mjs` IS RE-RUNNABLE AND REWRITES
 * `lib/data/news-posts.json` WHOLESALE. A hand edit to that JSON silently
 * reverts the next time anyone imports — the same reason the BYLINES map lives
 * in the importer rather than in the data (see its header), and the same class
 * of trap as `sync-tixr-prices.mjs` putting hidden tickets back on sale (7/31).
 * Every body edit belongs here, keyed by slug, and gets applied both to the
 * JSON we ship today and to any future import.
 *
 * Rules for what may go in here:
 *   · DELETIONS AND REWORDINGS ONLY. Nothing may state a fact the release
 *     didn't — an edit that adds a date, a venue or a name is a rewrite of the
 *     record, not a correction to it.
 *   · Every entry names the person who asked and when. These are published
 *     press releases behind the content-approval gate; the bar for touching one
 *     is an instruction, never an audit.
 *   · Matches are literal, and a `find` that stops matching THROWS (see
 *     `applyBodyEdits`). A body edit that quietly does nothing is the failure
 *     mode this repo keeps paying for.
 */

export const BODY_EDITS = {
  /**
   * Wesley, 2026-08-05, on the back of the PPA Europe announcement: "we should
   * probably remove the dates (aside from Barcelona) as event dates and
   * locations are subject to change."
   *
   * The release published a date for all seven PPA Spain stops while giving a
   * location for only two. The five whose Location it already gave as TBA now
   * read TBA in the Date column too, so the table no longer commits the tour to
   * a week it may move. Levels stay — "two PPA125s, three PPA250s, two PPA500s"
   * is in the prose above the table and is not in question.
   *
   * ⚠ BOTH BARCELONA ROWS KEEP THEIR DATES, which is the literal reading of
   * "aside from Barcelona" — the release names Barcelona for the Sept 23-27,
   * 2026 opener AND the May 5-9, 2027 PPA500. Only the opener exists in the
   * `ppa_tournaments` feed (Registration Open, venue Sant Joan Despí); the May
   * stop is on the strength of this release alone. If it should hold off too,
   * that is one more entry in this array.
   */
  "ppa-tour-announces-ppa-spain-international-expansion": [
    // The lead-in promised dates the table no longer gives for six of seven.
    {
      find: "<p>Dates for the seven-tournament slate are as follows:</p>",
      replace: "<p>The seven-tournament slate is as follows:</p>",
    },
    // Whole rows are matched, not bare date cells: the cells carry a varying
    // run of trailing &nbsp; from Gutenberg, and the row makes the level and
    // location being preserved visible in the diff.
    {
      find: "<tr><td>November 11-15, 2026&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>PPA125</td><td>TBA</td></tr>",
      replace: "<tr><td>TBA</td><td>PPA125</td><td>TBA</td></tr>",
    },
    {
      find: "<tr><td>January 27-31, 2027&nbsp;</td><td>PPA125</td><td>TBA</td></tr>",
      replace: "<tr><td>TBA</td><td>PPA125</td><td>TBA</td></tr>",
    },
    {
      find: "<tr><td>February 24-28, 2027&nbsp;&nbsp;</td><td>PPA250</td><td>TBA</td></tr>",
      replace: "<tr><td>TBA</td><td>PPA250</td><td>TBA</td></tr>",
    },
    {
      find: "<tr><td>March 17-21, 2027</td><td>PPA500</td><td>TBA</td></tr>",
      replace: "<tr><td>TBA</td><td>PPA500</td><td>TBA</td></tr>",
    },
    {
      find: "<tr><td>April 21-25, 2027</td><td>PPA250</td><td>TBA</td></tr>",
      replace: "<tr><td>TBA</td><td>PPA250</td><td>TBA</td></tr>",
    },
  ],
};

/**
 * Apply this slug's edits to a rendered body. Returns the html unchanged for
 * any slug with no entry.
 *
 * Idempotent: a body that already carries the replacement (i.e. the JSON has
 * been through this once) passes. A body that carries NEITHER the find nor the
 * replacement has drifted upstream — that throws rather than no-oping, because
 * the edit is then silently not happening and the release is back to publishing
 * whatever it published before.
 */
export function applyBodyEdits(slug, html) {
  const edits = BODY_EDITS[slug];
  if (!edits) return html;

  let out = html;
  for (const { find, replace } of edits) {
    if (out.includes(find)) {
      out = out.split(find).join(replace);
    } else if (!out.includes(replace)) {
      throw new Error(
        `wp-body-edits: ${slug} — no match for ${JSON.stringify(find.slice(0, 90))}. ` +
          `The upstream body changed; update or delete this entry rather than leaving it inert.`,
      );
    }
  }
  return out;
}
