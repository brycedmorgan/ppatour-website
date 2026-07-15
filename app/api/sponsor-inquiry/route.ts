import { NextResponse } from "next/server";

/**
 * Sponsorship inquiry endpoint. Forwards each submission to the internal
 * Jackalope sales app (server-to-server, shared-secret header), where it
 * lands as a deal under Leads in the Sales pipeline.
 *
 * Env: LEAD_HOOK_SECRET (shared with Jackalope), JACKALOPE_LEADS_URL
 * (defaults to the production hook).
 */
const LEADS_URL =
  process.env.JACKALOPE_LEADS_URL ??
  "https://jackalopehq.vercel.app/api/leads/hook";

type Inquiry = {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  budget?: string;
  message?: string;
  website?: string; // honeypot
};

export async function POST(request: Request) {
  let b: Inquiry;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (b.website) return NextResponse.json({ ok: true }); // honeypot hit — pretend success

  const company = b.company?.trim();
  const email = b.email?.trim();
  if (!company || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Company and a valid email are required" },
      { status: 400 },
    );
  }

  const secret = process.env.LEAD_HOOK_SECRET;
  if (!secret) {
    // Not configured yet — log so nothing is silently lost, but don't fail the visitor.
    console.warn("[sponsor-inquiry] LEAD_HOOK_SECRET unset; inquiry logged only", {
      company,
      email,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(LEADS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-lead-secret": secret,
      },
      body: JSON.stringify({
        company,
        name: b.name,
        email,
        phone: b.phone,
        category: b.category,
        budget: b.budget,
        message: b.message,
        source: "ppatour.com sponsorship form",
      }),
    });
    if (!res.ok) throw new Error(`hook ${res.status}`);
  } catch (err) {
    console.error("[sponsor-inquiry] forward failed", err, { company, email });
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
