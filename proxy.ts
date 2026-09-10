import { NextResponse, type NextRequest } from "next/server";

import { PADDLE_LAB_PUBLIC } from "@/lib/paddle-lab-access";

/**
 * The site's request proxy (Next 16's replacement for `middleware.ts`).
 *
 * Today it does exactly one job: it puts HTTP Basic auth in front of every
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

export default function proxy(request: NextRequest) {
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
  matcher: ["/paddle-lab", "/paddle-lab/:path*"],
};
