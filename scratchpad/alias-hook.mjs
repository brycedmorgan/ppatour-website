import { pathToFileURL } from "node:url";
import { statSync } from "node:fs";
import path from "node:path";
const ROOT = "/Users/bryce/pickleball/ppatour-website";
export async function resolve(spec, ctx, next) {
  let s = spec;
  if (s.startsWith("@/")) {
    const base = path.join(ROOT, s.slice(2));
    for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
      const p = base + ext;
      try { if (statSync(p).isFile()) { s = pathToFileURL(p).href; break; } } catch {}
    }
  }
  const r = await next(s, ctx);
  if (r.url.endsWith(".json")) {
    return { ...r, importAttributes: { type: "json" }, format: "json" };
  }
  return r;
}
