/**
 * Whether the Paddle Lab is open to the public.
 *
 * `false` = BUILT, GATED AND UNLINKED. Every /paddle-lab route sits behind HTTP
 * Basic auth in ./proxy.ts, nothing on ppatour.com links to it, it is out of the
 * sitemap, and the athlete pages no longer print lab measurements.
 *
 * **Why it was closed.** Gordon Kaye (JOOLA, Chief Experience Officer) wrote to
 * Connor on 2026-09-10: JOOLA spends $1.5M with the tour this year and reads a
 * public lab that ranks hundreds of competitors' paddles — on Carvana PPA Tour
 * pages, with every buy link pointing at Pickleball Central — as the tour
 * promoting everyone except the brands that pay it. He also flagged a real data
 * conflict: the UPA-A test standard publishes a 2100 max RPM, and most of the
 * lab's top all-court paddles show 2200+, because the numbers are John Kew's
 * independent tests and are not synced to UPA-A. Taylor Loomis' call the same
 * morning: *"We should pull this down for now until we have a better path.
 * Probably lives only on pickleball.com."* Bryce told Taylor and Connor the page
 * would move to pickleball.com and was only on ppatour.com because that stack is
 * where it could be built and demoed.
 *
 * **Opening it again is this one line — but do not flip it on ppatour.com.** The
 * agreed home is pickleball.com. Flipping this to `true` restores the nav item,
 * the footer link, the sitemap entries and the athlete-page lab stats, and drops
 * the password. Three things must land before that is anyone's call: terms with
 * John Kew (Hannah Johns owns it), an answer to the UPA-A/Kew RPM conflict, and
 * a partner-brand position Gordon can live with.
 *
 * ⚠ THIS FILE IMPORTS NOTHING, AND THAT IS LOAD-BEARING. `Header.tsx` is a client
 * component, so anything this module pulls in ships to every browser on every
 * page. Same rule, same reason, as lib/europe-launch.ts.
 *
 * ⚠ THIS ONE IS A REAL PASSWORD, UNLIKE THE EUROPE FLAG. Europe is unlisted:
 * anyone with the URL sees it. The lab is gated: the proxy demands credentials
 * before Next renders a single lab route, and it FAILS CLOSED — no
 * `PADDLE_LAB_PASSWORD` in the environment means every request is refused, never
 * waved through. Bryce, 9/10: *"Please make this not linkable.... and password
 * protected."*
 */
export const PADDLE_LAB_PUBLIC = false;

/** Metadata `robots` value for a lab surface. Indexable only once public. */
export const paddleLabRobots = PADDLE_LAB_PUBLIC
  ? undefined
  : { index: false, follow: false };
