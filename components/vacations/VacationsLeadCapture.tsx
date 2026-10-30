"use client";

import { usePathname } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

/**
 * Trip pages whose foot-of-page signups are a waitlist Lainey pulls on its own.
 * Tagged as `website_lead_region`, not read from `website_lead_page`: the page
 * attribute is overwritten by whatever page that person signs up from next.
 * An explicit list, not inferred from the slug — only a page added here is a
 * waitlist.
 */
const WAITLIST_REGIONS: Record<string, string> = {
  // Coming-soon (10/30): the email form is the only conversion on this page.
  "/vacations/trips/st-lucia": "st-lucia",
};

/** Lainey's list, mounted once in app/vacations/layout.tsx. */
export function VacationsLeadCapture() {
  const path = (usePathname() ?? "").replace(/\/+$/, "");
  return <LeadMagnetCapture variant="vacations" region={WAITLIST_REGIONS[path]} />;
}
