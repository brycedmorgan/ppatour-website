import { NextResponse, type NextRequest } from "next/server";

import { devGate, devGateBlock, isDevHost } from "@/lib/dev-gate";
import { PADDLE_LAB_PUBLIC } from "@/lib/paddle-lab-access";
import {
  NEWSROOM_COOKIE,
  NEWSROOM_PATH,
  newsroomUrlKey,
  verifySessionToken,
} from "@/lib/newsroom/session";

/**
 * The site's request proxy (Next 16's replacement for `middleware.ts`).
 *
 * The Newsroom dashboard sign-in gate is at the top (newsroomGate). Otherwise
 * it does one job: it puts HTTP Basic auth in front of every
 * /paddle-lab route while `PADDLE_LAB_PUBLIC` is false. See
 * lib/paddle-lab-access.ts for who asked and why.
 *
 * ⚠ IT FAILS CLOSED. A missing or empty `PADDLE_LAB_PASSWORD` refuses every
 * request rather than opening the lab to the world. A gate that quietly stops
 * being a gate when a deploy loses an environment variable is worse than no
 * gate, because nobody notices.
 *
 * ⚠ IT RUNS BEFORE NEXT RENDERS ANYTHING, WHICH IS THE POINT. The lab pages are
 * prerendered static HTML; a check inside the page component would ship the
 * measurements to the browser and then hide them. This never serves the bytes.
 *
 * Set the credentials in Vercel (Production + Preview) and in .env.local:
 *   PADDLE_LAB_USER=ppa            (optional, defaults to "ppa")
 *   PADDLE_LAB_PASSWORD=…
 */

const REALM = "PPA Tour Paddle Lab";

/** Constant-time-ish string compare, so a wrong password leaks no timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function challenge(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      // A 401 already keeps the content out of the index. Say it out loud too,
      // so a crawler holding an old /paddle-lab URL drops it rather than
      // keeping a bare, contentless result. Deliberately NOT a robots.txt
      // Disallow: a disallowed URL can never be recrawled to learn it is gone.
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * The Newsroom dashboard. It is served ONLY at its secret address,
 * `/<NEWSROOM_URL_KEY>/…`, rewritten onto the internal `/newsroom/…` route.
 *
 * - The internal route itself, a wrong key, or no key configured: the site's
 *   ordinary 404, indistinguishable from any other missing page, so probing
 *   reveals nothing.
 * - Right key, signed out: sign-in (and the second-step screens, which check
 *   their own short-lived cookie) are reachable; everything else redirects to
 *   sign-in.
 * - The upload API answers 401 without a full session.
 *
 * Every page and action also checks the session itself (lib/newsroom/auth.ts),
 * so this is the first gate, not the only one.
 */
const NOT_FOUND_PATH = "/__not-found__/";
const KEYED = /^\/(nr-[a-z0-9]{24})(\/.*)?$/;
const OPEN_STEPS = new Set(["/login/", "/setup/", "/verify/"]);

function privateHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  // Links out of the dashboard must not carry its address in a Referer.
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

function notFound(request: NextRequest): NextResponse {
  // Through the app's own catch-all, so it's the normal site 404 page.
  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
}

async function newsroomGate(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/newsroom/")) {
    const session = await verifySessionToken(request.cookies.get(NEWSROOM_COOKIE)?.value);
    return privateHeaders(
      session ? NextResponse.next() : NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  const m = KEYED.exec(pathname);
  const key = newsroomUrlKey();
  if (!m || !key || !safeEqual(m[1], key)) return notFound(request);

  const rest = m[2] && m[2] !== "/" ? (m[2].endsWith("/") ? m[2] : `${m[2]}/`) : "/";
  const target = new URL(`${NEWSROOM_PATH}${rest}${search}`, request.url);

  if (OPEN_STEPS.has(rest)) return privateHeaders(NextResponse.rewrite(target));

  const session = await verifySessionToken(request.cookies.get(NEWSROOM_COOKIE)?.value);
  if (!session) {
    return privateHeaders(NextResponse.redirect(new URL(`/${key}/login/`, request.url)));
  }
  return privateHeaders(NextResponse.rewrite(target));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The dev site (dev.ppatour.com): basic auth on every page, FIRST.
  // lib/dev-gate.ts. A signed-in dev request carries on, so the Newsroom's own
  // gate below still applies to its secret address there.
  const dev = isDevHost(request);
  if (dev) {
    const blocked = devGateBlock(request);
    if (blocked) return blocked;
  }

  if (
    pathname === NEWSROOM_PATH ||
    pathname.startsWith(`${NEWSROOM_PATH}/`) ||
    pathname.startsWith("/api/newsroom/") ||
    KEYED.test(pathname)
  ) {
    return newsroomGate(request);
  }

  // Every other dev request: the dev pass-through (noindex, private). Never
  // the Paddle Lab password check below, which the dev login would collide with.
  if (dev) return devGate(request);

  // Private ambassador + HQ areas: stamp every response noindex at the HTTP
  // layer (belt-and-suspenders with the per-page robots meta and robots.ts
  // disallow). No auth here — the pages/routes guard themselves on the session.
  if (
    pathname === "/ambassadors" ||
    pathname.startsWith("/ambassadors/") ||
    pathname === "/hq" ||
    pathname.startsWith("/hq/")
  ) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res;
  }

  if (PADDLE_LAB_PUBLIC) return NextResponse.next();

  const password = process.env.PADDLE_LAB_PASSWORD;
  if (!password) return challenge();

  const user = process.env.PADDLE_LAB_USER || "ppa";
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return challenge();

  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return challenge();
  }

  // Split on the FIRST colon only — a password may contain colons, a username
  // may not.
  const split = decoded.indexOf(":");
  if (split < 0) return challenge();

  const okUser = safeEqual(decoded.slice(0, split), user);
  const okPassword = safeEqual(decoded.slice(split + 1), password);
  // Both compares always run; never short-circuit on the username.
  if (!okUser || !okPassword) return challenge();

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/**
 * ⚠ BOTH ENTRIES ARE NEEDED, BECAUSE `trailingSlash: true` (next.config.ts).
 * Next answers `/paddle-lab` with a 308 to `/paddle-lab/` before any proxy runs
 * — a redirect, so no content leaks — and `/paddle-lab/:path*` is what actually
 * catches the slashed landing page and every page under it. The bare entry
 * stays so the gate survives someone turning `trailingSlash` off.
 */
export const config = {
  matcher: [
    // Dev site only: every path except build assets and images, and ONLY when
    // the Host is a dev host, so production never enters the proxy for it.
    // Keep the host regex in step with DEV_HOST in lib/dev-gate.ts.
    {
      source: "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)$).*)",
      has: [
        {
          type: "host",
          value: "(?:dev\\.ppatour\\.com|ppatour-website-git-dev-bryce-pickleballs-projects\\.vercel\\.app)",
        },
      ],
    },
    "/paddle-lab",
    "/paddle-lab/:path*",
    "/ambassadors",
    "/ambassadors/:path*",
    "/hq",
    "/hq/:path*",
    "/newsroom",
    "/newsroom/:path*",
    "/api/newsroom/:path*",
    // The dashboard's secret address. Only the SHAPE is here (matchers must be
    // literals, and this repo is public); the key is NEWSROOM_URL_KEY.
    "/:key(nr-[a-z0-9]{24})",
    "/:key(nr-[a-z0-9]{24})/:path*",
  ],
};
