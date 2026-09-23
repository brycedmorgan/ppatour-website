/**
 * GET /ambassadors/asset/<id> — a graphic asset stored by opaque id, served
 * same-origin from the private store (key `blob/<id>`). The HQ page requests
 * these as `/_blob/<assetId>`; next.config rewrites that path here.
 *
 * The id has no extension, so the content type is sniffed from the leading
 * bytes rather than the filename.
 */
import { getBytes } from "@/lib/ambassadors/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE = /^[A-Za-z0-9._-]+$/;

function sniff(b: Buffer): string {
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 4 && b.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  if (b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  return "application/octet-stream";
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  if (!SAFE.test(id)) return new Response("bad request", { status: 400 });
  const bytes = await getBytes(`blob/${id}`);
  if (!bytes) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": sniff(bytes),
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
