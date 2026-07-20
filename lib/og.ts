import { readFile } from "fs/promises";
import path from "path";

/**
 * Shared helpers for generated OG share cards (next/og · satori).
 * Loads the brand Gotham weights and inlines /public images as data URIs
 * (satori can't fetch relative URLs at build/request time).
 */

const root = process.cwd();

export async function ogFonts() {
  const [black, medium] = await Promise.all([
    readFile(path.join(root, "app/fonts/Gotham-Black.ttf")),
    readFile(path.join(root, "app/fonts/Gotham-Medium.ttf")),
  ]);
  return [
    { name: "Gotham", data: black, weight: 900, style: "normal" },
    { name: "Gotham", data: medium, weight: 500, style: "normal" },
  ] as { name: string; data: Buffer; weight: 500 | 900; style: "normal" }[];
}

export async function ogImageData(publicPath: string): Promise<string | null> {
  try {
    const buf = await readFile(
      path.join(root, "public", publicPath.replace(/^\//, "")),
    );
    const ext = publicPath.toLowerCase().endsWith(".png") ? "png" : "jpeg";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export const OG_SIZE = { width: 1200, height: 630 };
