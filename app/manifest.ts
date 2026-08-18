import type { MetadataRoute } from "next";

/**
 * Web app manifest — what makes ppatour.com installable to a phone home screen.
 *
 * This is the fan app's whole delivery mechanism for now: no store, no review,
 * no wrapper. Install turns the site into a standalone window with no browser
 * chrome, and `AppChrome` swaps the marketing furniture for app furniture (see
 * `components/app/AppChrome.tsx`).
 *
 * ⚠ `start_url` carries `?source=pwa`. It is not decoration: a standalone
 * window is indistinguishable from a browser tab in analytics, and installs are
 * the one number this project is judged on. It also survives into the session
 * so `AppChrome` can keep app mode on for a visitor whose browser under-reports
 * `display-mode: standalone` (older iOS).
 *
 * ⚠ `id` is fixed. Chrome keys the installed app on it; changing it later makes
 * every existing install a stranger and the user gets a second icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "Carvana PPA Tour",
    short_name: "PPA Tour",
    description:
      "Live pro pickleball scores, the points race, the tour schedule, and everything you need at the event.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c2b44",
    theme_color: "#0c2b44",
    categories: ["sports", "news"],
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/app-icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Live scores", url: "/live/?source=pwa" },
      { name: "Rankings", url: "/rankings/?source=pwa" },
      { name: "Schedule", url: "/events/?source=pwa" },
    ],
  };
}
