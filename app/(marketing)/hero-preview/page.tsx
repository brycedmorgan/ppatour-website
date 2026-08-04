import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";

/**
 * Homepage hero review page.
 *
 * Connor, 8/4 (via Wesley): the hero should be better — "not sure if we have
 * some movement (slow mo video), or use something like this [still]".
 *
 * ⚠ THIS IS THE REAL HOMEPAGE, NOT A MOCKUP (Wesley, 8/4: "remove all the other
 * info and just mockup the homepage content onto the hero-preview"). It renders
 * the same <HomeContent> that `/` renders, with the same live event data,
 * rankings, newsroom and callouts. The ONLY difference is `heroToggle`, which
 * adds the in-hero background switcher.
 *
 * It deliberately is NOT a side-by-side of cropped hero samples. A hero is
 * judged by what sits under it — how the headline holds against the section
 * below, whether the motion competes with the Next on Tour strip — and none of
 * that is visible on a page of isolated hero cards. It also means there is
 * nothing to re-implement: whichever background wins becomes the `heroVariant`
 * default in HomeContent, one word, and this page can be deleted.
 *
 * ⚠ noindex/nofollow. It is a byte-for-byte duplicate of the homepage apart
 * from the toggle, so leaving it indexable would put a second copy of the
 * homepage's H1, copy and structured data in the index, competing with `/`.
 */

export const metadata: Metadata = {
  title: "Homepage Hero Preview",
  robots: { index: false, follow: false },
};

/** Matches the homepage. Same data, same caching, so the preview is honest. */
export const revalidate = 60;
export const dynamic = "force-static";

export default function HeroPreviewPage() {
  return <HomeContent heroVariant="video" heroToggle />;
}
