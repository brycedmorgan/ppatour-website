/**
 * POST /api/hq/graphics — mutate the live graphics collection (edit mode only).
 *   { op: "add",    doc }            -> append a graphic, returns its id
 *   { op: "update", id, patch }      -> merge fields (e.g. the stamp/code box)
 *   { op: "delete", id }             -> remove a graphic
 * Every response returns the full { graphics } list so the page can re-render.
 *
 * Requires the HQ editor cookie. This persists to graphics.json, which /hq reads
 * over the weekly snapshot, so team uploads survive the Monday refresh.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { editorFromRequest } from "@/lib/hq/editor";
import { addGraphic, updateGraphic, deleteGraphic } from "@/lib/hq/graphics-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!editorFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "edit mode required", code: "invalid_argument" }, { status: 403 });
  }
  let body: { op?: unknown; id?: unknown; doc?: unknown; patch?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const op = body.op;
  try {
    if (op === "add" && body.doc && typeof body.doc === "object") {
      const { id, list } = await addGraphic(body.doc as Record<string, unknown>);
      return NextResponse.json({ ok: true, id, graphics: list });
    }
    if (op === "update" && typeof body.id === "string" && body.patch && typeof body.patch === "object") {
      const list = await updateGraphic(body.id, body.patch as Record<string, unknown>);
      return NextResponse.json({ ok: true, graphics: list });
    }
    if (op === "delete" && typeof body.id === "string") {
      const list = await deleteGraphic(body.id);
      return NextResponse.json({ ok: true, graphics: list });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: false, error: "bad op" }, { status: 400 });
}
