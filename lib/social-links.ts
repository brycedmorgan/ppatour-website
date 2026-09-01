/**
 * Label a pro's own account URL for display.
 *
 * Connor, 9/1: "We should have their socials, LinkedIn." The links were already
 * on the page — but only inside the JSON-LD `sameAs`, which no human sees. This
 * is the visible half.
 *
 * ⚠ URL IN, LABEL OUT. Nothing here builds a URL, and nothing infers a handle:
 * the values come from Pro Player Central as pasted https links, validated on
 * write there and again in `lib/player-overrides.ts`. Publishing a link under a
 * pro's name is a claim that they own that account, so the only thing this
 * module is allowed to do is name the platform we were handed.
 *
 * An unrecognized host keeps its own domain as the label rather than being
 * dropped — a pro's personal site or a platform we haven't listed is still
 * theirs, and silently hiding a link the team entered looks like a bug to them.
 */

/** Host suffix → the way the platform writes its own name. */
const PLATFORM_BY_HOST: [suffix: string, label: string][] = [
  ["instagram.com", "Instagram"],
  ["x.com", "X"],
  ["twitter.com", "X"],
  ["tiktok.com", "TikTok"],
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["facebook.com", "Facebook"],
  ["linkedin.com", "LinkedIn"],
  ["threads.net", "Threads"],
  ["threads.com", "Threads"],
  ["twitch.tv", "Twitch"],
  ["substack.com", "Substack"],
];

export type SocialLink = { href: string; label: string };

/**
 * Order the platforms are billed in, so every athlete page lists them the same
 * way regardless of the order they were typed into Jackalope. Anything not on
 * the list sorts last, alphabetically by label.
 */
const ORDER = PLATFORM_BY_HOST.map(([, label]) => label).filter(
  (l, i, arr) => arr.indexOf(l) === i,
);

export function socialLinks(urls: string[] | undefined | null): SocialLink[] {
  const out: SocialLink[] = [];
  const seen = new Set<string>();
  for (const raw of urls ?? []) {
    let host: string;
    try {
      const u = new URL(raw);
      // Only https, matching the validation upstream — a link we render is a
      // link we vouch for.
      if (u.protocol !== "https:") continue;
      host = u.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      continue;
    }
    const match = PLATFORM_BY_HOST.find(
      ([suffix]) => host === suffix || host.endsWith(`.${suffix}`),
    );
    const label = match ? match[1] : host;
    // One link per platform. Two Instagram URLs on one pro is a data entry slip,
    // and printing "Instagram Instagram" looks broken on their own page.
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ href: raw, label });
  }
  return out.sort((a, b) => {
    const ia = ORDER.indexOf(a.label);
    const ib = ORDER.indexOf(b.label);
    if (ia === -1 && ib === -1) return a.label.localeCompare(b.label);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
