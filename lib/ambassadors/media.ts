/**
 * Serves an ambassador asset (graphic or logo) from the private store on THIS
 * origin, so the Graphics tab can draw it to a canvas and save the result
 * without a cross-origin taint. The bytes live in private Blob; this route is
 * the only way they reach the browser, and it streams them rather than exposing
 * the Blob URL.
 */
import { getBytes } from "@/lib/ambassadors/store";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const SAFE = /^[A-Za-z0-9._-]+$/;

export async function serveAsset(folder: "t" | "logos", file: string): Promise<Response> {
  if (!SAFE.test(file)) return new Response("bad request", { status: 400 });
  const bytes = await getBytes(`${folder}/${file}`);
  if (!bytes) return new Response("not found", { status: 404 });
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      // Private to the viewer; short cache so a re-uploaded graphic refreshes.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
