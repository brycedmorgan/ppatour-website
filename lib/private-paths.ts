/**
 * Pages that must never be reported to analytics or tracking.
 *
 * The Newsroom dashboard lives at a secret address, `/nr-<24 random chars>/`,
 * whose key is the NEWSROOM_URL_KEY env var (never in code: this repo is
 * public). GA4, the Meta pixel, Customer.io, Jackalope and Vercel analytics
 * would otherwise record that address in reports other people can read. Only
 * the SHAPE is known here, which is all the gate needs. `/newsroom` is the
 * internal route the secret address is rewritten to (proxy.ts).
 *
 * Client-safe: no env, no node imports.
 */
export const NEWSROOM_KEY_PATTERN = /^\/nr-[a-z0-9]{24}(?:\/|$)/;

export function isPrivatePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    NEWSROOM_KEY_PATTERN.test(pathname) ||
    pathname === "/newsroom" ||
    pathname.startsWith("/newsroom/")
  );
}
