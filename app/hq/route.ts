/**
 * GET /hq — the corporate "Ambassador HQ" dashboard, Phase 1 (read-only).
 *
 * We serve the real HQ single-page app (lib/hq/hq-template.html, the same UI
 * that runs on claude.ai) UNCHANGED, and inject a `window.claude` shim in front
 * of it: the shim feeds the app a private data snapshot through the same
 * db/user API it already uses, reports the viewer as non-admin (so every edit
 * control stays hidden), and makes writes no-ops. The result is a faithful,
 * read-only HQ on our own domain.
 *
 * Staff-gated: a signed staff cookie is required (Phase 1 uses a preview
 * sign-in; Phase 2 swaps in Google SSO for @pickleball.com). The data snapshot
 * holds every ambassador's numbers and applicants, so it is private — read
 * server-side, never a public URL — and the page is noindex.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { staffFromRequest } from "@/lib/hq/staff";
import { getJson } from "@/lib/ambassadors/store";
import { previewEnabled } from "@/lib/ambassadors/config";
import demoHq from "@/lib/hq/demo-hq.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only shim over the claude.ai db/user API the HQ app expects. Injected as
// a string so it runs in the browser before the app's own boot script.
const SHIM = `
window.claude = {
  use: async function (name) {
    var D = window.__HQ__ || { docs: {}, colls: {} };
    if (name === 'db') {
      var dsnap = function (p) { var d = D.docs[p]; return { exists: d != null, data: function () { return d; } }; };
      var csnap = function (p) { var a = D.colls[p] || []; return { docs: a.map(function (x) { return { exists: true, id: x._id, data: function () { return x; } }; }) }; };
      var ro = function () { return Promise.reject(new Error('read-only preview')); };
      return {
        doc: function (p) { return { onSnapshot: function (cb) { try { cb(dsnap(p)); } catch (e) {} return function () {}; }, get: function () { return Promise.resolve(dsnap(p)); }, set: ro, update: ro, delete: ro }; },
        collection: function (p) { var c = { onSnapshot: function (cb) { try { cb(csnap(p)); } catch (e) {} return function () {}; }, orderBy: function () { return c; }, limit: function () { return c; }, add: ro }; return c; }
      };
    }
    if (name === 'user') { return { canEdit: function () { return Promise.resolve(false); }, isOwner: function () { return Promise.resolve(false); } }; }
    return null; // assets, downloads -> unavailable (upload/download controls hide)
  }
};`;

export async function GET(request: NextRequest) {
  if (!staffFromRequest(request)) {
    return NextResponse.redirect(new URL("/hq/signin", request.url));
  }

  // Real snapshot when uploaded; off-production, fall back to the committed
  // FICTIONAL demo dataset so /hq is shareable on staging with no upload.
  let data = await getJson("hq.json");
  if (!data && previewEnabled()) data = demoHq;
  if (!data) {
    return new Response("Ambassador HQ data hasn't been loaded yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  const tmpl = await fs.readFile(path.join(process.cwd(), "lib/hq/hq-template.html"), "utf8");
  const injected = `<script src="/hq/stamp.js"></script>\n<script>window.__HQ__=${JSON.stringify(data)};\n${SHIM}\n</script>`;
  const html = tmpl.replace('<script src="stamp.js"></script>', injected);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
