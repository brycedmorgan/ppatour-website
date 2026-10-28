/**
 * Forward a sponsorship lead to Jackalope's sales pipeline (ziff api/leads/hook.js).
 *
 * Used by the Contact form when the visitor picks "Sponsorship" (Bryce, 10/27:
 * those leads should land in the CRM, where Jacob assigns them and Jackalope
 * emails Connor a link). The /about/sponsors form keeps its own copy of this
 * call in app/api/sponsor-inquiry/route.ts.
 *
 * Returns "sent" only when Jackalope saved the lead. Callers send the inbox
 * email on anything else, so a Jackalope outage never loses a lead.
 *
 * Env: LEAD_HOOK_SECRET, JACKALOPE_LEADS_URL (defaults to production).
 */
export const LEADS_URL =
  process.env.JACKALOPE_LEADS_URL ?? "https://jackalopehq.vercel.app/api/leads/hook";

const FREE_MAIL = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com",
  "live.com", "msn.com", "me.com", "comcast.net", "proton.me", "protonmail.com",
]);

/** The hook needs a company. Typed one first, then the email's own domain
 *  ("drinkolipop.com" → "Drinkolipop"), then the person's name. */
export function leadCompany(company: string | undefined, email: string, name: string): string {
  const typed = (company ?? "").trim();
  if (typed) return typed.slice(0, 120);
  const domain = email.split("@")[1]?.toLowerCase().trim() ?? "";
  if (domain && !FREE_MAIL.has(domain)) {
    // "team.co.uk" → "team", not "co".
    const parts = domain.split(".");
    const sld = new Set(["co", "com", "org", "net", "ac", "gov", "edu"]);
    const i = parts.length >= 3 && sld.has(parts[parts.length - 2]) ? parts.length - 3 : parts.length - 2;
    const base = parts[i] ?? "";
    if (base) return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return (name || email).slice(0, 120);
}

export type JackalopeLead = {
  company: string;
  name?: string;
  email: string;
  phone?: string;
  category?: string;
  budget?: string;
  message?: string;
  source: string;
};

export async function forwardToJackalope(
  lead: JackalopeLead,
  label: string,
): Promise<"sent" | "skipped" | "failed"> {
  const secret = process.env.LEAD_HOOK_SECRET;
  if (!secret) {
    console.warn(`[${label}] LEAD_HOOK_SECRET unset; not forwarded to Jackalope`, { company: lead.company });
    return "skipped";
  }
  try {
    const res = await fetch(LEADS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-lead-secret": secret },
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error(`hook ${res.status}`);
    return "sent";
  } catch (err) {
    console.error(`[${label}] Jackalope forward failed`, err, { company: lead.company });
    return "failed";
  }
}
