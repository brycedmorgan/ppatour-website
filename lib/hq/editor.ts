/**
 * HQ "edit mode" — lets the team upload and manage graphics on /hq without
 * per-person accounts. A single shared password (HQ_EDITOR_PASSWORD) unlocks an
 * editor cookie; the graphics write endpoints require it, and /hq only exposes
 * the upload/stamp/delete controls when it is present.
 *
 * Deliberately narrow: this grants graphics management ONLY. It does NOT set the
 * HQ "admin" flag, so payouts, CRM, pods and volunteer editing stay read-only.
 * The cookie reuses the ambassador HMAC machinery under its own name.
 */
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import {
  makeSessionValue,
  readSessionValue,
  sessionCookieOptions,
  clearedCookieOptions,
} from "@/lib/ambassadors/session";

export const HQ_EDITOR_COOKIE = "hq_editor";

export function makeEditorValue(): string {
  return makeSessionValue("editor@pickleball.com");
}

export function editorFromRequest(req: NextRequest): string | null {
  return readSessionValue(req.cookies.get(HQ_EDITOR_COOKIE)?.value);
}

export const editorCookieOptions = sessionCookieOptions;
export const editorClearedOptions = clearedCookieOptions;

/** Constant-time check of a submitted password against HQ_EDITOR_PASSWORD. */
export function editorPasswordOk(pw: string): boolean {
  const want = process.env.HQ_EDITOR_PASSWORD ?? "";
  if (want.length < 6) return false; // fail closed if unset/too short
  const a = Buffer.from(pw ?? "");
  const b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** True when edit mode can exist at all (the shared password is configured). */
export function editorConfigured(): boolean {
  return (process.env.HQ_EDITOR_PASSWORD ?? "").length >= 6;
}
