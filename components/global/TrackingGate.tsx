"use client";

import { usePathname } from "next/navigation";
import { isPrivatePath } from "@/lib/private-paths";

/**
 * Renders the site's analytics and third-party widgets everywhere EXCEPT
 * private pages (lib/private-paths.ts). On a private page nothing inside is
 * mounted, so no tracker script loads and no page view is sent.
 *
 * Runs during SSR too (usePathname works there), so the scripts are absent
 * from the HTML, not just removed after hydration.
 */
export function TrackingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isPrivatePath(pathname)) return null;
  return <>{children}</>;
}
