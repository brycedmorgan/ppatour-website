import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { buildTripEvent, resolveTournamentForTrip } from "@/lib/trip-event";
import { composeTripEmail } from "@/lib/trip-email";
import {
  AGE_BRACKETS,
  FORMATS,
  SKILL_LEVELS,
  type TripSelection,
} from "@/lib/trip";

/**
 * "Email my trip plan" — sends the fan their assembled Trip Builder plan.
 *
 * ⚠ The email is REBUILT SERVER-SIDE from the saved selection (via the shared
 * `assembleTrip`), never from client-sent HTML — so this can't be turned into a
 * relay that mails arbitrary branded content to any address. It only ever sends
 * to the address in the request, and only for an event we run a page for.
 *
 * Degrades gracefully: no SendGrid env (local/dev) → logs and returns a clear
 * "not set up here" rather than pretending it sent. Mirrors lib/vacations/email.ts.
 */
export const runtime = "nodejs";

function pick<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : null;
}

function normalizeSelection(s: unknown): TripSelection {
  const o = (s ?? {}) as Record<string, unknown>;
  const party = Number(o.party);
  return {
    intent: pick(o.intent, ["watch", "play", "both"] as const),
    style: pick(o.style, ["casual", "compete"] as const),
    skill: pick(o.skill, SKILL_LEVELS),
    age: pick(o.age, AGE_BRACKETS),
    format: pick(o.format, FORMATS),
    from: typeof o.from === "string" ? o.from.slice(0, 60) : "",
    travel: pick(o.travel, ["fly", "drive"] as const),
    party: Number.isFinite(party) ? Math.min(Math.max(Math.round(party), 1), 8) : 1,
    watchPros: Array.isArray(o.watchPros)
      ? o.watchPros.filter((x): x is string => typeof x === "string").slice(0, 12)
      : [],
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  // Honeypot — a bot filled the hidden field. Accept quietly, send nothing.
  if (typeof body.company === "string" && body.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }

  const year = String(body.year ?? "");
  const slug = String(body.slug ?? "");
  const sel = normalizeSelection(body.selection);

  const t = await resolveTournamentForTrip(year, slug);
  if (!t) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find that event." },
      { status: 404 },
    );
  }

  const event = await buildTripEvent(t);
  const { subject, html, text } = composeTripEmail(event, sel);

  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;
  if (!key || !from) {
    console.log("[trip-email] SendGrid not configured; would send:", { to: email, subject });
    return NextResponse.json(
      { ok: false, error: "Email delivery isn't set up on this environment yet." },
      { status: 503 },
    );
  }

  sgMail.setApiKey(key);
  try {
    await sgMail.send({
      to: email,
      from: { email: from, name: "PPA Tour" },
      replyTo: from,
      subject,
      html,
      text,
    });
  } catch (e) {
    console.error("[trip-email] send failed", e);
    return NextResponse.json(
      { ok: false, error: "Couldn't send that just now. Try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
