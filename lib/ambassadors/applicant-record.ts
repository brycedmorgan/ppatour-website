/**
 * The applicant record shape HQ's Applicants tab reads, and the mapping from a
 * submitted ambassador-application form to one. `applied` is the date they
 * applied (set at submission), which HQ shows in the table and the detail view.
 */
export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  volunteered?: string;
  attended?: string;
  travel?: string;
  ig?: string;
  igFollowers?: number;
  applied?: string; // YYYY-MM-DD
  count?: number;
  live?: boolean; // arrived via the live form feed (not the sheet import)
  career?: string;
  why?: string;
  promote?: string;
  qualifications?: string;
  socials?: string;
  [k: string]: unknown;
}

/** Build an applicant from the form-submit `record` (display values). */
export function buildApplicant(record: Record<string, unknown>): Applicant {
  const s = (k: string): string => {
    const v = record[k];
    return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  };
  const num = (k: string): number | undefined => {
    const n = parseInt(String(record[k] ?? "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  };
  const first = s("firstName");
  const last = s("lastName");
  const email = s("email").toLowerCase();
  const applied = new Date().toISOString().slice(0, 10);
  const id = (email || `${first}${last}`).replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 40) || "applicant";
  return {
    id,
    name: `${first} ${last}`.trim(),
    email,
    phone: s("phone"),
    city: s("city"),
    state: s("state"),
    zip: s("zip"),
    volunteered: s("volunteeredBefore"),
    attended: s("eventsAttended"),
    travel: s("willingTravel"),
    ig: s("instagramHandle"),
    igFollowers: num("instagramFollowers"),
    applied,
    count: 1,
    live: true,
    career: s("careerBackground").slice(0, 2000),
    why: s("whyAmbassador").slice(0, 2000),
    promote: s("howPromote").slice(0, 2000),
    qualifications: s("qualifications").slice(0, 2000),
    socials: s("socialPlatforms"),
  };
}
