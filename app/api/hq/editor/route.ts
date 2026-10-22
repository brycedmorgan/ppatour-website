/**
 * POST /api/hq/editor { password }  — unlock HQ graphics edit mode.
 * DELETE /api/hq/editor            — leave edit mode.
 *
 * A single shared team password (HQ_EDITOR_PASSWORD) sets a signed editor
 * cookie. It grants graphics management only (see lib/hq/editor.ts).
 */
import { NextResponse } from "next/server";
import { HQ_EDITOR_COOKIE, editorPasswordOk, makeEditorValue, editorCookieOptions, editorClearedOptions } from "@/lib/hq/editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  const pw = typeof body.password === "string" ? body.password : "";
  if (!editorPasswordOk(pw)) {
    return NextResponse.json({ ok: false, error: "wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HQ_EDITOR_COOKIE, makeEditorValue(), editorCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HQ_EDITOR_COOKIE, "", editorClearedOptions());
  return res;
}
