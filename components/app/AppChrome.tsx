"use client";

import { Suspense } from "react";
import { AppLinkRouter } from "@/components/app/AppLinkRouter";
import { AppScoreBar } from "@/components/app/AppScoreBar";
import { AppTabBar } from "@/components/app/AppTabBar";
import { RegisterServiceWorker } from "@/components/app/RegisterServiceWorker";
import { useAppMode } from "@/components/app/use-app-mode";

/**
 * Everything that only exists inside the installed app: the always-on score bar,
 * the bottom tab bar, and the outbound-link router that keeps a Tixr checkout
 * from stranding the fan in Safari.
 *
 * Mounted once in the root layout. In a browser tab it renders nothing and
 * costs one `matchMedia` read — the site is unchanged for the 99% of traffic
 * that never installs. In an installed window it also flips
 * `<html data-app-mode="standalone">`, which is what hides the marketing
 * footer, the cookie banner and the accessibility launcher (globals.css).
 *
 * ⚠ The two bars are `fixed`, so nothing reserves space for them. The bottom
 * padding that keeps the last row of every page reachable is in globals.css,
 * keyed on the same attribute.
 */
export function AppChrome() {
  const isApp = useAppMode();
  if (!isApp) return null;

  return (
    <>
      <AppLinkRouter />
      <RegisterServiceWorker />
      {/* Suspense: useLiveTicker reads useSearchParams (?partner=). */}
      <Suspense fallback={null}>
        <AppScoreBar />
      </Suspense>
      <AppTabBar />
    </>
  );
}
