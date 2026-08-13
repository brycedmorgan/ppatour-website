/**
 * UTM preservation utilities. Revenue lever #1 in the strategy doc — every
 * outbound link to a commerce partner (tixr, pickleballtournaments) must carry
 * full attribution so GA4 stops misreading the handoff as a self-referral.
 */

type UtmParams = {
  campaign: string;
  content: string;
  /**
   * The PRODUCT the click is for, when the link sells a specific thing.
   *
   * `utm_content` is the placement (which page, which player, which button) and
   * that is what our own reporting keys on. A partner reading their side of the
   * handoff wants the opposite cut: every click on THEIR product, across all the
   * placements. Paddle links set this to the model slug so Pickleball Central —
   * and through them the paddle brand — can count "how many did ppatour.com
   * send us" per model rather than per player. Omitted everywhere else, so no
   * existing link changes.
   */
  term?: string;
};

/** Append PPA attribution UTMs to an outbound commerce URL. */
export function withUtm(baseUrl: string, { campaign, content, term }: UtmParams): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "ppatour");
  url.searchParams.set("utm_medium", "website");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  if (term) url.searchParams.set("utm_term", term);
  return url.toString();
}

/**
 * Rewrite ONLY `utm_campaign` on a link that already carries its own UTMs.
 *
 * For partner links declared in module-level tables (PBTV, MATCHDAY) that are
 * rendered on an event page: the table can't know which event it's on, so it
 * ships a generic `utm_campaign=event`, and every partner click from every
 * event page collapses into one unattributable bucket. This stamps the event's
 * canonical code at render time and leaves `utm_content` — the placement label
 * the table author chose — untouched.
 *
 * Returns the input unchanged if it isn't a parseable absolute URL.
 */
export function withCampaign(href: string, campaign: string | null | undefined): string {
  if (!campaign) return href;
  try {
    const url = new URL(href);
    url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch {
    return href;
  }
}
