/** GET /ambassadors/logos/<file> — an event logo, same-origin. */
import type { NextRequest } from "next/server";
import { serveAsset } from "@/lib/ambassadors/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  return serveAsset("logos", file);
}
