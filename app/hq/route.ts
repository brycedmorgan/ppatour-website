/**
 * GET /hq — the corporate "Ambassador HQ" dashboard.
 *
 * We serve the real HQ single-page app (lib/hq/hq-template.html, the same UI
 * that runs on claude.ai) UNCHANGED, and inject a `window.claude` shim in front
 * of it. The shim feeds the app a private data snapshot through the same db/user
 * API it already uses. It is READ-ONLY for everything (payouts, CRM, pods,
 * applicants) EXCEPT graphics: when the viewer is in edit mode (the shared team
 * password, see /hq/edit) the shim exposes a working `assets` object and live
 * graphics writes, so the team can upload and manage graphics right here.
 *
 * Graphics persist in their own graphics.json (lib/hq/graphics-store), read over
 * the weekly hq.json snapshot, so a Monday payout refresh never wipes uploads.
 *
 * Staff-gated: a signed staff OR editor cookie is required. The data snapshot
 * holds every ambassador's numbers, so it is private and the page is noindex.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { staffFromRequest } from "@/lib/hq/staff";
import { editorFromRequest } from "@/lib/hq/editor";
import { getGraphics, putGraphics, type Graphic } from "@/lib/hq/graphics-store";
import { getLiveApplicants } from "@/lib/ambassadors/applicants-store";
import type { Applicant } from "@/lib/ambassadors/applicant-record";
import { getJson } from "@/lib/ambassadors/store";
import { previewEnabled } from "@/lib/ambassadors/config";
import demoHq from "@/lib/hq/demo-hq.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HqData = { docs?: Record<string, unknown>; colls?: Record<string, unknown[]> };

// Shim over the claude.ai db/user/assets API the HQ app expects. Read-only
// EXCEPT graphics: `assets` and the graphics collection accept writes when
// window.__HQ__.canUpload is true (editor cookie). Everything else stays a
// no-op, so payouts / CRM / pods / applicants can't be edited here.
const SHIM = `
window.claude = {
  use: async function (name) {
    var D = window.__HQ__ || { docs: {}, colls: {} };
    if (name === 'db') {
      var G = { list: ((D.colls && D.colls.graphics) || []).slice(), cb: null };
      var toDocs = function (arr) { return { docs: arr.map(function (x) { return { exists: true, id: x._id, data: function () { return x; } }; }) }; };
      var emitG = function () { if (G.cb) { try { G.cb(toDocs(G.list)); } catch (e) {} } };
      var dsnap = function (p) { var d = D.docs ? D.docs[p] : null; return { exists: d != null, data: function () { return d; } }; };
      var ro = function () { return Promise.reject(Object.assign(new Error('read-only'), { code: 'invalid_argument' })); };
      var gpost = function (op, extra) { return fetch('/api/hq/graphics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ op: op }, extra)) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Object.assign(new Error(j.error || 'write failed'), { code: j.code }); return j; }); }); };
      var apply = function (j) { if (j && j.graphics) { G.list = j.graphics; emitG(); } return j; };
      var gdoc = function (id) { return {
        onSnapshot: function (cb) { try { cb({ exists: true, data: function () { return G.list.find(function (x) { return x._id === id; }); } }); } catch (e) {} return function () {}; },
        get: function () { return Promise.resolve({ exists: true, data: function () { return G.list.find(function (x) { return x._id === id; }); } }); },
        update: function (patch) { return gpost('update', { id: id, patch: patch }).then(apply); },
        delete: function () { return gpost('delete', { id: id }).then(apply); },
        set: ro
      }; };
      return {
        doc: function (p) {
          if (p.indexOf('graphics/') === 0) return gdoc(p.slice(9));
          return { onSnapshot: function (cb) { try { cb(dsnap(p)); } catch (e) {} return function () {}; }, get: function () { return Promise.resolve(dsnap(p)); }, set: ro, update: ro, delete: ro };
        },
        collection: function (p) {
          if (p === 'graphics') { var gc = { onSnapshot: function (cb) { G.cb = cb; emitG(); return function () { G.cb = null; }; }, orderBy: function () { return gc; }, limit: function () { return gc; }, add: function (doc) { return gpost('add', { doc: doc }).then(function (j) { apply(j); return { id: j.id }; }); } }; return gc; }
          var c = { onSnapshot: function (cb) { try { cb(toDocs((D.colls && D.colls[p]) || [])); } catch (e) {} return function () {}; }, orderBy: function () { return c; }, limit: function () { return c; }, add: ro }; return c;
        }
      };
    }
    if (name === 'user') { return { canEdit: function () { return Promise.resolve(false); }, isOwner: function () { return Promise.resolve(false); }, id: function () { return Promise.resolve(null); } }; }
    if (name === 'assets' && D.canUpload) {
      return {
        upload: function (file, opts) {
          if (file && file.size > 4000000) return Promise.reject(Object.assign(new Error('too large'), { code: 'too_large' }));
          var ct = (opts && opts.type) || (file && file.type) || 'application/octet-stream';
          return fetch('/api/hq/assets', { method: 'POST', headers: { 'Content-Type': ct }, body: file }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Object.assign(new Error(j.error || 'upload failed'), { code: j.code }); return { id: j.id, contentType: j.contentType, sizeBytes: j.sizeBytes }; }); });
        },
        delete: function (id) { return fetch('/api/hq/assets?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) { if (!r.ok) throw new Error('delete failed'); return true; }); }
      };
    }
    if (name === 'downloads') {
      // Real browser download for the per-graphic Download button and the
      // "All versions (ZIP)" export. Same-origin blob, so a plain link works.
      return {
        save: function (opts) {
          try {
            var url = URL.createObjectURL(opts.data);
            var a = document.createElement('a');
            a.href = url; a.download = (opts && opts.filename) || 'download';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1500);
            return Promise.resolve(true);
          } catch (e) { return Promise.reject(e); }
        }
      };
    }
    return null;
  }
};`;

export async function GET(request: NextRequest) {
  // Access needs a staff session OR edit-mode (team password) cookie.
  const canUpload = !!editorFromRequest(request);
  if (!staffFromRequest(request) && !canUpload) {
    return NextResponse.redirect(new URL("/hq/signin", request.url));
  }

  // Real snapshot when uploaded; off-production, fall back to the committed
  // FICTIONAL demo dataset so /hq is shareable on staging with no upload.
  let data = (await getJson<HqData>("hq.json")) ?? null;
  if (!data && previewEnabled()) data = demoHq as HqData;
  if (!data) {
    return new Response("Ambassador HQ data hasn't been loaded yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  // Graphics live in their own store so team uploads survive the weekly refresh.
  // Seed it from the snapshot on first ever load, then it is the source of truth.
  let live = await getGraphics();
  if (live == null) {
    live = Array.isArray(data.colls?.graphics) ? (data.colls!.graphics as Graphic[]) : [];
    await putGraphics(live);
  }

  // Live application feed → Applicants tab. Merge in applicants that arrived via
  // the site form (lib/ambassadors/applicants-store), newest first, de-duped
  // against the sheet import so nobody shows twice. Best-effort. A fresh doc is
  // built rather than mutating the (possibly shared) snapshot object.
  const liveApps = await getLiveApplicants().catch(() => [] as Applicant[]);
  const a1 = data.docs?.["program/applicants-1"] as { applicants?: Applicant[] } | undefined;
  const a2 = data.docs?.["program/applicants-2"] as { applicants?: Applicant[] } | undefined;
  const seen = new Set<string>();
  for (const d of [a1, a2]) {
    for (const p of d?.applicants ?? []) {
      const e = String((p as { email?: string }).email ?? "").toLowerCase().trim();
      if (e) seen.add(e);
    }
  }
  const fresh = liveApps.filter((p) => {
    const e = (p.email ?? "").toLowerCase().trim();
    return e && !seen.has(e);
  });
  const mergedApps1 = fresh.length ? { ...(a1 ?? {}), applicants: [...fresh, ...(a1?.applicants ?? [])] } : a1;

  const inject: HqData & { canUpload: boolean } = {
    ...data,
    docs: { ...(data.docs ?? {}), ...(mergedApps1 ? { "program/applicants-1": mergedApps1 } : {}) },
    colls: { ...(data.colls ?? {}), graphics: live },
    canUpload,
  };

  const tmpl = await fs.readFile(path.join(process.cwd(), "lib/hq/hq-template.html"), "utf8");
  const injected = `<script src="/hq/stamp.js"></script>\n<script>window.__HQ__=${JSON.stringify(inject)};\n${SHIM}\n</script>`;
  const html = tmpl.replace('<script src="stamp.js"></script>', injected);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
