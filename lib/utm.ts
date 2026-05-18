/**
 * UTM preservation utilities. Revenue lever #1 in the strategy doc — every
 * outbound link to a commerce partner (tixr, pickleballtournaments) must carry
 * full attribution so GA4 stops misreading the handoff as a self-referral.
 */

type UtmParams = {
  campaign: string;
  content: string;
};

/** Append PPA attribution UTMs to an outbound commerce URL. */
export function withUtm(baseUrl: string, { campaign, content }: UtmParams): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "ppatour");
  url.searchParams.set("utm_medium", "website");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  return url.toString();
}
