import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic auth in front of the whole dev site (dev.ppatour.com, the `dev` branch).
 *
 * proxy.ts calls this first. Its matcher only sends requests here when the Host
 * is a dev host (`has: [{ type: "host" }]`), so production requests never reach
 * the proxy for this gate at all: www.ppatour.com pays nothing for it.
 *
 * ⚠ IT FAILS CLOSED. A missing `DEV_SITE_PASSWORD` refuses every request.
 *
 * ⚠ THE CREDENTIALS LIVE ONLY IN VERCEL (Preview, branch `dev`). This repo is
 * public. Never put them in code.
 *   DEV_SITE_USER=…        (optional, defaults to "ppa")
 *   DEV_SITE_PASSWORD=…
 */

const REALM = "PPA Tour Dev";

/**
 * Hosts that get the gate. Keep in step with the `has` host regex in proxy.ts's
 * matcher (matchers must be literals, so it can't import this).
 */
const DEV_HOST = /^(?:dev\.ppatour\.com|ppatour-website-git-dev-bryce-pickleballs-projects\.vercel\.app)$/i;

const NOINDEX = "noindex, nofollow, noarchive";

export function isDevHost(request: NextRequest): boolean {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  return DEV_HOST.test(host);
}

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
      "X-Robots-Tag": NOINDEX,
      "Cache-Control": "no-store",
    },
  });
}

function authorized(request: NextRequest): boolean {
  const password = process.env.DEV_SITE_PASSWORD;
  if (!password) return false;
  const user = process.env.DEV_SITE_USER || "ppa";

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const split = decoded.indexOf(":");
  if (split < 0) return false;
  const okUser = safeEqual(decoded.slice(0, split), user);
  const okPassword = safeEqual(decoded.slice(split + 1), password);
  return okUser && okPassword;
}

/**
 * The response for a dev-host request: robots.txt that disallows everything
 * (served without auth, so a crawler can read it), a 401 challenge, or a
 * pass-through stamped noindex + no-store.
 */
export function devGate(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": NOINDEX,
        "Cache-Control": "no-store",
      },
    });
  }
  if (!authorized(request)) return challenge();
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", NOINDEX);
  // Keep the authed HTML out of shared caches; the CDN must not hand it to a
  // visitor who hasn't logged in.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
