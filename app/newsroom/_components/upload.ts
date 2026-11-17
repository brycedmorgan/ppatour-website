"use client";

import { upload } from "@vercel/blob/client";

/** Uploads an image straight to Vercel Blob; returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+/, "");
  const blob = await upload(`newsroom/${safe || "image"}`, file, {
    access: "public",
    // Trailing slash: next.config sets trailingSlash, and a 308 would drop the POST.
    handleUploadUrl: "/api/newsroom/upload/",
    contentType: file.type,
  });
  return blob.url;
}
