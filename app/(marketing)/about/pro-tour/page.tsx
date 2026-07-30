import { permanentRedirect } from "next/navigation";

/**
 * Merged into /about (Tyler, 7/30 — the standalone Pro Tour page was redundant).
 * Its "One Race / Five Divisions" section and the tier table now live on /about;
 * this route permanently redirects so existing links, nav, and search keep working.
 */
export default function ProTourPage() {
  permanentRedirect("/about");
}
