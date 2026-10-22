/**
 * Staff sessions for the corporate HQ area (/hq). Phase 1 is a READ-ONLY
 * preview, so this only proves "a staff member is signed in" — it reuses the
 * ambassador HMAC-signed cookie machinery under a separate cookie name.
 *
 * Phase 2 replaces the preview sign-in with Google SSO restricted to
 * @pickleball.com and adds a role (admin/pod/volunteer/viewer); the cookie then
 * carries that role and the server enforces it.
 */
import type { NextRequest } from "next/server";
import {
  makeSessionValue,
  readSessionValue,
  sessionCookieOptions,
  clearedCookieOptions,
} from "@/lib/ambassadors/session";

export const HQ_COOKIE = "hq_staff";

export const makeStaffValue = makeSessionValue;
export const readStaffValue = readSessionValue;
export const hqCookieOptions = sessionCookieOptions;
export const hqClearedCookieOptions = clearedCookieOptions;

export function staffFromRequest(req: NextRequest): string | null {
  return readSessionValue(req.cookies.get(HQ_COOKIE)?.value);
}
