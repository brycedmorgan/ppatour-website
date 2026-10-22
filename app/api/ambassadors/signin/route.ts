/**
 * POST /api/ambassadors/signin  { email }
 *
 * Always replies with the same neutral message — it NEVER reveals whether the
 * email is on the roster. When (and only when) the email is a current
 * ambassador, a one-time link is emailed. Rate limited per email and per IP.
 */
import { NextResponse } from "next/server";
import { emailIsAmbassador, normEmail } from "@/lib/ambassadors/portal";
import { createSignInToken } from "@/lib/ambassadors/tokens";
import { sendSignInEmail } from "@/lib/ambassadors/email";
import { allowSignIn } from "@/lib/ambassadors/ratelimit";
import { siteUrl } from "@/lib/ambassadors/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEUTRAL = { ok: true, message: "If that email is on our ambassador list, we sent you a link." };

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || request.headers.get("x-real-ip") || "0.0.0.0").trim();
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(NEUTRAL);
  }
  const email = normEmail(typeof body.email === "string" ? body.email : "");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(NEUTRAL); // never disclose; just no-op
  }

  const allowed = await allowSignIn(email, clientIp(request));
  if (!allowed) {
    // Same neutral body; 429 lets the client soft-message without disclosing.
    return NextResponse.json(NEUTRAL, { status: 429 });
  }

  if (await emailIsAmbassador(email)) {
    const token = await createSignInToken(email);
    const link = `${siteUrl()}/ambassadors/verify?token=${encodeURIComponent(token)}`;
    try {
      await sendSignInEmail(email, link);
    } catch (e) {
      console.error("[ambassadors/signin] email send failed", e);
      // Still neutral — don't leak that this address exists.
    }
  }

  return NextResponse.json(NEUTRAL);
}
