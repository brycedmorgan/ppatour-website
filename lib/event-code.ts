/**
 * Canonical event code — the join key between this site and Jackalope.
 *
 * Format: `MMYY-PPA-CITY-ST-USA`, e.g. `0926-PPA-CARY-NC-USA`.
 *
 *   MMYY   month + 2-digit year of the event's **END** date. Atlanta runs
 *          Apr 27 – May 3 and codes as `0526`, not `0426`. This is the part
 *          most likely to be got wrong by hand.
 *   PPA    the SERIES — the tour brand, not the tier. Every PPA stop is "PPA"
 *          whether it's a Major, a Cup or a 125. (MLP, junior etc. are other
 *          series on the same spine.)
 *   CITY   city, uppercased, non-alphanumerics stripped: "Virginia Beach" →
 *          `VIRGINIABEACH`.
 *   ST     2-letter state, then `USA`.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * Jackalope attributes marketing to events by parsing this code out of the
 * campaign string — `api/marketing/spend-by-event.js` for Meta spend and
 * `lib/ga4.js` for web sessions and conversions. Until now this site emitted
 * page-type labels as `utm_campaign` (`event`, `watch`, `rankings`), so every
 * ticket click landed in GA4 attributable to no event at all. UTMs are stamped
 * at click time and cannot be backfilled.
 *
 * ── Source of truth ──────────────────────────────────────────────────────
 * The schedule spine in Jackalope (`lib/spine-match.js`) is authoritative.
 * This derivation was validated against all 35 of its dated US PPA rows —
 * 35 matched, 0 mismatched — so deriving here rather than shipping a copy of
 * the table keeps API-sourced events working without a code change.
 *
 * ⚠ The spine currently holds NO international PPA codes. For a non-US stop we
 * derive the same shape using the country, which Jackalope will not match to a
 * spine event — it lands in the "untagged spend" bucket that
 * `spend-by-event.js` already surfaces. That's the correct failure: visible and
 * fixable, rather than a wrong attribution. Add the international stops to the
 * spine to close it.
 */

/** Country name → ISO-3, for the international stops the spine doesn't cover. */
const COUNTRY_ISO3: Record<string, string> = {
  Australia: "AUS",
  Canada: "CAN",
  Italy: "ITA",
  Spain: "ESP",
  Singapore: "SGP",
  Malaysia: "MYS",
  China: "CHN",
  Vietnam: "VNM",
  "Hong Kong": "HKG",
};

const strip = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function eventCode(t: {
  city?: string;
  state?: string;
  endDate?: string;
}): string | null {
  const { city, state, endDate } = t;
  if (!city || !endDate) return null;
  // endDate is ISO (yyyy-mm-dd); read it as text so no timezone can shift the
  // month — a UTC parse of a US event can roll back a day and change MMYY.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDate);
  if (!m) return null;
  const mmyy = `${m[2]}${m[1].slice(2)}`;

  const CITY = strip(city);
  if (!CITY) return null;

  const st = (state ?? "").trim();
  // 2-letter state → domestic. Anything else in `state` is a country name
  // (the curated list stores "Australia"/"Italy" there for international stops).
  const region =
    /^[A-Za-z]{2}$/.test(st) && st.toUpperCase() !== st.toLowerCase()
      ? `${st.toUpperCase()}-USA`
      : (COUNTRY_ISO3[st] ?? (st ? strip(st).slice(0, 3) : "INTL"));

  return `${mmyy}-PPA-${CITY}-${region}`;
}
