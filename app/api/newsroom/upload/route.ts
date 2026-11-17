/**
 * POST /api/newsroom/upload/ — token exchange for direct-to-Blob image uploads
 * from the Newsroom editor (`upload()` from @vercel/blob/client).
 *
 * The browser sends the file straight to Vercel Blob, so photos bigger than a
 * function's 4.5 MB body limit still upload. This route only signs the upload,
 * and only for a signed-in editor. Files land under `newsroom/` in the site's
 * existing Blob store, whose host next.config.ts already allows for next/image.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/newsroom/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session) throw new Error("Not signed in.");
        if (!pathname.startsWith("newsroom/")) throw new Error("Bad upload path.");
        return {
          allowedContentTypes: IMAGE_TYPES,
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ by: session.sub }),
        };
      },
      // Nothing to record: the editor stores the returned URL on the post.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
