/**
 * GET /api/ambassadors/me — the signed-in ambassador's own slice plus `shared`.
 * Session required. Leaderboards are already cleaned (isYou set, id stripped)
 * and the internal tier removed in buildMe(). There is no way to request
 * anyone else's data: the email comes only from the signed cookie.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { emailFromRequest } from "@/lib/ambassadors/session";
import { buildMe } from "@/lib/ambassadors/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }
  const me = await buildMe(email);
  if (!me) {
    // Valid cookie, but no longer on the roster (or nothing uploaded yet).
    return NextResponse.json({ error: "no access" }, { status: 401 });
  }
  return NextResponse.json(me, { headers: { "Cache-Control": "private, no-store" } });
}
