import { NextResponse } from "next/server";
import { deleteSubscription, pushStoreConfigured, saveSubscription } from "@/lib/push-store";

/**
 * A phone's native push token (APNs on iOS, FCM on Android) and the pros it
 * follows. Stored in the same table as web-push subscriptions, keyed by a
 * prefixed pseudo-endpoint ("apns:<token>" / "fcm:<token>") so every existing
 * routing query — subscribersFollowing, allSubscribers — returns phones too.
 * lib/push-send dispatches on that prefix.
 *
 *   POST   { token, platform: "ios" | "android", follows: string[] }
 *   DELETE { token, platform }
 */
export const dynamic = "force-dynamic";

type Body = { token?: string; platform?: string; follows?: unknown };

function endpointFor(platform: string, token: string): string | null {
  if (!/^[A-Za-z0-9:_\-]{20,400}$/.test(token)) return null;
  if (platform === "ios") return `apns:${token}`;
  if (platform === "android") return `fcm:${token}`;
  return null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const endpoint = body.token && body.platform ? endpointFor(body.platform, body.token) : null;
  if (!endpoint) return NextResponse.json({ error: "bad token" }, { status: 400 });
  if (!pushStoreConfigured()) return NextResponse.json({ stored: false });
  const follows = Array.isArray(body.follows)
    ? body.follows.filter((f): f is string => typeof f === "string").slice(0, 200)
    : [];
  try {
    await saveSubscription({ endpoint, p256dh: "native", auth: body.platform as string, follows });
    return NextResponse.json({ stored: true, follows: follows.length });
  } catch {
    return NextResponse.json({ stored: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const endpoint = body.token && body.platform ? endpointFor(body.platform, body.token) : null;
  if (!endpoint) return NextResponse.json({ error: "bad token" }, { status: 400 });
  if (!pushStoreConfigured()) return NextResponse.json({ removed: false });
  await deleteSubscription(endpoint);
  return NextResponse.json({ removed: true });
}
